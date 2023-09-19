import { VercelApiHandler, VercelRequest, VercelResponse } from "@vercel/node"
import { FastifyInstance } from "fastify"

//
// https://fastify.dev/docs/latest/Guides/Serverless#vercel
// https://vercel.com/docs/functions/serverless-functions/runtimes/node-js#using-typescript-with-the-node.js-runtime
//
export const createLambdaHandler: (
  server: FastifyInstance,
) => VercelApiHandler = (server) => {
  return async (req: VercelRequest, res: VercelResponse) => {
    await server.ready()
    server.server.emit("request", req, res)
  }
}
