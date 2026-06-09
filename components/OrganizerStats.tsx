interface Stat {
  label: string;
  value: string | number;
  hint?: string;
}

export default function OrganizerStats({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="card p-5">
          <div className="text-sm text-slate-500">{s.label}</div>
          <div className="mt-1.5 text-2xl font-semibold tracking-tight">
            {s.value}
          </div>
          {s.hint && <div className="text-xs text-slate-400 mt-1">{s.hint}</div>}
        </div>
      ))}
    </div>
  );
}
