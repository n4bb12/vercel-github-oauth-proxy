import { FastifyInstance } from "fastify"
import fastifyCookie from "@fastify/cookie"

import { Config } from "./types"

//
// https://github.com/fastify/fastify-cookie#fastify-cookie
//
export function registerCookieMiddleware(
  server: FastifyInstance,
  config: Config,
) {
  server.register(fastifyCookie, { secret: config.cryptoSecret })
}
