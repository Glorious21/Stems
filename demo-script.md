# Proof video run sheet

Goal: show that memory is written by natural conversation, survives a full session
restart, and returns correct answers. Keep it under ~3 minutes.

## Before recording
- MemWal MCP installed and `memwal_login` already approved.
- Prompt pasted, CONFIG filled with the producer's real details.
- Use real tracks and real paths so the locations in the recall answers are verifiable.

## Part 1 — Log tracks by talking (session A)

Say these naturally, one at a time, letting the agent confirm each write:

1. **A finished track:**
   > "Just bounced 'Lagos Nights' — Afrobeats, 103 BPM, A minor, saved it to the External
   > HDD under E:/Archive/2026. Call it a demo. Sampled a talking drum loop."

2. **A track in a project:**
   > "New one for the EP folder — 'Cold Water', Amapiano, 112, F# minor, still just an
   > idea, nothing saved yet."

3. **A new version of the first track:**
   > "Did a mixed version of 'Lagos Nights' — swapped the drums, brought up the vocal.
   > Saved to Laptop SSD, D:/Music/mixes. This is the one to use now."

   Confirm the agent: incremented to version 2, marked v2 `canonical: true`, and wrote a
   separate memory marking v1 `canonical: false`.

## Part 2 — Kill the session

Close the agent completely. Reopen a fresh session (nothing in context).

## Part 3 — Recall live (session B)

Run these and show the answers are correct against the real files:

- `find the afrobeats one with the talking drum`
  → returns **Lagos Nights**, canonical version, with the D:/Music/mixes path.

- `what's unfinished`
  → lists **Cold Water** (idea). Oldest first.

- `what can I archive`
  → returns **Lagos Nights v1** at E:/Archive/2026 — the superseded file, safe to move.

- `versions of Lagos Nights`
  → v1 (demo, E:/Archive/2026, canonical: false) then v2 (mixed, D:/Music/mixes,
  canonical: true), oldest to newest.

- `what's in the EP`
  → **Cold Water**, status idea.

## What the video proves
Memory was created with zero explicit "save" commands, persisted across a hard restart,
tracked version lineage without overwriting anything, and pinpointed the exact file that
is safe to delete.
