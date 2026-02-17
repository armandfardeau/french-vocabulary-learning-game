# French Vocabulary Learning Game
  
This is a project built with [Chef](https://chef.convex.dev) using [Convex](https://convex.dev) as its backend.
 You can find docs about Chef with useful information like how to deploy to production [here](https://docs.convex.dev/chef).
  
This project is connected to the Convex deployment named [`expert-pigeon-936`](https://dashboard.convex.dev/d/expert-pigeon-936).
  
## Project structure
  
The frontend code is in the `app` directory and is built with [Vite](https://vitejs.dev/).
  
The backend code is in the `convex` directory.
  
`npm run dev` will start the frontend and backend servers.

## App authentication

Chef apps use [Convex Auth](https://auth.convex.dev/) with Anonymous auth for easy sign in. You may wish to change this before deploying your app.

## Developing and deploying your app

Check out the [Convex docs](https://docs.convex.dev/) for more information on how to develop with Convex.
* If you're new to Convex, the [Overview](https://docs.convex.dev/understanding/) is a good place to start
* Check out the [Hosting and Deployment](https://docs.convex.dev/production/) docs for how to deploy your app
* Read the [Best Practices](https://docs.convex.dev/understanding/best-practices/) guide for tips on how to improve you app further

## Deploying to Netlify (Convex Auth)

This repo includes a `netlify.toml` that deploys Convex and builds the Vite app in one step.

1. In Netlify, set the environment variable `CONVEX_DEPLOY_KEY` for your site.
2. Make sure the build command is picked up from `netlify.toml` (or set it to:
`npx convex deploy --cmd 'npm run build' --cmd-url-env-var-name VITE_CONVEX_URL`).
3. Configure Convex Auth production environment variables on your Convex deployment (not in Netlify) by running `npx @convex-dev/auth --prod` locally and following the prompts.
4. If you use OAuth or magic links, set `SITE_URL` and any provider secrets on the Convex deployment.
5. Redeploy from Netlify to publish the site with the production Convex URL wired into `VITE_CONVEX_URL`.

## HTTP API

User-defined http routes are defined in the `convex/router.ts` file. We split these routes into a separate file from `convex/http.ts` to allow us to prevent the LLM from modifying the authentication routes.
