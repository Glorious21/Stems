import { useState } from 'react';
import { api } from '../api.ts';
import type { Config } from '../types.ts';

export default function SettingsView({ config, onSaved }: { config: Config | null; onSaved: (c: Config) => void }) {
  const [producer, setProducer] = useState(config?.producer_name ?? '');
  const [daw, setDaw] = useState(config?.daw ?? '');
  const [locations, setLocations] = useState((config?.storage_locations ?? []).join('\n'));
  const [genres, setGenres] = useState((config?.genres_moods ?? []).join('\n'));
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setBusy(true);
    setSaved(false);
    try {
      const next = await api.saveConfig({
        producer_name: producer.trim(),
        daw: daw.trim(),
        storage_locations: locations
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        genres_moods: genres
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      });
      onSaved(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-lg font-semibold text-neutral-100">Setup</h1>
      <p className="mt-1 text-sm text-neutral-500">
        The four things the assistant needs. Storage locations are the only place a track's location can come from — it
        never invents one.
      </p>

      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-neutral-400">Producer name</span>
          <input value={producer} onChange={(e) => setProducer(e.target.value)} className={cls} placeholder="Tobi" />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-neutral-400">DAW</span>
          <input value={daw} onChange={(e) => setDaw(e.target.value)} className={cls} placeholder="FL Studio" />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-neutral-400">Storage locations — one per line</span>
          <textarea
            value={locations}
            onChange={(e) => setLocations(e.target.value)}
            rows={4}
            className={`${cls} resize-none font-mono text-xs`}
            placeholder={'Laptop SSD - D:/Music\nExternal HDD - E:/Archive\nGoogle Drive - /Beats2026'}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-neutral-400">Genres / moods — one per line</span>
          <textarea
            value={genres}
            onChange={(e) => setGenres(e.target.value)}
            rows={4}
            className={`${cls} resize-none`}
            placeholder={'Afrobeats\nAmapiano\nTrap\nR&B\nSad\nClub'}
          />
        </label>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-neutral-950 hover:bg-amber-400 disabled:opacity-40"
          >
            Save setup
          </button>
          {saved ? <span className="text-sm text-emerald-400">Saved.</span> : null}
        </div>
      </div>
    </div>
  );
}

const cls =
  'w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-sm text-neutral-200 outline-none focus:border-neutral-600';
