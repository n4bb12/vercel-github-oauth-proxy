import { FastifyInstance } from "fastify"
import fastifyStatic from "@fastify/static"
import globby from "globby"
import path from "path"

import { Config, StaticFallbacks } from "./types"

//
// Unfortunately I couldn't make fastify-static add a fallback to /path/index.html when /path is requested.
// Therefore this collects those fallbacks once on startup.
//
function collectFallbacks(staticDir: string) {
  const files = globby.sync("", { cwd: staticDir, onlyFiles: true })

  const fallbacks = files.reduce((result, filename) => {
    if (!filename.includes("/")) {
      return result
    }
    if (!filename.endsWith(".html") && !filename.endsWith(".htm")) {
      return result
    }

    const directory = path.dirname(filename)
    const url = "/" + directory

    if (result[url]) {
      return result
    }

    if (!result[directory]) {
      const fallbackDir = path.resolve(staticDir, directory)
      result["/" + directory] = fallbackDir
    }

    return result
  }, {} as StaticFallbacks)

  return fallbacks
}

//
// https://github.com/fastify/fastify-static#fastify-static
//
export function registerServeStatic(server: FastifyInstance, config: Config) {
  const fallbacks = collectFallbacks(config.staticDir)

  server.setNotFoundHandler(async (req, res) => {
    const fallbackDir = fallbacks[req.url]
    if (fallbackDir) {
      res.sendFile("index.html", fallbackDir)
    } else {
      res.sendFile("index.html", config.staticDir)
    }
  })

  server.register(fastifyStatic, {
    root: path.resolve(config.staticDir),
    extensions: ["html", "htm"],
  })
}
