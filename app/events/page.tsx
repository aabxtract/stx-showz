"use client";

import { useMemo, useState } from "react";
import EventCard from "@/components/EventCard";
import EmptyState from "@/components/EmptyState";
import PageHeader from "@/components/PageHeader";
import { mockEvents } from "@/lib/mockData";

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

  const filtered = useMemo(() => {
    return mockEvents.filter((e) => {
      const matchesCat = cat === "All" || e.category === cat;
      const q = query.trim().toLowerCase();
      const matchesQ =
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });
  }, [query, cat]);

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

      {filtered.length === 0 ? (
        <EmptyState
          icon="🎟️"
          title="No events match your filters"
          description="Try clearing your search or picking a different category."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}
