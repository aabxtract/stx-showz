"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import OrganizerStats from "@/components/OrganizerStats";
import ImageUpload from "@/components/ImageUpload";
import { fetchEvent, getRewardConfig, setRewardConfig, disburseBatch } from "@/lib/apiClient";
import { shortAddress, useWallet } from "@/components/WalletProvider";
import type { AppEvent } from "@/lib/types";

const categories = ["Music", "Tech", "Sports", "Art", "Conference", "Workshop"] as const;

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

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "" as "" | "Music" | "Tech" | "Sports" | "Art" | "Conference" | "Workshop",
    date: "",
    time: "",
    location: "",
    image: "",
    ticketsTotal: "",
  });
  const [editError, setEditError] = useState<string | null>(null);

  const [rewardPerCheckin, setRewardPerCheckin] = useState(0);
  const [rewardLoading, setRewardLoading] = useState(true);
  const [rewardSaving, setRewardSaving] = useState(false);
  const [rewardError, setRewardError] = useState<string | null>(null);
  const [batchDisbursing, setBatchDisbursing] = useState(false);
  const [batchResult, setBatchResult] = useState<string | null>(null);

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

  const startEdit = () => {
    if (!event) return;
    const d = new Date(event.date);
    setEditForm({
      title: event.title,
      description: event.description,
      category: (event.category as typeof editForm.category) || "",
      date: d.toISOString().split("T")[0],
      time: d.toTimeString().slice(0, 5),
      location: event.location,
      image: event.image,
      ticketsTotal: String(event.ticketsTotal),
    });
    setEditError(null);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!event) return;
    setSaving(true);
    setEditError(null);
    try {
      const isoDate = new Date(`${editForm.date}T${editForm.time || "00:00"}:00`).toISOString();
      const ticketsTotal = parseInt(editForm.ticketsTotal, 10);
      if (!editForm.category) throw new Error("Pick a category");
      if (!Number.isFinite(ticketsTotal) || ticketsTotal < 1) throw new Error("Total ticket supply must be ≥ 1");

      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          category: editForm.category,
          date: isoDate,
          location: editForm.location,
          image: editForm.image,
          ticketsTotal,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }
      const data = await res.json();
      setEvent((e) => e ? { ...e, ...data.event } : e);
      setEditing(false);
    } catch (err) {
      setEditError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const updateEdit = (k: keyof typeof editForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setEditForm((f) => ({ ...f, [k]: e.target.value }));

  // Rewards
  useEffect(() => {
    if (!id) return;
    getRewardConfig(id)
      .then((cfg) => setRewardPerCheckin(cfg?.tokenPerCheckin ?? 0))
      .catch(() => {})
      .finally(() => setRewardLoading(false));
  }, [id]);

  const saveRewardConfig = async () => {
    if (!id) return;
    setRewardSaving(true);
    setRewardError(null);
    try {
      await setRewardConfig(id, rewardPerCheckin);
    } catch (err) {
      setRewardError((err as Error).message);
    } finally {
      setRewardSaving(false);
    }
  };

  const handleBatchDisburse = async () => {
    if (!id) return;
    if (!confirm("Disburse VTX tokens to all checked-in attendees?")) return;
    setBatchDisbursing(true);
    setBatchResult(null);
    try {
      const result = await disburseBatch(id);
      setBatchResult(`Disbursed to ${result.length} attendee(s).`);
    } catch (err) {
      setBatchResult(`Error: ${(err as Error).message}`);
    } finally {
      setBatchDisbursing(false);
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
          {!editing && (
            <button onClick={startEdit} className="btn-secondary flex-1 sm:flex-initial">
              Edit Event
            </button>
          )}
          <button onClick={cancel} className="btn-danger flex-1 sm:flex-initial">
            Cancel Event
          </button>
        </div>
      </div>

      {editing && (
        <div className="card p-5 sm:p-6 mt-6 space-y-4">
          <h3 className="font-semibold text-sm text-slate-900">Edit event</h3>
          <div>
            <label className="label">Title</label>
            <input className="input" value={editForm.title} onChange={updateEdit("title")} maxLength={200} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-[100px] resize-y" value={editForm.description} onChange={updateEdit("description")} maxLength={5000} />
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Category</label>
              <select className="input" value={editForm.category} onChange={updateEdit("category")}>
                <option value="" disabled>Choose…</option>
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={editForm.date} onChange={updateEdit("date")} />
            </div>
            <div>
              <label className="label">Time</label>
              <input type="time" className="input" value={editForm.time} onChange={updateEdit("time")} />
            </div>
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" value={editForm.location} onChange={updateEdit("location")} maxLength={300} />
          </div>
          <div>
            <label className="label">Event image</label>
            <ImageUpload value={editForm.image} onChange={(url) => setEditForm((f) => ({ ...f, image: url }))} />
          </div>
          <div>
            <label className="label">Total ticket supply</label>
            <input className="input" type="number" min={1} value={editForm.ticketsTotal} onChange={updateEdit("ticketsTotal")} />
          </div>
          {editError && <div className="text-sm text-red-600">{editError}</div>}
          <div className="flex gap-2 justify-end">
            <button className="btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn-primary" onClick={saveEdit} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      )}

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

      <div className="mt-10">
        <h2 className="font-semibold text-lg mb-4">VTX Token Rewards</h2>
        <div className="card p-5 sm:p-6 space-y-4">
          <div>
            <label className="label">Tokens per check-in</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                className="input w-32"
                value={rewardPerCheckin}
                onChange={(e) => setRewardPerCheckin(parseInt(e.target.value, 10) || 0)}
                disabled={rewardLoading}
              />
              <button
                onClick={saveRewardConfig}
                className="btn-primary"
                disabled={rewardSaving || rewardLoading}
              >
                {rewardSaving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={handleBatchDisburse}
                className="btn-secondary"
                disabled={batchDisbursing || rewardPerCheckin === 0}
              >
                {batchDisbursing ? "Disbursing…" : "Disburse to all"}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              Set how many VTX tokens each attendee receives when they check in. Use "Disburse to all" to send tokens to everyone who bought a ticket.
            </p>
          </div>
          {rewardError && <div className="text-sm text-red-600">{rewardError}</div>}
          {batchResult && <div className="text-sm text-emerald-600">{batchResult}</div>}
        </div>
      </div>
    </div>
  );
}
