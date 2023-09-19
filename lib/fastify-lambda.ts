import { VercelApiHandler, VercelRequest, VercelResponse } from "@vercel/node"
import { FastifyInstance } from "fastify"

//
// https://www.fastify.io/docs/latest/Serverless/#vercel
// https://vercel.com/docs/serverless-functions/supported-languages#using-typescript
//
export const createLambdaHandler: (
  server: FastifyInstance,
) => VercelApiHandler = (server) => {
  return async (req: VercelRequest, res: VercelResponse) => {
    await server.ready()
    server.server.emit("request", req, res)
  }
}
