import { useEffect, useState } from 'react';
import { api } from '../api.ts';
import type { TrackVersion } from '../types.ts';
import { Card, Empty, LocationTag, Spinner, StatusPill, TrackMeta, ago } from '../ui.tsx';

export default function UnfinishedView({ onOpen }: { onOpen: (name: string) => void }) {
  const [rows, setRows] = useState<TrackVersion[] | null>(null);

  useEffect(() => {
    api.unfinished().then(setRows);
  }, []);

  if (!rows) return <Spinner />;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-lg font-semibold text-neutral-100">Unfinished</h1>
      <p className="mt-1 text-sm text-neutral-500">Ideas and demos, oldest first — the ones most likely to be forgotten.</p>

      <div className="mt-4 space-y-3">
        {rows.length === 0 ? (
          <Empty>Nothing hanging. Every logged track is mixed or further.</Empty>
        ) : (
          rows.map((t) => (
            <Card key={t.id} onClick={() => onOpen(t.track_name)}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-neutral-100">{t.track_name}</span>
                  <StatusPill status={t.status} />
                </div>
                <span className="shrink-0 text-xs text-neutral-600">{ago(t.date ?? t.created_at)}</span>
              </div>
              <div className="mt-1">
                <TrackMeta track={t} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <LocationTag location={t.location} />
                {t.project ? (
                  <span className="rounded-md bg-neutral-800/70 px-2 py-1 text-xs text-neutral-400">{t.project}</span>
                ) : null}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
