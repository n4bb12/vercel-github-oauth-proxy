import { NowApiHandler, NowRequest, NowResponse } from "@vercel/node"
import { FastifyInstance } from "fastify"

//
// https://www.fastify.io/docs/latest/Serverless/#vercel
// https://vercel.com/docs/serverless-functions/supported-languages#using-typescript
//
export const createLambdaHandler: (server: FastifyInstance) => NowApiHandler = (
  server,
) => {
  return async (req: NowRequest, res: NowResponse) => {
    await server.ready()
    server.server.emit("request", req, res)
  }
}
