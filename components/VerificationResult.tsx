export type VerifyState = "valid" | "used" | "invalid";

const config: Record<
  VerifyState,
  { title: string; description: string; icon: string; bg: string; ring: string }
> = {
  valid: {
    title: "Valid ticket",
    description: "This ticket is valid for entry. Allow the attendee in.",
    icon: "✓",
    bg: "bg-emerald-50 dark:bg-emerald-950",
    ring: "ring-emerald-200 dark:ring-emerald-800 text-emerald-700 dark:text-emerald-300",
  },
  used: {
    title: "Already used",
    description:
      "This ticket has already been checked in. Do not allow re-entry.",
    icon: "↻",
    bg: "bg-amber-50 dark:bg-amber-950",
    ring: "ring-amber-200 dark:ring-amber-800 text-amber-700 dark:text-amber-300",
  },
  invalid: {
    title: "Invalid ticket",
    description: "This ticket ID was not found for this event.",
    icon: "✕",
    bg: "bg-rose-50 dark:bg-rose-950",
    ring: "ring-rose-200 dark:ring-rose-800 text-rose-700 dark:text-rose-300",
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
    <div className={`card p-5 sm:p-6 ${c.bg}`}>
      <div className="flex items-center gap-3 sm:gap-4">
        <div
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full grid place-items-center text-xl sm:text-2xl font-bold bg-white ring-2 ${c.ring} shrink-0`}
        >
          {c.icon}
        </div>
        <div className="min-w-0">
          <div className={`text-base sm:text-lg font-semibold ${c.ring.split(" ")[1]}`}>
            {c.title}
          </div>
          <div className="text-sm text-slate-600">{c.description}</div>
        </div>
      </div>
      <div className="mt-4 sm:mt-5 pt-4 border-t border-white/60 grid grid-cols-2 gap-4 text-sm">
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
