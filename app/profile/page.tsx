"use client";

import PageHeader from "@/components/PageHeader";
import OrganizerStats from "@/components/OrganizerStats";
import ConnectWalletButton from "@/components/ConnectWalletButton";
import { useWallet, shortAddress } from "@/components/WalletProvider";
import { currentUser, mockActivity } from "@/lib/mockData";

const typeIcon: Record<string, string> = {
  purchase: "🎟️",
  create: "✨",
  verify: "✅",
  withdraw: "💸",
};

export default function ProfilePage() {
  const { isConnected, address, network } = useWallet();
  const wallet = address ?? currentUser.wallet;

  return (
    <div className="container-page max-w-4xl">
      <PageHeader title="Profile" subtitle="Your account at a glance." />

      <div className="card p-6 flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 grid place-items-center text-white text-2xl font-semibold">
          {wallet.slice(2, 3)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="text-xs text-slate-500">Wallet address</div>
            {isConnected ? (
              <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                {network}
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                mock
              </span>
            )}
          </div>
          <div className="font-mono text-slate-900 break-all">
            {wallet}{" "}
            <span className="text-slate-400">({shortAddress(wallet)})</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-100">
              {currentUser.role}
            </span>
            {!isConnected && <ConnectWalletButton className="btn-secondary !py-1.5 !px-3 text-xs" />}
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
