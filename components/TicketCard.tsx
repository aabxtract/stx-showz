import Link from "next/link";
import type { Ticket } from "@/lib/types";
import TicketStatusBadge from "./TicketStatusBadge";

export default function TicketCard({ ticket }: { ticket: Ticket }) {
  const date = new Date(ticket.eventDate);

  return (
    <div className="card overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex">
        <div className="hidden sm:flex w-2 bg-gradient-to-b from-brand-500 to-brand-700" />
        <div className="flex-1 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-base line-clamp-1">
                {ticket.eventName}
              </h3>
              <div className="mt-1.5 text-sm text-slate-600 space-y-0.5">
                <div>
                  📅{" "}
                  {date.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
                <div>📍 {ticket.location}</div>
              </div>
            </div>
            <TicketStatusBadge status={ticket.status} />
          </div>

          <div className="mt-4 pt-4 border-t border-dashed border-slate-200 flex items-center justify-between">
            <div className="text-xs">
              <div className="text-slate-500">Ticket ID</div>
              <div className="font-mono text-slate-800">{ticket.id}</div>
            </div>
            <Link
              href={`/tickets/${ticket.id}`}
              className="btn-secondary !py-1.5 !px-3 text-xs"
            >
              View Ticket
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
