import Link from "next/link";
import TicketCard from "@/components/TicketCard";
import EmptyState from "@/components/EmptyState";
import PageHeader from "@/components/PageHeader";
import { mockTickets } from "@/lib/mockData";

export default function MyTicketsPage() {
  return (
    <div className="container-page">
      <PageHeader
        title="My tickets"
        subtitle="All the tickets you've purchased. Tap any ticket to show at the door."
      />

      {mockTickets.length === 0 ? (
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
          {mockTickets.map((t) => (
            <TicketCard key={t.id} ticket={t} />
          ))}
        </div>
      )}
    </div>
  );
}
