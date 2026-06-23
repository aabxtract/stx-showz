import type { TicketStatus } from "@/lib/types";

const styles: Record<TicketStatus, string> = {
  Valid: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  Used: "bg-slate-100 text-slate-600 border-slate-200",
  Cancelled: "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
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
