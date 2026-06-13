"use client";

import { useEffect, useState } from "react";
import EventCard from "@/components/EventCard";
import { fetchEvents } from "@/lib/apiClient";
import type { AppEvent } from "@/lib/types";

export default function FeaturedEvents() {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents()
      .then((evts) => setEvents(evts.slice(0, 3)))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-slate-500 text-center py-6">Loading events…</div>;
  }
  if (events.length === 0) {
    return <div className="text-slate-500 text-center py-6">No events yet.</div>;
  }
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {events.map((e) => (
        <EventCard key={e.id} event={e} />
      ))}
    </div>
  );
}
