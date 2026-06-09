"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import QRCodePlaceholder from "@/components/QRCodePlaceholder";
import TicketStatusBadge from "@/components/TicketStatusBadge";
import { mockTickets, shortAddr } from "@/lib/mockData";

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const ticket = mockTickets.find((t) => t.id === id);

  if (!ticket) {
    return (
      <div className="container-page">
        <div className="card p-10 text-center">
          <h2 className="font-semibold text-lg">Ticket not found</h2>
          <Link href="/my-tickets" className="btn-primary mt-5">
            Back to my tickets
          </Link>
        </div>
      </div>
    );
  }

  const date = new Date(ticket.eventDate);

  return (
    <div className="container-page max-w-2xl">
      <Link
        href="/my-tickets"
        className="text-sm text-slate-500 hover:text-slate-800"
      >
        ← Back to my tickets
      </Link>

      <div className="mt-4 card overflow-hidden">
        <div className="p-6 sm:p-8 bg-gradient-to-br from-brand-600 to-brand-800 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-brand-100">
                Event ticket
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold mt-1">
                {ticket.eventName}
              </h1>
            </div>
            <TicketStatusBadge status={ticket.status} />
          </div>
          <div className="mt-4 text-sm text-brand-50 space-y-1">
            <div>
              📅{" "}
              {date.toLocaleDateString(undefined, {
                weekday: "short",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}{" "}
              ·{" "}
              {date.toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div>📍 {ticket.location}</div>
          </div>
        </div>

        {/* perforation */}
        <div className="relative">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-slate-200" />
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--background)]" />
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--background)]" />
          <div className="h-6" />
        </div>

        <div className="p-6 sm:p-8 grid sm:grid-cols-2 gap-6 items-center">
          <div>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-slate-500">Ticket ID</div>
                <div className="font-mono text-slate-900">{ticket.id}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Owner wallet</div>
                <div className="font-mono text-slate-900">
                  {shortAddr(ticket.owner)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Status</div>
                <div className="mt-1">
                  <TicketStatusBadge status={ticket.status} />
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-600 mt-5">
              Show this ticket at the event entrance.
            </p>
          </div>

          <div className="flex justify-center sm:justify-end">
            <QRCodePlaceholder value={ticket.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
