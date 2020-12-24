import { FastifyInstance } from "fastify"
import fastifyStatic from "fastify-static"
import path from "path"

import { Config } from "./types"

//
// https://github.com/fastify/fastify-static#fastify-static
//
export function registerServeStatic(server: FastifyInstance, config: Config) {
  server.setNotFoundHandler((req, res) => {
    res.sendFile("index.html", config.staticDir)
  })
  server.register(fastifyStatic, {
    root: path.resolve(config.staticDir),
  })
}
