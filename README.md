# ▲🔐 vercel-github-oauth-proxy

Protect a static website hosted on Vercel behind GitHub authentication.

## Setup

### Step 1 — Add the library

```
yarn add vercel-github-oauth-proxy
```

### Step 2 — Create an API endpoint at `/api/index.ts`

```ts
import { createLambdaProxyAuthHandler } from "vercel-github-oauth-proxy"

export default createLambdaProxyAuthHandler(config)
```

`config.cryptoSecret`

This is used to sign cookies.

`config.staticDir`

The output directory of the static website.

`config.githubOrgName`

The GitHub org users need to be part of.

`config.githubClientId`
`config.githubClientSecret`

The id/secret pair of your GitHub OAuth app.
You can create a new app at `https://github.com/organizations/{config.githubOrgName}/settings/applications/new`

`config.githubOrgAdminToken`

Private org memberships can only be determined by making an authenticated API request.

We could request `read:org` scope during the OAuth flow and then use each user's access token to determine org membership, but using this method means the user additionally needs to request org access during or after the login flow and requires an org admin to confirm. This makes this approach inconvenient for both the users and the admin.

Therefore we're using a separate org admin token to verify membership during login (org admins can see all users).

### Step 3 — Create a `vercel.json`

```json
{
  "version": 2,
  "routes": [{ "src": "/(.*)", "dest": "/api/index.ts" }],
  "functions": {
    "api/index.ts": {
      "includeFiles": "**"
    }
  }
}
```

This routes all traffic through the lambda endpoint.

Note that we also include all repo files in the lambda build. This is required because the static website needs to be deployed as part of the lambda function, not the default build. See also the [function docs](https://vercel.com/docs/configuration?query=includeFiles#project/functions) and [limits](https://vercel.com/docs/platform/limits?query=includeFiles#serverless-function-size).

### Step 4 — Build

To build your website during lambda deploylent, add a `vercel-build` step that builds your website.

```json
{
  "scripts": {
    "vercel-build": "your website build command"
  }
}
```

## Local development

To develop locally, run

```
yarn vercel dev
```

When developing locally, you'll need to update your GitHub OAuth app's redirect URL to `http://localhost:3000`.
