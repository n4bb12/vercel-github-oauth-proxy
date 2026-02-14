import { URLSearchParams } from "node:url"
import axios, { AxiosError } from "axios"
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { nanoid } from "nanoid"
import type {
  Config,
  GitHubAccessToken,
  GitHubOrgMembership,
  GitHubUser,
  OAuthState,
  RoutePrams,
} from "./types"

export function registerGitHubOAuth(server: FastifyInstance, config: Config) {
  const secureCookies = !!process.env.VERCEL_URL

  const urls = {
    localAuthorize: "/login/oauth/authorize",
    localMembershipError: "/login/oauth/error-membership",
    localGenericError: "/login/oauth/error",
    githubAuthorize: "https://github.com/login/oauth/authorize",
    githubToken: "https://github.com/login/oauth/access_token",
    githubOrgMembers: `https://api.github.com/orgs/${config.githubOrgName}/members`,
    githubUserDetails: "https://api.github.com/user",
  }

  const cookieNames = {
    state: "state",
    user: "user",
  } as const

  const formatQueryParams = (params: Record<string, any>) => {
    return "?" + new URLSearchParams(params).toString()
  }

  const unsignCookie = (res: FastifyReply, value: string) => {
    const unsigned = res.unsignCookie(value)

    if (unsigned.valid) {
      return JSON.parse(unsigned.value || "null")
    }
  }

  /**
   * Make sure the authentication request was initiated by this application.
   */
  const initiateOAuth = async (req: FastifyRequest, res: FastifyReply) => {
    const state: OAuthState = {
      randomToken: nanoid(),
      path: req.url,
    }

    res.clearCookie(cookieNames.user)
    res.setCookie(cookieNames.state, JSON.stringify(state), {
      httpOnly: true,
      maxAge: config.sessionDurationSeconds,
      path: "/",
      sameSite: "lax",
      secure: secureCookies,
      signed: true,
    })
    res.redirect(urls.localAuthorize, 302)
  }

  //
  // https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#web-application-flow
  //
  const redirectToGitHub = async (
    req: FastifyRequest<RoutePrams>,
    res: FastifyReply,
  ) => {
    const query = formatQueryParams({
      client_id: config.githubClientId,
      scope: "read:user",
      state: req.cookies[cookieNames.state],
    })
    res.redirect(urls.githubAuthorize + query, 302)
  }

  const denyAccess = async (res: FastifyReply, message?: string) => {
    res.clearCookie(cookieNames.user)
    res.clearCookie(cookieNames.state)
    res.status(401).send({
      statusCode: 401,
      error: "Unauthorized",
      message,
    })
  }

  const getGitHubAccessToken = async (
    code: string,
  ): Promise<GitHubAccessToken> => {
    const url = urls.githubToken
    const headers = {
      Accept: "application/json",
    }
    const body = {
      client_id: config.githubClientId,
      client_secret: config.githubClientSecret,
      code,
    }

    const { data } = await axios.post<GitHubAccessToken>(url, body, {
      headers,
    })

    return data
  }

  const getGitHubUser = async (
    tokenData: GitHubAccessToken,
  ): Promise<GitHubUser> => {
    const url = urls.githubUserDetails
    const headers = {
      Accept: "application/json",
      Authorization: `${tokenData.token_type} ${tokenData.access_token}`,
    }

    const { data } = await axios.get<GitHubUser>(url, { headers })

    return data
  }

  const getGitHubOrgMemberships = async (
    page = 1,
  ): Promise<GitHubOrgMembership[]> => {
    const url = urls.githubOrgMembers
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${config.githubOrgAdminToken}`,
    }

    const params = {
      per_page: 100,
      page,
    }

    const { data } = await axios.get<GitHubOrgMembership[]>(url, {
      headers,
      params,
    })

    return data
  }

  const retrieveState = (
    req: FastifyRequest<RoutePrams>,
    res: FastifyReply,
  ) => {
    const state: OAuthState = unsignCookie(res, req.query.state || "")
    const expectedState: OAuthState = unsignCookie(
      res,
      req.cookies[cookieNames.state] || "",
    )

    if (
      !state?.randomToken ||
      state.randomToken !== expectedState?.randomToken
    ) {
      throw new Error(
        `State mismatch: ${state?.randomToken} !== ${expectedState?.randomToken}`,
      )
    }

    return state
  }

  const succeed = (res: FastifyReply, user: GitHubUser, path: string) => {
    res.setCookie(cookieNames.user, JSON.stringify(user), {
      httpOnly: false,
      maxAge: config.sessionDurationSeconds,
      path: "/",
      sameSite: "lax",
      secure: secureCookies,
      signed: false,
    })
    res.redirect(path, 302)
  }

  //
  // https://fastify.dev/docs/latest/Reference/Hooks
  //
  server.addHook<RoutePrams>("preValidation", async (req, res) => {
    try {
      if (req.url === urls.localMembershipError) {
        return denyAccess(
          res,
          "It appears you are not a member of the required GitHub organization.",
        )
      }

      if (req.url === urls.localGenericError) {
        return denyAccess(
          res,
          "It appears that the authentication request was initiated or processed incorrectly.",
        )
      }

      if (req.url === urls.localAuthorize) {
        return redirectToGitHub(req, res)
      }

      if (req.cookies[cookieNames.state] && req.cookies[cookieNames.user]) {
        if (req.query.state || req.query.code) {
          const state = retrieveState(req, res)
          return res.redirect(state.path, 302)
        }
        return
      }

      const code = req.query.code

      if (!code) {
        return initiateOAuth(req, res)
      }

      const state = retrieveState(req, res)
      const tokenData = await getGitHubAccessToken(code)
      const user = await getGitHubUser(tokenData)

      console.log("Login attempt:", user.login)

      let members: GitHubOrgMembership[] = []
      let page = 1
      let isUserMember = false

      do {
        members = await getGitHubOrgMemberships(page)
        page++
        isUserMember = members.some((member) => member.login === user.login)
      } while (!isUserMember && members.length)

      if (!members.find((member) => member.login === user.login)) {
        return res.redirect(urls.localMembershipError, 302)
      }

      return succeed(res, user, state.path)
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error(error.toJSON())
      } else if (error instanceof Error) {
        console.error(error.stack)
      }
      return res.redirect(urls.localGenericError, 302)
    }
  })
}
