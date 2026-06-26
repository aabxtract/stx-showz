"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import QRCode from "@/components/QRCode";
import TicketStatusBadge from "@/components/TicketStatusBadge";
import { useWallet } from "@/components/WalletProvider";
import { shortAddress } from "@/components/WalletProvider";
import type { TicketStatus } from "@/lib/types";

interface TicketDetail {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  location: string;
  image: string;
  eventStatus: string;
  txId: string;
  txStatus: string;
  amountStx: string;
  network: string;
  status: TicketStatus;
  usedAt: string | null;
  createdAt: string;
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthed, authLoading } = useWallet();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthed) {
      setLoading(false);
      return;
    }
    fetch(`/api/tickets/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Ticket not found");
        }
        return res.json();
      })
      .then((data) => setTicket(data.ticket))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isAuthed]);

  if (authLoading || loading) {
    return (
      <div className="container-page">
        <div className="card p-10 text-center text-slate-500">Loading ticket…</div>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="container-page">
        <div className="card p-10 text-center">
          <h2 className="font-semibold text-lg">Sign in required</h2>
          <p className="text-slate-500 mt-2 text-sm">Connect your wallet to view this ticket.</p>
          <Link href="/login" className="btn-primary mt-5">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="container-page">
        <div className="card p-10 text-center">
          <h2 className="font-semibold text-lg">Ticket not found</h2>
          <p className="text-slate-500 mt-2 text-sm">{error ?? "This ticket doesn't exist or you don't have access."}</p>
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
          <div className="p-5 sm:p-8 bg-gradient-to-br from-brand-600 to-brand-800 text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[10px] sm:text-xs uppercase tracking-wider text-brand-100">
                  Event ticket
                </div>
                <h1 className="text-xl xs:text-2xl sm:text-3xl font-semibold mt-1 break-words">
                  {ticket.eventTitle}
                </h1>
              </div>
              <TicketStatusBadge status={ticket.status} />
            </div>
            <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-brand-50 space-y-1">
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

          <div className="p-5 sm:p-8 grid sm:grid-cols-2 gap-5 sm:gap-6 items-center">
          <div>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-slate-500">Ticket ID</div>
                <div className="font-mono text-slate-900">{ticket.id}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Transaction</div>
                <div className="font-mono text-slate-900 text-xs break-all">{ticket.txId}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Amount</div>
                <div className="font-mono text-slate-900">{ticket.amountStx} STX</div>
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
            <QRCode value={ticket.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
