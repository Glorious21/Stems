# Producer Song Memory

A memory layer that lets a music producer log every track by talking naturally to the
agent they already use, then find any track by describing it, see what's still unfinished,
and know exactly which duplicate files are safe to delete.

**There is no app to install and no separate UI.** The product is a prompt plus the
[MemWal](https://www.npmjs.com/package/@mysten-incubation/memwal-mcp) MCP server, which
gives the agent durable, wallet-backed memory that survives across sessions.

| File | What it is |
| --- | --- |
| `producer-song-memory-agent.md` | **The product.** The system prompt to paste into the producer's agent. |
| `CONFIG-checklist.md` | The four values to fill into the prompt before first use. |
| `demo-script.md` | Run sheet for the proof video. |
| `SUBMISSION.md` | Hackathon write-up. |

## Setup (once, ~5 minutes)

1. **Install MemWal MCP** in whatever agent the producer already uses:

   ```
   npx -y @mysten-incubation/memwal-mcp
   ```

   Add it as an MCP server in the agent's config. In Claude Code:

   ```
   claude mcp add memwal -- npx -y @mysten-incubation/memwal-mcp
   ```

2. **Log in.** Run the `memwal_login` tool and approve the wallet sign-in link within
   5 minutes. No private key ever touches the client.

3. **Paste the prompt.** Copy everything from the `# Producer Song Memory Agent` line to
   the end of `producer-song-memory-agent.md` into the agent's system prompt / CLAUDE.md.

4. **Fill in CONFIG.** Replace the four placeholders — see `CONFIG-checklist.md`.

5. **Just talk to it** while the producer works. Every time a track is mentioned, saved,
   bounced, shelved, or re-versioned, the agent logs a memory. Recall it later with
   `find ...`, `what's unfinished`, `what can I archive`, `versions of ...`,
   `what's in [project]`.

## Why it exists

A producer's real bottleneck isn't talent — it's forgetting what they already made and
where it lives. This solves two problems at once:

- **"I can't find my song."** Describe the vibe, get the track name and the exact path.
- **Storage pressure from keeping every version "just in case."** The agent tracks
  version lineage and never overwrites, so `what can I archive` returns exactly the
  superseded files that are safe to move off primary storage.
