import { useState } from 'react';
import { api, type LogBody } from '../api.ts';
import { STATUSES, type Config, type LogResult, type Status } from '../types.ts';
import { LocationTag, StatusPill } from '../ui.tsx';

interface Props {
  config: Config | null;
  onLogged: () => void;
  onOpen: (name: string) => void;
}

type Form = {
  track_name: string;
  date: string;
  genre_mood: string;
  bpm: string;
  song_key: string;
  instruments_samples: string;
  status: Status;
  location: string;
  project: string;
  notes: string;
  is_new_version: boolean;
  force_new_track: boolean;
};

const EMPTY: Form = {
  track_name: '',
  date: new Date().toISOString().slice(0, 10),
  genre_mood: '',
  bpm: '',
  song_key: '',
  instruments_samples: '',
  status: 'idea',
  location: '',
  project: '',
  notes: '',
  is_new_version: false,
  force_new_track: false,
};

const EXAMPLE =
  "just bounced 'Lagos Nights' — afrobeats, 103 bpm, A minor, saved to the external HDD. call it a demo. sampled a talking drum loop.";

export default function LogView({ config, onLogged, onOpen }: Props) {
  const [text, setText] = useState('');
  const [form, setForm] = useState<Form | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LogResult | null>(null);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  async function readIt() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const p = await api.parse(text);
      setForm({
        ...EMPTY,
        track_name: p.track_name ?? '',
        date: p.date ?? EMPTY.date,
        genre_mood: p.genre_mood ?? '',
        bpm: p.bpm ?? '',
        song_key: p.song_key ?? '',
        instruments_samples: p.instruments_samples ?? '',
        status: p.status ?? 'idea',
        location: p.location ?? '',
        project: p.project ?? '',
        notes: p.notes ?? '',
        is_new_version: Boolean(p.is_new_version),
        force_new_track: false,
      });
      setMatched(p._matched ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that.');
    } finally {
      setBusy(false);
    }
  }

  function startBlank() {
    setForm({ ...EMPTY });
    setMatched([]);
    setResult(null);
    setError(null);
  }

  async function save() {
    if (!form) return;
    setBusy(true);
    setError(null);
    try {
      const body: LogBody = { ...form };
      const r = await api.log(body);
      setResult(r);
      setForm(null);
      setText('');
      setMatched([]);
      onLogged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save that.');
    } finally {
      setBusy(false);
    }
  }

  const locations = config?.storage_locations ?? [];
  const genres = config?.genres_moods ?? [];

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-lg font-semibold text-neutral-100">Log a track</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Say what you made the way you'd say it out loud. I'll pull out the details — you check them before they go in.
      </p>

      <div className="mt-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder={EXAMPLE}
          className="w-full resize-none rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 text-sm text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-neutral-600"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy || !text.trim()}
            onClick={readIt}
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-neutral-950 hover:bg-amber-400 disabled:opacity-40"
          >
            Read it
          </button>
          <button
            type="button"
            onClick={startBlank}
            className="rounded-lg border border-neutral-800 px-3 py-1.5 text-sm text-neutral-300 hover:border-neutral-700"
          >
            Fill in by hand
          </button>
          <button
            type="button"
            onClick={() => setText(EXAMPLE)}
            className="text-xs text-neutral-600 hover:text-neutral-400"
          >
            use the example
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>
      ) : null}

      {result ? <Confirmation result={result} onOpen={onOpen} /> : null}

      {form ? (
        <div className="mt-5 space-y-4 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
          {matched.length ? (
            <p className="text-xs text-neutral-500">
              Picked up: <span className="text-neutral-400">{matched.map(label).filter(Boolean).join(', ')}</span>. Fix
              anything that's off.
            </p>
          ) : null}

          <Field label="Track name" required>
            <input
              value={form.track_name}
              onChange={(e) => set('track_name', e.target.value)}
              className={inputCls}
              placeholder="Untitled"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <select value={form.status} onChange={(e) => set('status', e.target.value as Status)} className={inputCls}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date">
              <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className={inputCls} />
            </Field>
          </div>

          <Field label="Location" hint={form.status === 'idea' ? 'optional for an idea' : 'required — never guessed'}>
            <input
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              list="stems-locations"
              className={inputCls}
              placeholder={form.status === 'idea' ? 'not yet saved' : 'e.g. External HDD - E:/Archive/2026'}
            />
            <datalist id="stems-locations">
              {locations.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Genre / mood">
              <input
                value={form.genre_mood}
                onChange={(e) => set('genre_mood', e.target.value)}
                list="stems-genres"
                className={inputCls}
              />
              <datalist id="stems-genres">
                {genres.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </Field>
            <Field label="BPM">
              <input value={form.bpm} onChange={(e) => set('bpm', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Key">
              <input value={form.song_key} onChange={(e) => set('song_key', e.target.value)} className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Project">
              <input value={form.project} onChange={(e) => set('project', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Instruments / samples">
              <input
                value={form.instruments_samples}
                onChange={(e) => set('instruments_samples', e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              className={`${inputCls} resize-none`}
              placeholder="vibe, reference track, who it's for"
            />
          </Field>

          <label className="flex items-center gap-2 text-sm text-neutral-400">
            <input
              type="checkbox"
              checked={form.is_new_version}
              onChange={(e) => set('is_new_version', e.target.checked)}
              className="accent-amber-500"
            />
            This is a new version of an existing track
          </label>
          {form.is_new_version ? (
            <p className="-mt-2 pl-6 text-xs text-neutral-600">
              The previous version stays in memory, marked non-canonical — nothing gets overwritten.
            </p>
          ) : null}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              disabled={busy || !form.track_name.trim()}
              onClick={save}
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-neutral-950 hover:bg-amber-400 disabled:opacity-40"
            >
              Save to memory
            </button>
            <button
              type="button"
              onClick={() => setForm(null)}
              className="rounded-lg border border-neutral-800 px-3 py-1.5 text-sm text-neutral-400 hover:border-neutral-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Confirmation({ result, onOpen }: { result: LogResult; onOpen: (name: string) => void }) {
  const v = result.version;
  return (
    <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
      <div className="flex items-center gap-2 text-sm text-emerald-300">
        <StatusPill status={v.status} />
        <span className="font-medium text-neutral-100">
          Got it — {result.is_new_version ? `v${v.version_number} of ` : ''}
          <button className="underline decoration-dotted underline-offset-2" onClick={() => onOpen(v.track_name)}>
            {v.track_name}
          </button>{' '}
          is in memory.
        </span>
      </div>
      <div className="mt-2">
        <LocationTag location={v.location} />
      </div>
      {result.superseded.length ? (
        <p className="mt-2 text-sm text-amber-300/90">
          Marked {result.superseded.map((s) => `v${s.version_number}`).join(', ')} non-canonical —{' '}
          {result.superseded.length > 1 ? 'those files are' : 'that file is'} safe to archive now.
        </p>
      ) : null}
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-sm text-neutral-200 outline-none focus:border-neutral-600';

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1.5 text-xs font-medium text-neutral-400">
        {label}
        {required ? <span className="text-amber-500">*</span> : null}
        {hint ? <span className="font-normal text-neutral-600">— {hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

const LABELS: Record<string, string> = {
  track_name: 'name',
  bpm: 'BPM',
  song_key: 'key',
  status: 'status',
  genre_mood: 'genre/mood',
  location: 'location',
  project: 'project',
  is_new_version: 'new-version',
  instruments_samples: 'samples',
  notes: 'notes',
};

function label(key: string): string {
  return LABELS[key] ?? '';
}
