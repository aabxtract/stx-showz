import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <Image
            src="/favicon.png"
            alt="Veritix"
            width={64}
            height={64}
            className="w-6 h-6 rounded-md"
          />
          <span>Veritix · Blockchain-backed event ticketing</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href="/events" className="hover:text-slate-900 py-1">
            Events
          </Link>
          <Link href="/create-event" className="hover:text-slate-900 py-1">
            Create
          </Link>
          <Link href="/organizer/dashboard" className="hover:text-slate-900 py-1">
            Organizer
          </Link>
        </div>
      </div>
    </footer>
  );
}
