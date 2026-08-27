# Stems — Producer Song Memory

A full-stack app that lets a music producer log every track by talking naturally, then
find any track by describing it, see what's still unfinished, and know exactly which
duplicate files are safe to delete.

It solves two problems at once:

- **"I can't find my song."** Describe the vibe, a sample, the BPM — get the track name
  and the exact file path.
- **Storage pressure from keeping every version "just in case."** The app tracks version
  lineage and never overwrites a memory. When a new version supersedes an old one, the
  old file lands on an **Archive** list — the only files that are actually safe to move
  off primary storage.

## Stack

| Layer | Choice |
| --- | --- |
| Server | Node 24, Express, TypeScript (run with `tsx`) |
| Storage | `node:sqlite` (built into Node — no native build step), file at `server/data/stems.db` |
| Client | React 18 + Vite 6 + TypeScript + Tailwind v4 |
| NL parsing | Offline heuristic parser (`server/src/parse.ts`) — no API key needed |

## Run it

```bash
npm install
npm run seed     # loads 3 demo tracks + 1 supersession, sets config for "Tobi"
npm run dev      # API on :3001, web on :5173  (open http://localhost:5173)
```

Single-process / production mode:

```bash
npm run build    # builds the client
npm start        # Express serves the API and the built client on :3001
```

## What's in the app

| Tab | Does |
| --- | --- |
| **Log** | Type what you made in plain language → the parser fills a form → you confirm → it's in memory. Or fill the form by hand. |
| **Find** | Describe a track; ranked matches come back with the exact location. Nothing matches → it says so, never guesses. |
| **Unfinished** | Ideas and demos, oldest first. |
| **Archive** | Superseded versions with their locations — safe to move or delete. |
| **Projects** | Tracks grouped by project and status. |
| **Setup** | The four config values: producer name, DAW, storage locations, genres/moods. |

The right rail shows a live **memory feed** so you can watch entries land (and survive a
restart).

## Data model

`track_versions` is the memory. Each row is one version of one track. Logging a track
whose name already exists creates the next version, marks it canonical, and flips the
previous versions to non-canonical with a `superseded_at` timestamp — the old rows are
never deleted or overwritten. Every write also appends to an `events` log.

## API

```
GET  /api/config            PUT /api/config
POST /api/parse             { text } -> suggested fields
GET  /api/stats
GET  /api/events?limit=
GET  /api/tracks            POST /api/tracks   (logs a track / new version)
GET  /api/tracks/search?q=
GET  /api/tracks/:name/versions
GET  /api/unfinished
GET  /api/archivable
GET  /api/projects          GET /api/projects/:name
```

## Also in this repo

The original hackathon concept was a prompt layered on the MemWal MCP server (no app).
That prompt is kept for reference:

- `producer-song-memory-agent.md` — the paste-in agent prompt
- `CONFIG-checklist.md` — its four config values
- `SUBMISSION.md` — hackathon write-up
- `demo-script.md` — proof-video run sheet

The app implements the same memory spec — same fields, same version/supersession rules,
same recall commands — as a running product you can click.
