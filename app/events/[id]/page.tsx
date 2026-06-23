"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { openSTXTransfer } from "@stacks/connect";
import { StacksMainnet, StacksTestnet } from "@stacks/network";
import { useWallet, shortAddress } from "@/components/WalletProvider";
import { fetchEvent, purchaseTicket } from "@/lib/apiClient";
import type { AppEvent } from "@/lib/types";

const ESCROW_TESTNET = process.env.NEXT_PUBLIC_ESCROW_ADDRESS_TESTNET || "";
const ESCROW_MAINNET = process.env.NEXT_PUBLIC_ESCROW_ADDRESS_MAINNET || "";
const DEV_PAYMENT_BYPASS = process.env.NEXT_PUBLIC_DEV_PAYMENT_BYPASS === "true";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthed, network, connect, isConnected, signInWithServer } = useWallet();

  const [event, setEvent] = useState<AppEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchaseState, setPurchaseState] = useState<
    | { stage: "idle" }
    | { stage: "signing" }
    | { stage: "pending"; txId: string }
    | { stage: "success"; txId: string }
    | { stage: "error"; message: string }
  >({ stage: "idle" });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchEvent(id)
      .then(setEvent)
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBuy = async () => {
    if (!event) return;
    if (!isConnected) return connect();
    if (!isAuthed) {
      try {
        await signInWithServer();
      } catch (e) {
        setPurchaseState({ stage: "error", message: (e as Error).message });
        return;
      }
    }

    if (DEV_PAYMENT_BYPASS) {
      setPurchaseState({ stage: "signing" });
      const fakeTxId = `0xdev${Math.random().toString(16).slice(2).padEnd(60, "0").slice(0, 60)}`;
      try {
        const res = await purchaseTicket({ eventId: event.id, txId: fakeTxId, network });
        if (res?.ticket?.status === "Valid") {
          setPurchaseState({ stage: "success", txId: fakeTxId });
        } else {
          setPurchaseState({ stage: "error", message: "Could not finalize ticket" });
        }
      } catch (e) {
        setPurchaseState({ stage: "error", message: (e as Error).message });
      }
      return;
    }

    const escrow = network === "mainnet" ? ESCROW_MAINNET : ESCROW_TESTNET;
    if (!escrow) {
      setPurchaseState({
        stage: "error",
        message: "Escrow address not configured for this network",
      });
      return;
    }

    const microStx = Math.round(event.price * 1_000_000).toString();
    const stacksNetwork = network === "mainnet" ? new StacksMainnet() : new StacksTestnet();

    setPurchaseState({ stage: "signing" });
    try {
      await new Promise<void>((resolve, reject) => {
        openSTXTransfer({
          recipient: escrow,
          amount: microStx,
          memo: `veritix:${event.id}`,
          network: stacksNetwork,
          appDetails: { name: "Veritix", icon: `${window.location.origin}/favicon.png` },
          onFinish: async (data) => {
            const txId = data.txId.startsWith("0x") ? data.txId : `0x${data.txId}`;
            setPurchaseState({ stage: "pending", txId });
            try {
              await pollPurchase(event.id, txId, network);
              setPurchaseState({ stage: "success", txId });
              resolve();
            } catch (e) {
              setPurchaseState({ stage: "error", message: (e as Error).message });
              reject(e);
            }
          },
          onCancel: () => {
            setPurchaseState({ stage: "idle" });
            reject(new Error("Cancelled"));
          },
        });
      });
    } catch {
      // already surfaced via state
    }
  };

  if (loading) {
    return <div className="container-page text-slate-500">Loading event…</div>;
  }

  if (!event) {
    return (
      <div className="container-page">
        <div className="card p-10 text-center">
          <h2 className="font-semibold text-lg">Event not found</h2>
          <p className="text-slate-600 mt-1.5">We couldn&apos;t find that event.</p>
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
      <Link href="/events" className="text-sm text-slate-500 hover:text-slate-800">
        ← Back to events
      </Link>

      <div className="mt-4 card overflow-hidden">
        <div className="relative aspect-[4/3] sm:aspect-[21/9] bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="mt-6 sm:mt-8 grid lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-100">
              {event.category}
            </span>
            <h1 className="text-2xl xs:text-3xl sm:text-4xl font-semibold tracking-tight mt-3">
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
                🕒 {date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
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
                    ((event.ticketsTotal - event.ticketsLeft) / event.ticketsTotal) * 100
                  }%`,
                }}
              />
            </div>

            <button
              onClick={handleBuy}
              disabled={
                soldOut ||
                purchaseState.stage === "signing" ||
                purchaseState.stage === "pending"
              }
              className="btn-primary w-full mt-6 !py-3 text-base"
            >
              {soldOut
                ? "Sold out"
                : purchaseState.stage === "signing"
                ? "Waiting for wallet…"
                : purchaseState.stage === "pending"
                ? "Confirming on chain…"
                : purchaseState.stage === "success"
                ? "Ticket purchased ✓"
                : isAuthed
                ? "Buy Ticket"
                : isConnected
                ? "Sign in & Buy"
                : "Connect Wallet to Buy"}
            </button>

            {purchaseState.stage === "error" && (
              <div className="mt-3 text-sm text-red-600">{purchaseState.message}</div>
            )}
            {purchaseState.stage === "pending" && (
              <div className="mt-3 text-xs text-slate-500">
                tx {purchaseState.txId.slice(0, 10)}…
              </div>
            )}
            {purchaseState.stage === "success" && (
              <Link
                href="/my-tickets"
                className="mt-3 block text-center text-sm text-brand-700 hover:underline"
              >
                View your ticket →
              </Link>
            )}

            <div className="mt-5 pt-5 border-t border-slate-100 text-sm">
              <div className="text-xs text-slate-500">Organizer</div>
              <div className="font-mono text-slate-800 mt-0.5">
                {shortAddress(event.organizer)}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

async function pollPurchase(
  eventId: string,
  txId: string,
  network: "testnet" | "mainnet",
) {
  const start = Date.now();
  const timeoutMs = 5 * 60 * 1000;
  while (Date.now() - start < timeoutMs) {
    const res = await purchaseTicket({ eventId, txId, network });
    if (res?.ticket?.status === "Valid") return;
    await new Promise((r) => setTimeout(r, 8_000));
  }
  throw new Error("Confirmation timed out. Your ticket will appear once the tx confirms.");
}
