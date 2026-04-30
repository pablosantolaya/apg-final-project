# Application Package Generator

A browser-based tool that generates a tailored job application package — resume, cover letter, and cold outreach email — from a job posting and your existing resume. Powered by Google Gemini 2.5 Flash, it also surfaces recent company news (via NewsAPI) and LinkedIn recruiter search links to help you make a warm first contact. All API keys are entered by the user at runtime; no backend, no environment variables, no server.

## What it does

1. **Find a job** — search live listings via JSearch (RapidAPI) or paste a job description manually.
2. **Generate a package** — one Gemini call returns a tailored resume, cover letter, and cold outreach email as structured JSON.
3. **Refine** — each output has a chat input for iterative refinement; the full conversation history is preserved per tab.
4. **Export** — copy any document to clipboard, download as `.txt`, or download all three as a `.zip`.
5. **Find recruiters** — LinkedIn search links for Recruiter, Talent Acquisition, Hiring Manager, and People Operations roles at the target company.

## Setup

```bash
git clone <your-repo-url>
cd <repo-folder>
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) (or the port shown in the terminal), then click the gear icon to add your API keys.

## Required API Keys

| Key | Where to get it | Used for |
|-----|----------------|----------|
| **Gemini API Key** | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | Resume, cover letter, and cold email generation + refinement |
| **JSearch API Key** | [rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) | Live job posting search |
| **NewsAPI Key** | [newsapi.ai/register](https://newsapi.ai/register) | Recent company news for outreach personalization |
| **Apollo API Key** | [app.apollo.io/#/settings/integrations/api](https://app.apollo.io/#/settings/integrations/api) | Reserved for future use (recruiter contacts) |

All keys are stored in `localStorage` — they never leave the browser. Graders can bring their own keys.

## Architecture

The app is a pure frontend SPA (Vite + React + TypeScript + Tailwind CSS v4) with no backend. The left pane handles inputs: job selection (JSearch search or manual paste), company news (newsapi.ai), LinkedIn recruiter links, resume upload/paste (PDF extraction via pdfjs-dist), and an optional notes field. The right pane shows three generated outputs in tabs. State is managed with `useState` and persisted to `localStorage` (job context, resume, outputs); chat refinement history is session-only. Gemini 2.5 Flash is called with `responseMimeType: "application/json"` and a `responseSchema` for initial generation, and with a multi-turn conversation for per-tab refinement. The app deploys as a static site to Vercel with zero configuration.

## Known Limitations

- **NewsAPI rate limits** — the free tier allows ~100 requests/day; the app uses 1 request per job selection.
- **Gemini demand spikes** — Gemini 2.5 Flash occasionally returns 503 during peak hours; the app retries automatically up to 2 times with a 4-second delay.
- **Apollo / recruiter contacts** — Apollo's API blocks browser requests (no CORS headers). Recruiter lookup uses LinkedIn search links instead of live contact data.
- **PDF extraction quality** — pdfjs-dist extracts plain text; complex multi-column or image-based PDFs may lose formatting. Pasting text manually gives better results.
- **No .docx export** — outputs are plain text only; users can paste into Word or Google Docs.
- **Company name heuristics** — the brand extraction (splitting on " and ") works for most JSearch results but may produce incorrect searches for unusually formatted company names.
- **Single model** — all generation uses Gemini 2.5 Flash; there is no model selector.

## Deployment (Vercel)

See the deployment instructions below for the exact steps to deploy.
