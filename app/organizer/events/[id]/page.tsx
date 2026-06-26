"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import OrganizerStats from "@/components/OrganizerStats";
import { fetchEvent } from "@/lib/apiClient";
import { shortAddress, useWallet } from "@/components/WalletProvider";
import type { AppEvent } from "@/lib/types";

interface Attendee {
  wallet: string;
  ticketId: string;
  purchasedAt: string;
  checkedIn: boolean;
}

export default function ManageEventPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthed } = useWallet();
  const [event, setEvent] = useState<AppEvent | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetchEvent(id),
      fetch(`/api/organizer/events/${id}/attendees`).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error("Forbidden")),
      ),
    ])
      .then(([evt, att]: [AppEvent, { attendees: Attendee[] }]) => {
        setEvent(evt);
        setAttendees(att.attendees);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const cancel = async () => {
    if (!event) return;
    if (!confirm("Cancel this event? It will be marked as Cancelled.")) return;
    const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
    if (res.ok) {
      const data = await res.json();
      setEvent((e) => (e ? { ...e, status: data.event.status === "Cancelled" ? "Cancelled" : e.status } : e));
    }
  };

  if (loading) return <div className="container-page text-slate-500">Loading…</div>;
  if (!isAuthed || error || !event) {
    return (
      <div className="container-page">
        <div className="card p-10 text-center">
          <h2 className="font-semibold text-lg">{error || "Event not found"}</h2>
          <Link href="/organizer/dashboard" className="btn-primary mt-5">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const date = new Date(event.date);
  const ticketsSold = event.ticketsTotal - event.ticketsLeft;
  const revenue = ticketsSold * event.price;

  return (
    <div className="container-page">
      <Link href="/organizer/dashboard" className="text-sm text-slate-500 hover:text-slate-800">
        ← Back to dashboard
      </Link>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{event.title}</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {event.status ?? "Active"}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
            <span>{event.network === "bitcoin" ? "₿ Bitcoin" : "⚡ Stacks"}</span>
            <span>·</span>
            <span>{event.price} {event.currency}</span>
          </div>
          <div className="text-sm text-slate-600 mt-1">
            📅{" "}
            {date.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}{" "}
            · 📍 {event.location}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Link href="/organizer/verify" className="btn-secondary flex-1 sm:flex-initial">
            Verify Tickets
          </Link>
          <button onClick={cancel} className="btn-danger flex-1 sm:flex-initial">
            Cancel Event
          </button>
        </div>
      </div>

      <div className="mt-8">
        <OrganizerStats
          stats={[
            { label: "Tickets sold", value: ticketsSold },
            {
              label: "Tickets remaining",
              value: event.ticketsLeft,
              hint: `of ${event.ticketsTotal} total`,
            },
            { label: "Revenue", value: `${revenue} ${event.currency}` },
          ]}
        />
      </div>

      <div className="mt-10">
        <h2 className="font-semibold text-lg mb-4">Attendees</h2>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left font-medium min-w-[140px]">Wallet</th>
                  <th className="px-4 py-3 text-left font-medium min-w-[160px]">Ticket ID</th>
                  <th className="px-4 py-3 text-left font-medium min-w-[110px]">Purchased</th>
                  <th className="px-4 py-3 text-right font-medium min-w-[70px]">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendees.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                      No attendees yet
                    </td>
                  </tr>
                ) : (
                  attendees.map((a) => (
                    <tr
                      key={a.ticketId}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-4 py-3 font-mono text-slate-800">
                        <span className="sm:hidden">{shortAddress(a.wallet)}</span>
                        <span className="hidden sm:inline">{a.wallet}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700 max-w-[120px] sm:max-w-none truncate">
                        {a.ticketId}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {new Date(a.purchasedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                            a.checkedIn
                              ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {a.checkedIn ? "In" : "—"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
