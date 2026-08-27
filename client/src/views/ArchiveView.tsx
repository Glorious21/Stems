import { useEffect, useState } from 'react';
import { api } from '../api.ts';
import type { TrackVersion } from '../types.ts';
import { Card, Empty, LocationTag, Spinner, TrackMeta, fmtDate } from '../ui.tsx';

export default function ArchiveView({ onOpen }: { onOpen: (name: string) => void }) {
  const [rows, setRows] = useState<TrackVersion[] | null>(null);

  useEffect(() => {
    api.archivable().then(setRows);
  }, []);

  if (!rows) return <Spinner />;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-lg font-semibold text-neutral-100">Safe to archive</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Superseded versions. A newer take is the canonical one, so these files can move off primary storage or go.
      </p>

      <div className="mt-4 space-y-3">
        {rows.length === 0 ? (
          <Empty>Nothing superseded yet. Every version in memory is still the current one.</Empty>
        ) : (
          rows.map((t) => (
            <Card key={t.id} onClick={() => onOpen(t.track_name)}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-neutral-200">{t.track_name}</span>
                  <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[11px] font-medium text-neutral-400">
                    v{t.version_number}
                  </span>
                </div>
                <span className="shrink-0 text-xs text-neutral-600">
                  superseded {fmtDate(t.superseded_at)}
                </span>
              </div>
              <div className="mt-1">
                <TrackMeta track={t} />
              </div>
              <div className="mt-3">
                <LocationTag location={t.location} />
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
