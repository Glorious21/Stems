# Producer Song Memory — Hackathon Submission

## What we built

**Stems** — a full-stack app that gives a music producer a memory for their own catalogue.
The producer logs a track by saying what they made ("just bounced 'Lagos Nights', afrobeats,
103, A minor, saved to the external HDD"); the app pulls out the fields, they confirm, and
it's remembered. Later they find any track by describing it, see what's still unfinished,
and get a precise list of which duplicate files are safe to delete.

Two problems, one app:

- **"I can't find my song."** Search by vibe / sample / BPM → exact track name and file path.
- **"Keep every version just in case" fills the drive.** Version lineage is tracked and
  memories are never overwritten, so superseded files surface on an Archive list that is
  genuinely safe to clear.

## What it remembers, when, and why

- **Track metadata** — name, mood, BPM, key, samples, status, and the *exact* file
  location — captured every time a track is logged. Location is never invented; if it's
  missing and the track isn't just an idea, the app refuses the write and asks.
- **Project assignments** — so "what's in the EP" always reflects current state.
- **Version lineage** — a new version increments the version number, becomes canonical,
  and pushes the previous version to non-canonical with a timestamp. Nothing is deleted
  or overwritten; supersession is recorded, not destructive.

Every write also lands in an append-only event log, shown live in the UI.

It remembers this because a producer's real bottleneck isn't talent — it's forgetting
what they already made and where it lives.

## Stack

Node 24 + Express + TypeScript API, `node:sqlite` for durable storage (no native build
step), React + Vite + Tailwind client. Natural-language logging runs on an offline
heuristic parser — no API key, works on a plane.

## Proof it works

`npm run seed` loads 3 tracks and one real supersession (Lagos Nights v2 over v1). Then:

- **Find** "the afrobeats one with the talking drum" → returns Lagos Nights + the current
  file path.
- **Archive** → lists Lagos Nights v1 at `E:/Archive/2026` — the one file safe to move.
- **Versions of Lagos Nights** → v1 (demo, superseded) then v2 (mixed, canonical).

Full run sheet, including logging live and restarting the server to show persistence, is
in `demo-script.md`.
