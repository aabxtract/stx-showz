"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import TicketCard from "@/components/TicketCard";
import EmptyState from "@/components/EmptyState";
import PageHeader from "@/components/PageHeader";
import { fetchMyTickets, type ApiTicket } from "@/lib/apiClient";
import { useWallet } from "@/components/WalletProvider";
import type { Ticket } from "@/lib/types";

function adapt(t: ApiTicket): Ticket {
  return {
    id: t.id,
    eventId: t.eventId,
    eventName: t.eventTitle,
    eventDate: t.eventDate,
    location: t.location,
    owner: "",
    status: t.status === "Pending" ? "Valid" : (t.status as Ticket["status"]),
  };
}

export default function MyTicketsPage() {
  const { isAuthed, authLoading } = useWallet();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthed) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchMyTickets()
      .then((ts) => setTickets(ts.map(adapt)))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [isAuthed]);

  if (authLoading) {
    return <div className="container-page text-slate-500">Loading…</div>;
  }

  if (!isAuthed) {
    return (
      <div className="container-page">
        <PageHeader title="My tickets" subtitle="Sign in to see your tickets." />
        <EmptyState
          icon="🔐"
          title="Not signed in"
          description="Connect your wallet and sign in to view your tickets."
          action={
            <Link href="/login" className="btn-primary">
              Sign in
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page">
      <PageHeader
        title="My tickets"
        subtitle="All the tickets you've purchased. Tap any ticket to show at the door."
      />

      {loading ? (
        <div className="text-slate-500">Loading tickets…</div>
      ) : error ? (
        <EmptyState icon="⚠️" title="Could not load tickets" description={error} />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon="🎟️"
          title="You don't have any tickets yet"
          description="Browse upcoming events to find something to attend."
          action={
            <Link href="/events" className="btn-primary">
              Browse Events
            </Link>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {tickets.map((t) => (
            <TicketCard key={t.id} ticket={t} />
          ))}
        </div>
      )}
    </div>
  );
}
