"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEvent } from "@/lib/apiClient";
import { useWallet } from "@/components/WalletProvider";
import ImageUpload from "@/components/ImageUpload";

const categories = ["Music", "Tech", "Sports", "Art", "Conference", "Workshop"] as const;

const CURRENCY_LABELS: Record<string, string> = {
  stacks: "STX",
  bitcoin: "BTC",
};

export default function EventForm() {
  const router = useRouter();
  const { isAuthed, signInWithServer, isConnected, connect } = useWallet();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    date: "",
    time: "",
    location: "",
    image: "",
    network: "stacks",
    price: "",
    ticketsTotal: "",
  });

  const update =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isConnected) return connect();
    if (!isAuthed) {
      try {
        await signInWithServer();
      } catch (err) {
        setError((err as Error).message);
        return;
      }
    }

    if (!form.category) {
      setError("Pick a category");
      return;
    }
    const isoDate = new Date(`${form.date}T${form.time || "00:00"}:00`).toISOString();
    const ticketsTotal = parseInt(form.ticketsTotal, 10);
    if (!Number.isFinite(ticketsTotal) || ticketsTotal < 1) {
      setError("Total ticket supply must be ≥ 1");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createEvent({
        title: form.title,
        description: form.description,
        category: form.category,
        date: isoDate,
        location: form.location,
        image: form.image,
        price: form.price,
        network: form.network,
        ticketsTotal,
      });
      router.push(`/events/${created.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 sm:p-8 space-y-6">
      <section className="space-y-4">
        <h3 className="font-semibold text-slate-900">Event details</h3>
        <div>
          <label className="label">Event title</label>
          <input
            className="input"
            required
            value={form.title}
            onChange={update("title")}
            placeholder="My amazing event"
          />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            className="input min-h-[120px] resize-y"
            required
            value={form.description}
            onChange={update("description")}
            placeholder="What's this event about?"
          />
        </div>
        <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              required
              value={form.category}
              onChange={update("category")}
            >
              <option value="" disabled>
                Choose…
              </option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              required
              value={form.date}
              onChange={update("date")}
            />
          </div>
          <div>
            <label className="label">Time</label>
            <input
              type="time"
              className="input"
              required
              value={form.time}
              onChange={update("time")}
            />
          </div>
        </div>
        <div>
          <label className="label">Location</label>
          <input
            className="input"
            required
            value={form.location}
            onChange={update("location")}
            placeholder="City, country or Online"
          />
        </div>
        <div>
          <label className="label">Event image</label>
          <ImageUpload value={form.image} onChange={(url) => setForm((f) => ({ ...f, image: url }))} />
        </div>
      </section>

      <section className="space-y-4 pt-2 border-t border-slate-200">
        <h3 className="font-semibold text-slate-900 pt-4">Ticket settings</h3>

        <div>
          <label className="label">Blockchain network</label>
          <div className="flex gap-3">
            {(["stacks", "bitcoin"] as const).map((n) => (
              <label
                key={n}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium cursor-pointer transition-colors ${
                  form.network === n
                    ? "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-700 dark:bg-brand-900/30 dark:text-brand-400"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-600 dark:bg-[var(--card-bg)] dark:text-slate-400"
                }`}
              >
                <input
                  type="radio"
                  name="network"
                  value={n}
                  checked={form.network === n}
                  onChange={update("network")}
                  className="sr-only"
                />
                {n === "stacks" ? "⚡" : "₿"} {n === "stacks" ? "Stacks" : "Bitcoin"}
              </label>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Ticket price ({CURRENCY_LABELS[form.network]})</label>
            <input
              className="input"
              type="number"
              min={0}
              step="0.000001"
              required
              value={form.price}
              onChange={update("price")}
            />
          </div>
          <div>
            <label className="label">Total ticket supply</label>
            <input
              className="input"
              type="number"
              min={1}
              required
              value={form.ticketsTotal}
              onChange={update("ticketsTotal")}
            />
          </div>
        </div>
      </section>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="pt-2 flex flex-col sm:flex-row gap-3 sm:justify-end">
        <button type="button" className="btn-ghost" onClick={() => router.back()}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Creating…" : "Create Event"}
        </button>
      </div>
    </form>
  );
}
