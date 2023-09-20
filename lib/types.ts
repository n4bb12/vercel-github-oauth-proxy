export interface Config {
  cryptoSecret: string
  staticDir: string
  sessionDurationSeconds: number
  githubClientId: string
  githubClientSecret: string
  githubOrgAdminToken: string
  githubOrgName: string
}

export interface OAuthState {
  randomToken: string
  path: string
}

export interface RoutePrams {
  Querystring: {
    code?: string
    state?: string
  }
}

export interface GitHubAccessToken {
  token_type: string
  access_token: string
}

export interface GitHubOrgMembership {
  login: string
}

export interface GitHubUser {
  login: string
}

export interface StaticFallbacks {
  [url: string]: string
}
