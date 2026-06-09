import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center text-white text-xs">
            S
          </span>
          <span>STX Showz · Blockchain-backed event ticketing</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/events" className="hover:text-slate-900">
            Events
          </Link>
          <Link href="/create-event" className="hover:text-slate-900">
            Create
          </Link>
          <Link href="/organizer/dashboard" className="hover:text-slate-900">
            Organizer
          </Link>
        </div>
      </div>
    </footer>
  );
}
