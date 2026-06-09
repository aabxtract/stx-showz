export type VerifyState = "valid" | "used" | "invalid";

const config: Record<
  VerifyState,
  { title: string; description: string; icon: string; bg: string; ring: string }
> = {
  valid: {
    title: "Valid ticket",
    description: "This ticket is valid for entry. Allow the attendee in.",
    icon: "✓",
    bg: "bg-emerald-50",
    ring: "ring-emerald-200 text-emerald-700",
  },
  used: {
    title: "Already used",
    description:
      "This ticket has already been checked in. Do not allow re-entry.",
    icon: "↻",
    bg: "bg-amber-50",
    ring: "ring-amber-200 text-amber-700",
  },
  invalid: {
    title: "Invalid ticket",
    description: "This ticket ID was not found for this event.",
    icon: "✕",
    bg: "bg-rose-50",
    ring: "ring-rose-200 text-rose-700",
  },
};

export default function VerificationResult({
  state,
  ticketId,
  eventId,
}: {
  state: VerifyState;
  ticketId: string;
  eventId: string;
}) {
  const c = config[state];
  return (
    <div className={`card p-6 ${c.bg}`}>
      <div className="flex items-center gap-4">
        <div
          className={`w-14 h-14 rounded-full grid place-items-center text-2xl font-bold bg-white ring-2 ${c.ring}`}
        >
          {c.icon}
        </div>
        <div>
          <div className={`text-lg font-semibold ${c.ring.split(" ")[1]}`}>
            {c.title}
          </div>
          <div className="text-sm text-slate-600">{c.description}</div>
        </div>
      </div>
      <div className="mt-5 pt-4 border-t border-white/60 grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-xs text-slate-500">Ticket ID</div>
          <div className="font-mono">{ticketId}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Event ID</div>
          <div className="font-mono">{eventId}</div>
        </div>
      </div>
    </div>
  );
}
