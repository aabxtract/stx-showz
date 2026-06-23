import Link from "next/link";
import type { AppEvent } from "@/lib/types";
import { shortAddr } from "@/lib/mockData";

export default function EventCard({ event }: { event: AppEvent }) {
  const date = new Date(event.date);
  const soldOut = event.ticketsLeft === 0;

  return (
    <div className="card overflow-hidden flex flex-col transition-shadow duration-200 active:shadow-md sm:hover:-translate-y-0.5 sm:hover:shadow-lg">
      <div className="relative aspect-[4/3] xs:aspect-[16/10] bg-slate-100 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-xs font-medium text-slate-700">
          {event.category}
        </div>
        {soldOut && (
          <div className="absolute top-3 right-3 bg-rose-600 text-white px-2.5 py-1 rounded-full text-xs font-medium">
            Sold out
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-semibold text-base line-clamp-1">{event.title}</h3>

        <div className="mt-2 space-y-1 text-sm text-slate-600">
          <div className="flex items-center gap-1.5">
            <span>📅</span>
            <span>
              {date.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>📍</span>
            <span className="line-clamp-1">{event.location}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <div>
            <div className="text-xs text-slate-500">Price</div>
            <div className="font-semibold text-slate-900">
              {event.price} STX
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Tickets left</div>
            <div className="font-semibold text-slate-900">
              {event.ticketsLeft}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            By{" "}
            <span className="font-mono text-slate-700">
              {shortAddr(event.organizer)}
            </span>
          </div>
          <Link
            href={`/events/${event.id}`}
            className="text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            View Event →
          </Link>
        </div>
      </div>
    </div>
  );
}
