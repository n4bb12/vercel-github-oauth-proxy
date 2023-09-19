import fastifyStatic from "@fastify/static"
import { FastifyInstance } from "fastify"
import path from "path"

import { Config } from "./types"

//
// https://github.com/fastify/fastify-static
//
export function registerServeStatic(server: FastifyInstance, config: Config) {
  server.register(fastifyStatic, {
    root: path.resolve(config.staticDir),
  })

  server.setNotFoundHandler(function (request, reply) {
    reply.sendFile("index.html")
  })
}
