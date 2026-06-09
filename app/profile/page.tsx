import PageHeader from "@/components/PageHeader";
import OrganizerStats from "@/components/OrganizerStats";
import { currentUser, mockActivity, shortAddr } from "@/lib/mockData";

const typeIcon: Record<string, string> = {
  purchase: "🎟️",
  create: "✨",
  verify: "✅",
  withdraw: "💸",
};

export default function ProfilePage() {
  return (
    <div className="container-page max-w-4xl">
      <PageHeader title="Profile" subtitle="Your account at a glance." />

      <div className="card p-6 flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 grid place-items-center text-white text-2xl font-semibold">
          {currentUser.wallet.slice(2, 3)}
        </div>
        <div className="flex-1">
          <div className="text-xs text-slate-500">Wallet address</div>
          <div className="font-mono text-slate-900 break-all">
            {currentUser.wallet}{" "}
            <span className="text-slate-400">({shortAddr(currentUser.wallet)})</span>
          </div>
          <div className="mt-2">
            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-100">
              {currentUser.role}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <OrganizerStats
          stats={[
            { label: "Tickets owned", value: currentUser.totalTicketsOwned },
            { label: "Events created", value: currentUser.totalEventsCreated },
            { label: "Role", value: currentUser.role },
          ]}
        />
      </div>

      <div className="mt-10">
        <h2 className="font-semibold text-lg mb-4">Recent activity</h2>
        <div className="card divide-y divide-slate-100">
          {mockActivity.map((a) => (
            <div key={a.id} className="px-5 py-4 flex items-start gap-4">
              <div className="w-9 h-9 rounded-full bg-slate-100 grid place-items-center text-base shrink-0">
                {typeIcon[a.type] ?? "•"}
              </div>
              <div className="flex-1">
                <div className="text-sm text-slate-800">{a.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {new Date(a.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
