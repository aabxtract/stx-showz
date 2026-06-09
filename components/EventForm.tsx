"use client";

import { useState } from "react";

const categories = ["Music", "Tech", "Sports", "Art", "Conference", "Workshop"];

export default function EventForm() {
  const [submitted, setSubmitted] = useState(false);
  const [transferable, setTransferable] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (submitted) {
    return (
      <div className="card p-8 text-center">
        <div className="text-4xl mb-3">🎉</div>
        <h3 className="text-xl font-semibold">
          Event created successfully in frontend mock mode.
        </h3>
        <p className="text-slate-600 mt-2">
          Wallet and on-chain creation will be added in a later milestone.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="btn-secondary mt-6"
        >
          Create another event
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 sm:p-8 space-y-6">
      <section className="space-y-4">
        <h3 className="font-semibold text-slate-900">Event details</h3>
        <div>
          <label className="label">Event title</label>
          <input className="input" required placeholder="My amazing event" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            className="input min-h-[120px] resize-y"
            required
            placeholder="What's this event about?"
          />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Category</label>
            <select className="input" defaultValue="">
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
            <input type="date" className="input" required />
          </div>
          <div>
            <label className="label">Time</label>
            <input type="time" className="input" required />
          </div>
        </div>
        <div>
          <label className="label">Location</label>
          <input className="input" required placeholder="City, country or Online" />
        </div>
        <div>
          <label className="label">Event image URL</label>
          <input
            className="input"
            type="url"
            placeholder="https://…"
            required
          />
        </div>
      </section>

      <section className="space-y-4 pt-2 border-t border-slate-200">
        <h3 className="font-semibold text-slate-900 pt-4">Ticket settings</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Ticket name</label>
            <input className="input" required placeholder="General Admission" />
          </div>
          <div>
            <label className="label">Ticket price (STX)</label>
            <input
              className="input"
              type="number"
              min={0}
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="label">Total ticket supply</label>
            <input className="input" type="number" min={1} required />
          </div>
          <div>
            <label className="label">Max tickets per wallet</label>
            <input className="input" type="number" min={1} defaultValue={4} />
          </div>
        </div>

        <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200">
          <div>
            <div className="font-medium text-sm">Transferable tickets</div>
            <div className="text-xs text-slate-500">
              Allow ticket holders to transfer their tickets to another wallet.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTransferable((v) => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              transferable ? "bg-brand-600" : "bg-slate-300"
            }`}
            aria-pressed={transferable}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                transferable ? "translate-x-5" : ""
              }`}
            />
          </button>
        </label>
      </section>

      <div className="pt-2 flex flex-col sm:flex-row gap-3 sm:justify-end">
        <button type="button" className="btn-ghost">
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          Create Event
        </button>
      </div>
    </form>
  );
}
