import { z } from "zod"

const configSchema = z.object({
  cryptoSecret: z.string().nonempty(),
  staticDir: z.string().nonempty(),
  sessionDurationSeconds: z.number().int().positive(),
  githubClientId: z.string().nonempty(),
  githubClientSecret: z.string().nonempty(),
  githubOrgAdminToken: z.string().nonempty(),
  githubOrgName: z.string().nonempty(),
})

export function validateConfig(config: unknown) {
  return configSchema.parse(config)
}
