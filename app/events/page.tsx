"use client";

import { useEffect, useState } from "react";
import EventCard from "@/components/EventCard";
import EmptyState from "@/components/EmptyState";
import PageHeader from "@/components/PageHeader";
import { fetchEvents } from "@/lib/apiClient";
import type { AppEvent } from "@/lib/types";

const categories = [
  "All",
  "Music",
  "Tech",
  "Sports",
  "Art",
  "Conference",
  "Workshop",
] as const;

export default function EventsPage() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<(typeof categories)[number]>("All");
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const handle = setTimeout(() => {
      fetchEvents({ category: cat === "All" ? undefined : cat, q: query || undefined })
        .then((evts) => {
          if (!cancelled) setEvents(evts);
        })
        .catch((e: Error) => {
          if (!cancelled) setError(e.message);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [cat, query]);

  return (
    <div className="container-page">
      <PageHeader
        title="Browse events"
        subtitle="Find events to attend. Buy tickets directly from organizers, settled on Stacks."
      />

      <div className="flex flex-col lg:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            🔍
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input !pl-10"
            placeholder="Search events by title or location"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3 py-2 rounded-xl text-sm whitespace-nowrap border transition-colors ${
                cat === c
                  ? "bg-brand-600 border-brand-600 text-white"
                  : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 py-10">Loading events…</div>
      ) : error ? (
        <EmptyState icon="⚠️" title="Could not load events" description={error} />
      ) : events.length === 0 ? (
        <EmptyState
          icon="🎟️"
          title="No events match your filters"
          description="Try clearing your search or picking a different category."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}
