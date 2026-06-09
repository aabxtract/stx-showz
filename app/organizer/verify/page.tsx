"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import VerificationResult, {
  type VerifyState,
} from "@/components/VerificationResult";

export default function VerifyPage() {
  const [ticketId, setTicketId] = useState("");
  const [eventId, setEventId] = useState("");
  const [result, setResult] = useState<{
    state: VerifyState;
    ticketId: string;
    eventId: string;
  } | null>(null);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock: deterministic state based on ticket ID's last char
    const last = ticketId.trim().slice(-1).toLowerCase();
    let state: VerifyState = "valid";
    if (!ticketId.trim() || !eventId.trim()) state = "invalid";
    else if (/[02468]/.test(last)) state = "valid";
    else if (/[13579]/.test(last)) state = "used";
    else state = "invalid";

    setResult({ state, ticketId: ticketId.trim(), eventId: eventId.trim() });
  };

  return (
    <div className="container-page max-w-2xl">
      <PageHeader
        title="Verify tickets"
        subtitle="Check a ticket at the door. Enter a Ticket ID and the Event ID to validate."
      />

      <form onSubmit={handleVerify} className="card p-6 space-y-4">
        <div>
          <label className="label">Ticket ID</label>
          <input
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
            className="input font-mono"
            placeholder="tkt-1001"
            required
          />
        </div>
        <div>
          <label className="label">Event ID</label>
          <input
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="input font-mono"
            placeholder="evt-001"
            required
          />
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn-primary">
            Verify Ticket
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-6">
          <VerificationResult
            state={result.state}
            ticketId={result.ticketId}
            eventId={result.eventId}
          />
        </div>
      )}
    </div>
  );
}
