import path from "path"

import { createLambdaProxyAuthHandler } from "../lib"

export default createLambdaProxyAuthHandler({
  cryptoSecret: process.env.CRYPTO_SECRET!,
  githubClientId: process.env.GITHUB_CLIENT_ID!,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET!,
  githubOrgAdminToken: process.env.GITHUB_ORG_ADMIN_TOKEN!,
  githubOrgName: process.env.GITHUB_ORG_NAME!,
  staticDir: path.resolve(__dirname, "../static"),
  sessionDurationSeconds: 604800, // 1 week
})
