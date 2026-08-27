# Proof video run sheet

Goal: show memory is created by natural conversation, survives a restart, and returns
correct answers with exact file locations. Keep it under ~3 minutes.

## Before recording

```bash
npm install
npm run seed
npm run dev        # http://localhost:5173
```

The seed already includes Lagos Nights (v1 → v2 supersession), Cold Water (idea), Osupa.
For a cleaner demo you can start empty instead: delete `server/data/`, run `npm run dev`,
open **Setup**, and fill in the four config values.

## Part 1 — Log tracks by talking (Log tab)

Paste these one at a time into the "Log a track" box, hit **Read it**, glance at the
parsed form, hit **Save to memory**.

1. Finished track:
   > just bounced 'Lagos Nights' — afrobeats, 103 bpm, A minor, saved to the external HDD. call it a demo. sampled a talking drum loop.

2. Idea, no file:
   > new one for the Night Drive EP folder — 'Cold Water', amapiano, 112, F# minor, still just an idea, nothing saved yet

3. New version of #1:
   > mixed version of 'Lagos Nights' — swapped the drums, vocal up. saved to the laptop SSD. this is the one to use now.

   Check the green confirmation: **v2**, and "Marked v1 non-canonical — that file is safe
   to archive now." The right rail shows both events.

## Part 2 — Restart

Stop `npm run dev` (Ctrl+C). Start it again. The SQLite file on disk is the memory —
nothing was in RAM.

## Part 3 — Recall live

- **Find** tab → `the afrobeats one with the talking drum`
  → Lagos Nights, with the laptop-SSD path. Click it → version timeline, v2 canonical.

- **Unfinished** tab → Cold Water (idea), oldest first.

- **Archive** tab → Lagos Nights **v1** at the external-HDD path, "superseded" — the one
  file safe to move off primary storage.

- **Projects** tab → Night Drive EP → Cold Water under *idea*, Lagos Nights under *mixed*.

## What the video proves

Memory was created with zero explicit "save" commands worth the name, persisted across a
full restart, tracked version lineage without overwriting anything, and pinpointed the
exact file that is safe to delete.
