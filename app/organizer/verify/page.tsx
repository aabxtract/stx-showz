"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import VerificationResult, { type VerifyState } from "@/components/VerificationResult";
import { verifyTicket } from "@/lib/apiClient";
import { useWallet } from "@/components/WalletProvider";

export default function VerifyPage() {
  const { isAuthed } = useWallet();
  const [ticketId, setTicketId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    state: VerifyState;
    ticketId: string;
    eventTitle?: string;
    error?: string;
  } | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId.trim()) return;
    setSubmitting(true);
    try {
      const res = await verifyTicket(ticketId.trim());
      if (res.ok) {
        const ticket = (res as { ticket?: { eventTitle?: string } }).ticket;
        setResult({ state: "valid", ticketId: ticketId.trim(), eventTitle: ticket?.eventTitle });
      } else if (res.error?.toLowerCase().includes("already used")) {
        setResult({ state: "used", ticketId: ticketId.trim() });
      } else {
        setResult({ state: "invalid", ticketId: ticketId.trim(), error: res.error });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthed) {
    return (
      <div className="container-page max-w-2xl">
        <PageHeader title="Verify tickets" subtitle="Sign in as the event organizer to verify tickets." />
      </div>
    );
  }

  return (
    <div className="container-page max-w-2xl">
      <PageHeader
        title="Verify tickets"
        subtitle="Check a ticket at the door. Enter the Ticket ID to validate."
      />

      <form onSubmit={handleVerify} className="card p-6 space-y-4">
        <div>
          <label className="label">Ticket ID</label>
          <input
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
            className="input font-mono"
            placeholder="e.g. clx9ab8s700001abc"
            required
          />
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Verifying…" : "Verify Ticket"}
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-6">
          <VerificationResult
            state={result.state}
            ticketId={result.ticketId}
            eventId={result.eventTitle || result.error || ""}
          />
        </div>
      )}
    </div>
  );
}
