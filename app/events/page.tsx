"use client";

import { useEffect, useState, useCallback } from "react";
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

const PAGE_SIZE = 12;

export default function EventsPage() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<(typeof categories)[number]>("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(
    (p: number) => {
      let cancelled = false;
      setLoading(true);
      setError(null);
      const handle = setTimeout(() => {
        fetchEvents({
          category: cat === "All" ? undefined : cat,
          q: query || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          minPrice: minPrice || undefined,
          maxPrice: maxPrice || undefined,
          limit: PAGE_SIZE,
          offset: p * PAGE_SIZE,
        })
          .then(({ events: evts, total: t }) => {
            if (!cancelled) {
              setEvents(evts);
              setTotal(t);
            }
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
    },
    [cat, query, dateFrom, dateTo, minPrice, maxPrice],
  );

  // Reset to page 0 when filters change
  useEffect(() => {
    setPage(0);
  }, [cat, query, dateFrom, dateTo, minPrice, maxPrice]);

  // Load current page
  useEffect(() => {
    return loadPage(page);
  }, [page, loadPage]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="container-page">
      <PageHeader
        title="Browse events"
        subtitle="Find events to attend. Buy tickets directly from organizers, settled on Stacks or Bitcoin."
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
                  : "bg-white dark:bg-[var(--card-bg)] border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Date and price filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input !py-1.5 !px-2 text-xs" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input !py-1.5 !px-2 text-xs" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Min price</label>
          <input type="number" min={0} step="0.01" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="input !py-1.5 !px-2 text-xs w-24" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Max price</label>
          <input type="number" min={0} step="0.01" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="input !py-1.5 !px-2 text-xs w-24" />
        </div>
        {(dateFrom || dateTo || minPrice || maxPrice) && (
          <button onClick={() => { setDateFrom(""); setDateTo(""); setMinPrice(""); setMaxPrice(""); }} className="text-xs text-slate-500 hover:text-slate-800 underline">
            Clear filters
          </button>
        )}
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
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="btn-secondary !py-1.5 !px-3 text-sm disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="text-sm text-slate-500">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="btn-secondary !py-1.5 !px-3 text-sm disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
