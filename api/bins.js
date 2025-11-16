import fs from "fs";
import path from "path";
import fetch from "node-fetch";

/*
API behavior:
- If GITHUB_TOKEN and GITHUB_REPO are set in environment, API reads/writes bins.json in the GitHub repo (commits updates).
- Otherwise (local dev), it reads/writes the local /bins.json file (works when running locally, not on Vercel serverless).
Environment variables (for GitHub mode):
  GITHUB_TOKEN : personal access token with repo access
  GITHUB_REPO  : owner/repo (e.g. username/reponame)
  GITHUB_BRANCH: branch to commit to (default: main)
Notes:
- On Vercel, set those env vars in Project Settings > Environment Variables.
*/

const filePath = path.join(process.cwd(), "bins.json");

async function readLocal() {
  if (!fs.existsSync(filePath)) return [];
  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data || "[]");
}

async function writeLocal(bins) {
  fs.writeFileSync(filePath, JSON.stringify(bins, null, 2));
  return true;
}

async function githubGetFile() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  if (!token || !repo) return null;

  const url = `https://api.github.com/repos/${repo}/contents/bins.json?ref=${branch}`;
  const res = await fetch(url, {
    headers: { Authorization: `token ${token}`, "User-Agent": "binvault-app" }
  });
  if (!res.ok) return null;
  const j = await res.json();
  const content = Buffer.from(j.content, j.encoding).toString();
  return { sha: j.sha, content: JSON.parse(content) };
}

async function githubPutFile(bins, sha) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  if (!token || !repo) return null;

  const url = `https://api.github.com/repos/${repo}/contents/bins.json`;
  const body = {
    message: "Update bins.json via API",
    content: Buffer.from(JSON.stringify(bins, null, 2)).toString("base64"),
    branch,
  };
  if (sha) body.sha = sha;

  const res = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `token ${token}`, "User-Agent": "binvault-app", "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error("GitHub API error: " + txt);
  }
  return await res.json();
}

export default async function handler(req, res) {
  try {
    // If GitHub env present, use GitHub-backed storage
    const useGitHub = !!(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO);

    if (req.method === "GET") {
      if (useGitHub) {
        const file = await githubGetFile();
        return res.status(200).json(file?.content || []);
      } else {
        const data = await readLocal();
        return res.status(200).json(data || []);
      }
    }

    if (req.method === "POST") {
      const { title, content } = req.body || {};
      if (!title || !content) {
        return res.status(400).json({ error: "Missing fields: title and content required" });
      }

      if (useGitHub) {
        // read current content & sha
        const file = await githubGetFile();
        const bins = file?.content || [];
        const sha = file?.sha;
        const newBin = {
          id: Date.now().toString(),
          title: title,
          content: content,
          createdAt: new Date().toISOString()
        };
        bins.push(newBin);
        await githubPutFile(bins, sha);
        return res.status(200).json(newBin);
      } else {
        const bins = await readLocal();
        const newBin = { id: Date.now().toString(), title, content, createdAt: new Date().toISOString() };
        bins.push(newBin);
        await writeLocal(bins);
        return res.status(200).json(newBin);
      }
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
}
