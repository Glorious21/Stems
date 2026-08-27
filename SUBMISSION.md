# Producer Song Memory — Hackathon Submission

## What we built

A memory prompt that lets a producer log tracks by talking naturally, then find any track
by describing it, see what's still unfinished, and know exactly which duplicate files are
safe to delete — solving both "I can't find my song" and the storage pressure caused by
keeping every version "just in case."

There is no app and no separate UI. The prompt runs inside the agent the producer already
has open, and durable memory is provided by the MemWal MCP server (wallet-backed, no
private key on the client). Setup is one MCP install, one login, and pasting one prompt.

## What it remembers, when, and why

- **Track metadata** — name, mood, BPM, key, samples, status, and the *exact* file
  location — written every time a track is mentioned, saved, bounced, or shelved. The
  agent never invents a location; if one is missing and the track isn't just an idea, it
  asks first.
- **Project assignments** — recorded when a track is filed into a project or EP folder,
  so `what's in [project]` always reflects the current state.
- **Version lineage** — a new version sets `version_of`, increments `version_number`, and
  is marked canonical; the previous version gets its own memory marking it non-canonical.
  Nothing is ever silently overwritten — supersession is its own memory.

It remembers this because a producer's real bottleneck isn't talent, it's forgetting what
they already made and where it lives. Version tracking also turns "keep everything just in
case" into a concrete, safe archive list.

## Proof it works

Short video: log 2–3 real tracks (including one new version of an existing track), close
the session, reopen a fresh one, then run `find [x]`, `what can I archive`, and
`versions of [track]` live — showing the memory survived the restart and the answers are
correct against the real files. Full run sheet in `demo-script.md`.
