"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import OrganizerStats from "@/components/OrganizerStats";
import ConnectWalletButton from "@/components/ConnectWalletButton";
import EmptyState from "@/components/EmptyState";
import { useWallet, shortAddress } from "@/components/WalletProvider";

interface ActivityItem {
  id: string;
  type: "purchase" | "create" | "verify" | "withdraw";
  label: string;
  timestamp: string;
}

interface UserProfile {
  id: string;
  address: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
}

const typeIcon: Record<string, string> = {
  purchase: "🎟️",
  create: "✨",
  verify: "✅",
  withdraw: "💸",
};

export default function ProfilePage() {
  const { isConnected, address, network, isAuthed, authLoading, user } = useWallet();
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [ticketsCount, setTicketsCount] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthed) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetch("/api/organizer/activity").then((r) => (r.ok ? r.json() : { activity: [] })),
      fetch("/api/organizer/events").then((r) => (r.ok ? r.json() : { events: [] })),
      fetch("/api/tickets/me").then((r) => (r.ok ? r.json() : { tickets: [] })),
    ])
      .then(([activityData, eventsData, ticketsData]) => {
        setActivity(activityData.activity ?? []);
        setEventsCount(eventsData.events?.length ?? 0);
        setTicketsCount(ticketsData.tickets?.length ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthed]);

  const wallet = address ?? user?.address ?? "";
  const displayName = user?.name ?? shortAddress(wallet);
  const role = eventsCount > 0 ? "Organizer" : "Attendee";

  const startEdit = () => {
    setEditName(user?.name ?? "");
    setEditBio(user?.bio ?? "");
    setEditAvatar(user?.avatarUrl ?? "");
    setProfileError(null);
    setEditing(true);
  };

  const saveProfile = async () => {
    setSaving(true);
    setProfileError(null);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName || null,
          bio: editBio || null,
          avatarUrl: editAvatar || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }
      setEditing(false);
      window.location.reload();
    } catch (err) {
      setProfileError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-page max-w-4xl">
      <PageHeader title="Profile" subtitle="Your account at a glance." />

      <div className="card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 grid place-items-center text-white text-2xl font-semibold">
          {wallet ? wallet.slice(2, 3) : "?"}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="text-xs text-slate-500">Wallet address</div>
            {isConnected ? (
              <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {network}
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                disconnected
              </span>
            )}
          </div>
          <div className="font-mono text-slate-900 break-all">
            {wallet ? (
              <>
                {wallet}{" "}
                <span className="text-slate-400">({shortAddress(wallet)})</span>
              </>
            ) : (
              <span className="text-slate-400">No wallet connected</span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 border border-brand-100 dark:border-brand-700">
              {role}
            </span>
            {!isConnected && <ConnectWalletButton className="btn-secondary !py-1.5 !px-3 text-xs" />}
            {isAuthed && !editing && (
              <button onClick={startEdit} className="btn-secondary !py-1.5 !px-3 text-xs">
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {editing && (
        <div className="card p-5 sm:p-6 mt-4 space-y-4">
          <h3 className="font-semibold text-sm text-slate-900">Edit profile</h3>
          <div>
            <label className="label">Display name</label>
            <input
              className="input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Your name"
              maxLength={80}
            />
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea
              className="input min-h-[80px] resize-y"
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="Tell people about yourself"
              maxLength={500}
            />
          </div>
          <div>
            <label className="label">Avatar URL</label>
            <input
              className="input"
              value={editAvatar}
              onChange={(e) => setEditAvatar(e.target.value)}
              placeholder="https://example.com/avatar.png"
            />
          </div>
          {profileError && <div className="text-sm text-red-600">{profileError}</div>}
          <div className="flex gap-2 justify-end">
            <button type="button" className="btn-ghost" onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={saveProfile} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <div className="text-slate-500 text-sm">Loading stats…</div>
        ) : (
          <OrganizerStats
            stats={[
              { label: "Tickets owned", value: ticketsCount },
              { label: "Events created", value: eventsCount },
              { label: "Role", value: role },
            ]}
          />
        )}
      </div>

      <div className="mt-10">
        <h2 className="font-semibold text-lg mb-4">Recent activity</h2>
        {!isAuthed ? (
          <EmptyState
            icon="🔐"
            title="Not signed in"
            description="Connect your wallet and sign in to see your activity."
            action={
              <Link href="/login" className="btn-primary">
                Sign in
              </Link>
            }
          />
        ) : loading ? (
          <div className="card p-6 text-slate-500 text-sm">Loading activity…</div>
        ) : activity.length === 0 ? (
          <div className="card p-6 text-center text-slate-500 text-sm">
            No activity yet. Create an event or buy a ticket to get started.
          </div>
        ) : (
          <div className="card divide-y divide-slate-100">
            {activity.map((a) => (
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
        )}
      </div>
    </div>
  );
}
