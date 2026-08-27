import { useEffect, useState } from 'react';
import { api } from '../api.ts';
import { STATUSES, type ProjectDetail, type ProjectSummary } from '../types.ts';
import { Card, Empty, LocationTag, Spinner, StatusPill, TrackMeta } from '../ui.tsx';

export default function ProjectsView({ onOpen }: { onOpen: (name: string) => void }) {
  const [list, setList] = useState<ProjectSummary[] | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProjectDetail | null>(null);

  useEffect(() => {
    api.projects().then(setList);
  }, []);

  useEffect(() => {
    if (!active) {
      setDetail(null);
      return;
    }
    setDetail(null);
    api.project(active).then(setDetail);
  }, [active]);

  if (!list) return <Spinner />;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-lg font-semibold text-neutral-100">Projects</h1>
      <p className="mt-1 text-sm text-neutral-500">What's filed where, and how far along each one is.</p>

      {list.length === 0 ? (
        <div className="mt-4">
          <Empty>No tracks assigned to a project yet.</Empty>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {list.map((p) => (
            <button
              key={p.name}
              onClick={() => setActive((cur) => (cur === p.name ? null : p.name))}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                active === p.name
                  ? 'border-amber-500/50 bg-amber-500/10 text-amber-200'
                  : 'border-neutral-800 text-neutral-300 hover:border-neutral-700'
              }`}
            >
              {p.name}
              <span className="ml-2 text-xs text-neutral-500">{p.total}</span>
            </button>
          ))}
        </div>
      )}

      {active ? (
        !detail ? (
          <Spinner />
        ) : (
          <div className="mt-5 space-y-5">
            {STATUSES.filter((s) => detail.groups[s].length > 0).map((s) => (
              <div key={s}>
                <div className="mb-2 flex items-center gap-2">
                  <StatusPill status={s} />
                  <span className="text-xs text-neutral-600">{detail.groups[s].length}</span>
                </div>
                <div className="space-y-2">
                  {detail.groups[s].map((t) => (
                    <Card key={t.id} onClick={() => onOpen(t.track_name)}>
                      <div className="font-medium text-neutral-100">{t.track_name}</div>
                      <div className="mt-1">
                        <TrackMeta track={t} />
                      </div>
                      <div className="mt-2">
                        <LocationTag location={t.location} />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
