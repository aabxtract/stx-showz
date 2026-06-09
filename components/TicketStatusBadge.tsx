import type { TicketStatus } from "@/lib/types";

const styles: Record<TicketStatus, string> = {
  Valid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Used: "bg-slate-100 text-slate-600 border-slate-200",
  Cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function TicketStatusBadge({
  status,
}: {
  status: TicketStatus;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
