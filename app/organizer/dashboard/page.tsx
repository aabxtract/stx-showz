"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import OrganizerStats from "@/components/OrganizerStats";
import EmptyState from "@/components/EmptyState";
import { useWallet } from "@/components/WalletProvider";

interface OrganizerEventRow {
  id: string;
  title: string;
  date: string;
  location: string;
  status: string;
  ticketsTotal: number;
  ticketsSold: number;
  price: string;
  revenue: string;
}

export default function OrganizerDashboardPage() {
  const { isAuthed, authLoading } = useWallet();
  const [events, setEvents] = useState<OrganizerEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthed) {
      setLoading(false);
      return;
    }
    fetch("/api/organizer/events", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load");
        const data = await r.json();
        setEvents(data.events);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [isAuthed]);

  if (authLoading || loading) {
    return <div className="container-page text-slate-500">Loading…</div>;
  }

  if (!isAuthed) {
    return (
      <div className="container-page">
        <PageHeader title="Organizer dashboard" subtitle="Sign in to see your events." />
        <Link href="/login" className="btn-primary">
          Sign in
        </Link>
      </div>
    );
  }

  const totalEvents = events.length;
  const totalTicketsSold = events.reduce((s, e) => s + e.ticketsSold, 0);
  const totalRevenue = events.reduce((s, e) => s + Number(e.revenue || "0"), 0);

  return (
    <div className="container-page">
      <PageHeader
        title="Organizer dashboard"
        subtitle="An overview of your events and ticket sales."
        action={
          <Link href="/create-event" className="btn-primary">
            + New Event
          </Link>
        }
      />

      <OrganizerStats
        stats={[
          { label: "Total events", value: totalEvents },
          { label: "Tickets sold", value: totalTicketsSold.toLocaleString() },
          { label: "Total revenue", value: `${totalRevenue.toLocaleString()} STX` },
        ]}
      />

      {error && <div className="mt-4 text-sm text-red-600">{error}</div>}

      <div className="mt-10">
        <h2 className="font-semibold text-lg mb-4">Your events</h2>
        {events.length === 0 ? (
          <EmptyState
            icon="🪄"
            title="You haven't created any events yet"
            action={
              <Link href="/create-event" className="btn-primary">
                Create your first event
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {events.map((e) => {
              const date = new Date(e.date);
              const pct = e.ticketsTotal === 0 ? 0 : (e.ticketsSold / e.ticketsTotal) * 100;
              return (
                <div key={e.id} className="card p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">{e.title}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                          {e.status}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 mt-1">
                        📅{" "}
                        {date.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        · 📍 {e.location}
                      </div>
                      <div className="mt-3 max-w-md">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span>
                            {e.ticketsSold} / {e.ticketsTotal} tickets
                          </span>
                          <span>{Math.round(pct)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 lg:gap-8">
                      <div className="shrink-0">
                        <div className="text-xs text-slate-500">Revenue</div>
                        <div className="font-semibold">{e.revenue} STX</div>
                      </div>
                      <Link href={`/organizer/events/${e.id}`} className="btn-secondary shrink-0">
                        Manage Event
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
