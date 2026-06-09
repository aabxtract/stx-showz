"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { mockEvents, shortAddr } from "@/lib/mockData";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const event = mockEvents.find((e) => e.id === id);
  const [showModal, setShowModal] = useState(false);

  if (!event) {
    return (
      <div className="container-page">
        <div className="card p-10 text-center">
          <h2 className="font-semibold text-lg">Event not found</h2>
          <p className="text-slate-600 mt-1.5">
            We couldn't find that event.
          </p>
          <Link href="/events" className="btn-primary mt-5">
            Back to events
          </Link>
        </div>
      </div>
    );
  }

  const date = new Date(event.date);
  const soldOut = event.ticketsLeft === 0;

  return (
    <div className="container-page">
      <Link
        href="/events"
        className="text-sm text-slate-500 hover:text-slate-800"
      >
        ← Back to events
      </Link>

      <div className="mt-4 card overflow-hidden">
        <div className="relative aspect-[21/9] bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="mt-8 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-100">
              {event.category}
            </span>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-3">
              {event.title}
            </h1>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-600">
              <div>
                📅{" "}
                {date.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              <div>
                🕒{" "}
                {date.toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div>📍 {event.location}</div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold">About this event</h2>
            <p className="text-slate-700 leading-relaxed mt-3 whitespace-pre-line">
              {event.description}
            </p>
          </div>

          <div className="card p-6 bg-gradient-to-br from-brand-50 to-white">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 grid place-items-center text-brand-700">
                🔗
              </div>
              <div>
                <h3 className="font-semibold">Blockchain-backed ticket</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Your ticket will be minted as an NFT on the Stacks blockchain.
                  That means you fully own it, can verify it instantly at the
                  door, and it can't be duplicated or counterfeited.
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside>
          <div className="card p-6 lg:sticky lg:top-20">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-xs text-slate-500">Ticket price</div>
                <div className="text-3xl font-semibold mt-0.5">
                  {event.price} <span className="text-base">STX</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">Available</div>
                <div className="font-semibold">
                  {event.ticketsLeft} / {event.ticketsTotal}
                </div>
              </div>
            </div>

            <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500"
                style={{
                  width: `${
                    ((event.ticketsTotal - event.ticketsLeft) /
                      event.ticketsTotal) *
                    100
                  }%`,
                }}
              />
            </div>

            <button
              onClick={() => setShowModal(true)}
              disabled={soldOut}
              className="btn-primary w-full mt-6 !py-3 text-base"
            >
              {soldOut ? "Sold out" : "Buy Ticket"}
            </button>

            <div className="mt-5 pt-5 border-t border-slate-100 text-sm">
              <div className="text-xs text-slate-500">Organizer</div>
              <div className="font-mono text-slate-800 mt-0.5">
                {shortAddr(event.organizer)}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="card max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-3xl">🔌</div>
            <h3 className="mt-3 font-semibold text-lg">
              Wallet integration coming soon
            </h3>
            <p className="text-slate-600 mt-2 text-sm">
              Wallet and ticket purchase integration will be added later. For
              now, this is a frontend-only preview.
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="btn-primary w-full mt-5"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
