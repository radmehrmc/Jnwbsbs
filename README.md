# BinVault (Glass UI) — Ready project

Structure:
- /bins.json               — initial empty array
- /api/bins.js             — serverless API (supports GitHub-backed storage via env vars)
- /public/index.html       — main app
- /public/bin.html         — bin viewer for /bin/{id}
- /public/style.css
- /public/script.js
- /vercel.json             — routes & builds

## Deployment (recommended)
1. Create a GitHub repo and push this project.
2. On Vercel, import the repo.
3. Set the Output Directory to `/public` (Vercel will still use /api for functions).
4. (Optional but recommended) Configure GitHub-backed storage:
   - Create a GitHub Personal Access Token with `repo` scope.
   - In Vercel project settings -> Environment Variables, set:
     - `GITHUB_TOKEN` = your token
     - `GITHUB_REPO` = owner/repo (e.g. username/reponame)
     - `GITHUB_BRANCH` = branch name (default: main)
   With those set, the API will update `bins.json` in your repo when a bin is published.
5. Deploy.

## Local development
- You can run a Node server to test the API locally using e.g. `vercel dev` or `node` with a simple server.
- If GITHUB_TOKEN is not set, the API will read/write local `bins.json`.

## Notes
- Vercel serverless filesystem is read-only — that's why GitHub-backed commits are used for persistent storage.
- You must provide `GITHUB_TOKEN` and `GITHUB_REPO` in Vercel to enable saves in production.

Enjoy — upload to GitHub and deploy to Vercel.
