import type { LogInput } from './types.ts';

interface ParseContext {
  genres: string[];
  locations: string[];
}

export interface ParsedTrack extends LogInput {
  _matched: string[];
}

/**
 * Lightweight, offline heuristic parser. Turns "just bounced 'Lagos Nights', afrobeats,
 * 103 bpm, A minor, saved to the external HDD" into structured fields the producer can
 * confirm before it hits memory. Intentionally conservative — it fills what it is sure of.
 */
export function parseText(text: string, ctx: ParseContext): ParsedTrack {
  const t = (text ?? '').trim();
  const lower = t.toLowerCase();
  const out: ParsedTrack = { _matched: [] };
  const mark = (k: string) => out._matched.push(k);

  if (!t) return out;

  // ---- track name: quoted first, then "called / titled / track named ..." ----
  const quoted = t.match(/["'“”‘’]([^"'“”‘’]{2,60})["'“”‘’]/);
  if (quoted) {
    out.track_name = quoted[1].trim();
    mark('track_name');
  } else {
    const called = t.match(/\b(?:called|titled|name[d]?(?:\s+it)?|track|tune|beat|joint|song)\s+([A-Z][\w'&\- ]{1,38}?)(?=[,.;:]|\s+(?:for|in|at|on|—|-)\s|$)/);
    if (called) {
      out.track_name = called[1].trim();
      mark('track_name');
    }
  }

  // ---- bpm ----
  const bpmExplicit = lower.match(/\b(\d{2,3})\s*bpm\b/) || lower.match(/\bbpm[\s:]*?(?:is|of|=)?\s*(\d{2,3})\b/) || lower.match(/\btempo[\s:]*?(?:is|of|=)?\s*(\d{2,3})\b/);
  if (bpmExplicit) {
    out.bpm = bpmExplicit[1];
    mark('bpm');
  }

  // ---- key ----
  const key = t.match(/\b([A-G])\s?(#|♯|b|♭|-?sharp|-?flat)?\s?(maj(?:or)?|min(?:or)?|m)\b/i);
  if (key) {
    let k = key[1].toUpperCase();
    const acc = (key[2] || '').toLowerCase();
    if (acc.includes('#') || acc.includes('sharp') || acc === '♯') k += '#';
    else if (acc === 'b' || acc.includes('flat') || acc === '♭') k += 'b';
    const mode = key[3].toLowerCase();
    k += mode.startsWith('maj') ? ' major' : ' minor';
    out.song_key = k;
    mark('song_key');
  }

  // ---- status ----
  if (/\b(shelv|park(ed)?|back ?burner|scrap(ped)?|drawer|on hold)\b/.test(lower)) out.status = 'shelved';
  else if (/\bmaster(ed|ing)?\b/.test(lower)) out.status = 'mastered';
  else if (/\b(mix(ed|down)?|mixing)\b/.test(lower)) out.status = 'mixed';
  else if (/\bdemo\b/.test(lower)) out.status = 'demo';
  else if (/\b(idea|sketch|starter|loop idea|nothing saved|not (?:yet )?saved|just started)\b/.test(lower)) out.status = 'idea';
  else if (/\b(bounce[d]?|export(ed)?|render(ed)?|printed|finished|wrapped|done)\b/.test(lower)) out.status = 'demo';
  if (out.status) mark('status');

  // ---- genre / mood from configured vocabulary ----
  const genreHits = ctx.genres.filter((g) => g && lower.includes(g.toLowerCase()));
  if (genreHits.length) {
    out.genre_mood = genreHits.join(', ');
    mark('genre_mood');
  }

  // ---- location: match a configured store by its label prefix, else "saved to X" ----
  const locHit = ctx.locations.find((l) => {
    if (!l) return false;
    const label = l.split(/\s+-\s+/)[0].trim().toLowerCase();
    return label.length > 2 && lower.includes(label);
  });
  if (locHit) {
    out.location = locHit;
    mark('location');
  } else {
    const savedTo = t.match(/\b(?:saved|bounced|exported|rendered|put|dropped|stored|filed)\s+(?:it\s+)?(?:to|in|on|into|under|onto)\s+([^,.;]+?)(?=[,.;]|\s+(?:and|then)\b|$)/i);
    if (savedTo) {
      out.location = savedTo[1].trim();
      mark('location');
    } else if (/\b(not(?:hing)?\s+(?:yet\s+)?saved|no file yet|didn'?t save|haven'?t saved)\b/.test(lower)) {
      out.location = 'not yet saved';
      mark('location');
    }
  }

  // ---- project ----
  // "for the Night Drive EP folder" -> "Night Drive EP"; "in my Summer project" -> "Summer".
  const projWithKind =
    t.match(/\b(?:for|in)\s+(?:the\s+|my\s+)?([A-Z0-9][\w'&\- ]{1,32}?\s+(?:EP|album|mixtape|tape|beat ?pack|pack))\s+(?:folder|project)\b/i) ||
    t.match(/\b(?:for|in)\s+(?:the\s+|my\s+)?([A-Z0-9][\w'&\- ]{1,32}?)\s+(?:folder|project|EP|album|mixtape|tape|beat ?pack|pack)\b/i);
  if (projWithKind) {
    out.project = projWithKind[1].replace(/\s+/g, ' ').trim();
    mark('project');
  }

  // ---- new version signal ----
  if (
    /\b(new |another |fresh )?(version|take|revision|pass|render|bounce)\s+of\b/.test(lower) ||
    /\bv\d\b/.test(lower) ||
    /\b(re-?did|redo(?:ne)?|reworked?|revisit(?:ed)?|updated (?:the )?mix|this is the one|new mix of|remade)\b/.test(lower)
  ) {
    out.is_new_version = true;
    mark('is_new_version');
  }

  // ---- date ----
  out.date = new Date().toISOString().slice(0, 10);

  // ---- notes + instruments ----
  const noteBits: string[] = [];
  const sampled = t.match(/\bsampl(?:ed|ing|e)\s+([^,.;]+?)(?=[,.;]|\s+(?:and|then)\b|$)/i);
  if (sampled) {
    noteBits.push(`Sampled ${sampled[1].trim()}`);
    out.instruments_samples = sampled[1].trim();
    mark('instruments_samples');
  }
  const ref = t.match(/\b(?:reference|ref|sounds like|vibe of|inspired by|in the style of|think)\s+([^,.;]+?)(?=[,.;]|$)/i);
  if (ref) noteBits.push(`Ref: ${ref[1].trim()}`);
  const forWho = t.match(/\bfor\s+([A-Z][\w. -]{1,28})\b(?!\s+(?:folder|project|ep|album|mixtape|tape|pack))/);
  if (forWho) noteBits.push(`For ${forWho[1].trim()}`);
  if (noteBits.length) {
    out.notes = noteBits.join('. ');
    mark('notes');
  }

  return out;
}
