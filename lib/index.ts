import { VercelApiHandler } from "@vercel/node"
import fastify from "fastify"
import assert from "ow"

import { registerCookieMiddleware } from "./fastify-cookie"
import { createLambdaHandler } from "./fastify-lambda"
import { registerServeStatic } from "./fastify-static"
import { registerGitHubOAuth } from "./github-oauth"
import { Config } from "./types"

export const createLambdaProxyAuthHandler: (
  config: Config,
) => VercelApiHandler = (config) => {
  assert(config.cryptoSecret, "config.cryptoSecret", assert.string.nonEmpty)
  assert(config.githubClientId, "config.githubClientId", assert.string.nonEmpty)
  assert(
    config.githubClientSecret,
    "config.githubClientSecret",
    assert.string.nonEmpty,
  )
  assert(
    config.githubOrgAdminToken,
    "config.githubOrgAdminToken",
    assert.string.nonEmpty,
  )
  assert(config.githubOrgName, "config.githubOrgName", assert.string.nonEmpty)

  const server = fastify({ logger: true })

  registerCookieMiddleware(server, config)
  registerGitHubOAuth(server, config)
  registerServeStatic(server, config)

  return createLambdaHandler(server)
}

export type { Config } from "./types"
