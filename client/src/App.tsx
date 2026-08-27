import { useCallback, useEffect, useState } from 'react';
import { api } from './api.ts';
import type { AppEvent, Config, Stats } from './types.ts';
import { ago } from './ui.tsx';
import LogView from './views/LogView.tsx';
import FindView from './views/FindView.tsx';
import UnfinishedView from './views/UnfinishedView.tsx';
import ArchiveView from './views/ArchiveView.tsx';
import ProjectsView from './views/ProjectsView.tsx';
import SettingsView from './views/SettingsView.tsx';
import VersionsDrawer from './views/VersionsDrawer.tsx';

type Tab = 'log' | 'find' | 'unfinished' | 'archive' | 'projects' | 'settings';

const TABS: { id: Tab; label: string }[] = [
  { id: 'log', label: 'Log' },
  { id: 'find', label: 'Find' },
  { id: 'unfinished', label: 'Unfinished' },
  { id: 'archive', label: 'Archive' },
  { id: 'projects', label: 'Projects' },
  { id: 'settings', label: 'Setup' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('log');
  const [config, setConfig] = useState<Config | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [drawer, setDrawer] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(async () => {
    const [s, e] = await Promise.all([api.stats(), api.events(12)]);
    setStats(s);
    setEvents(e);
  }, []);

  useEffect(() => {
    api.getConfig().then(setConfig);
    refresh();
  }, [refresh]);

  // remount data views after a write
  const afterWrite = useCallback(() => {
    setNonce((n) => n + 1);
    refresh();
  }, [refresh]);

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎚️</span>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-neutral-100">Stems</div>
              <div className="text-[11px] text-neutral-500">
                {config?.producer_name ? `${config.producer_name}'s song memory` : 'song memory'}
              </div>
            </div>
          </div>
          <nav className="ml-auto flex flex-wrap gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  tab === t.id ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {stats ? (
        <div className="border-b border-neutral-900 bg-neutral-950">
          <div className="mx-auto flex max-w-5xl gap-6 px-5 py-2.5 text-xs">
            <Stat label="tracks" value={stats.tracks} />
            <Stat label="unfinished" value={stats.unfinished} tone={stats.unfinished > 0 ? 'amber' : undefined} />
            <Stat label="can archive" value={stats.archivable} tone={stats.archivable > 0 ? 'emerald' : undefined} />
            <Stat label="projects" value={stats.projects} />
          </div>
        </div>
      ) : null}

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
          <div key={`${tab}-${nonce}`}>
            {tab === 'log' && <LogView config={config} onLogged={afterWrite} onOpen={setDrawer} />}
            {tab === 'find' && <FindView onOpen={setDrawer} />}
            {tab === 'unfinished' && <UnfinishedView onOpen={setDrawer} />}
            {tab === 'archive' && <ArchiveView onOpen={setDrawer} />}
            {tab === 'projects' && <ProjectsView onOpen={setDrawer} />}
            {tab === 'settings' && <SettingsView config={config} onSaved={setConfig} />}
          </div>

          <aside className="hidden lg:block">
            <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-600">Recent memory</h3>
            <ul className="mt-3 space-y-3">
              {events.length === 0 ? (
                <li className="text-xs text-neutral-600">Nothing logged yet.</li>
              ) : (
                events.map((e) => (
                  <li key={e.id} className="text-xs leading-relaxed">
                    <span className={e.type === 'supersession' ? 'text-amber-300/90' : 'text-neutral-400'}>
                      {e.description}
                    </span>
                    <span className="mt-0.5 block text-neutral-700">{ago(e.ts)}</span>
                  </li>
                ))
              )}
            </ul>
          </aside>
        </div>
      </main>

      {drawer ? <VersionsDrawer name={drawer} onClose={() => setDrawer(null)} /> : null}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'amber' | 'emerald' }) {
  const color = tone === 'amber' ? 'text-amber-400' : tone === 'emerald' ? 'text-emerald-400' : 'text-neutral-200';
  return (
    <span className="flex items-baseline gap-1.5">
      <span className={`text-sm font-semibold ${color}`}>{value}</span>
      <span className="text-neutral-600">{label}</span>
    </span>
  );
}
