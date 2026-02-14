<h1 align="center">
  ▲🔐 Vercel GitHub OAuth Proxy
</h1>

<p align="center">
  Protect a static website hosted on Vercel behind GitHub authentication.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/vercel-github-oauth-proxy">
    <img alt="Version" src="https://img.shields.io/npm/v/vercel-github-oauth-proxy?style=flat-square&logo=npm">
  </a>

  <a href="https://raw.githubusercontent.com/n4bb12/vercel-github-oauth-proxy/main/LICENSE">
    <img alt="License" src="https://img.shields.io/badge/license-ISC-blue?style=flat-square&logo=github">
  </a>
  
  <a href="https://github.com/n4bb12/vercel-github-oauth-proxy/issues/new/choose">
    <img alt="Issues" src="https://img.shields.io/badge/github-create%20issue-brightgreen?style=flat-square&logo=github">
  </a>
</p>

## Setup

### Step 1 — Add the library

```
bun add vercel-github-oauth-proxy
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

`config.sessionDurationSeconds`

The duration of the session in seconds. After this time, the user will need to
re-authenticate.

`config.githubOrgName`

The GitHub organization users need to be part of in order to be able to sign in.

You cannot use your personal GitHub account for this, you need an organization.

`config.githubClientId`
`config.githubClientSecret`

The id/secret pair of your GitHub OAuth app.

Create a new OAuth app at
`https://github.com/organizations/{config.githubOrgName}/settings/applications/new`

`config.githubOrgAdminToken`

Create a token with `read:org` permission at <https://github.com/settings/tokens>.

The reason you need a token is that private org memberships can only be
determined by making an authenticated API request.

We could request `read:org` scope during the OAuth flow and then use each user's
access token to determine org membership, but using this method means the user
additionally needs to request org access during or after the login flow and
requires an org admin to confirm. This makes this approach inconvenient for both
the users and the admin.

Therefore we're using a separate org admin token to verify membership during
login (org admins can see all users).

### Step 3 — Create a `vercel.json`

```json
{
  "version": 2,
  "routes": [{ "src": "/(.*)", "dest": "/api/index.ts" }],
  "functions": {
    "api/index.ts": {
      "includeFiles": "static/**"
    }
  }
}
```

This routes all traffic through the lambda endpoint.

Adapt `includeFiles` to your public output folder. Including these files is
required because the static website needs to be deployed as part of the lambda
function, not the default build. See also these docs:

- [functions](https://vercel.com/docs/projects/project-configuration#functions)
- [size limits](https://vercel.com/docs/functions/serverless-functions/runtimes#size-limits).

### Step 4 — Build

If you have an existing `build` script, rename it to `vercel-build` to build
your website as part of the lambda build instead of the normal build.

Make sure to not keep the `build` script as it would result in duplicate work or
may break deployment entirely. For more information see
[custom-build-step-for-node-js](https://vercel.com/docs/functions/serverless-functions/runtimes/node-js#custom-build-step-for-node.js).

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
bunx vercel dev
```

When developing locally, you'll need to update your GitHub OAuth app's redirect
URL to `http://localhost:3000`.
