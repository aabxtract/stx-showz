"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import ConnectWalletButton from "@/components/ConnectWalletButton";
import { useWallet, shortAddress } from "@/components/WalletProvider";
import { fetchDisbursements, fetchVTXBalance } from "@/lib/apiClient";
import type { Disbursement } from "veritix-sdk";

export default function RewardsPage() {
  const { isConnected, address, isAuthed } = useWallet();
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthed || !address) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetchDisbursements().catch(() => []),
      fetchVTXBalance(address).catch(() => null),
    ])
      .then(([dis, bal]) => {
        setDisbursements(dis);
        setBalance(bal);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [isAuthed, address]);

  return (
    <div className="container-page max-w-4xl">
      <PageHeader
        title="VTX Token Rewards"
        subtitle="Your VTX token balance and disbursement history."
      />

      {!isConnected ? (
        <div className="card p-10 text-center">
          <h2 className="font-semibold text-lg mb-4">Connect your wallet</h2>
          <ConnectWalletButton />
        </div>
      ) : !isAuthed ? (
        <EmptyState
          icon="🔐"
          title="Not signed in"
          description="Sign in to view your rewards."
          action={
            <Link href="/login" className="btn-primary">
              Sign in
            </Link>
          }
        />
      ) : loading ? (
        <div className="text-slate-500 text-sm">Loading rewards…</div>
      ) : (
        <>
          <div className="card p-5 sm:p-6 mb-6">
            <div className="text-xs text-slate-500 mb-1">VTX Balance</div>
            <div className="text-3xl font-semibold">
              {balance !== null ? balance.toLocaleString() : "—"} <span className="text-base font-normal text-slate-500">VTX</span>
            </div>
            <div className="text-xs text-slate-400 mt-1 font-mono">{shortAddress(address ?? "")}</div>
          </div>

          {error && <div className="text-sm text-red-600 mb-4">{error}</div>}

          <div>
            <h2 className="font-semibold text-lg mb-4">Disbursement History</h2>
            {disbursements.length === 0 ? (
              <div className="card p-6 text-center text-slate-500 text-sm">
                No disbursements yet. Attend events and check in to earn VTX tokens.
              </div>
            ) : (
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-3 text-left font-medium">Event</th>
                        <th className="px-4 py-3 text-right font-medium">Amount</th>
                        <th className="px-4 py-3 text-left font-medium">Tx ID</th>
                        <th className="px-4 py-3 text-right font-medium">Status</th>
                        <th className="px-4 py-3 text-right font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {disbursements.map((d) => (
                        <tr key={d.id} className="border-b border-slate-100 last:border-0">
                          <td className="px-4 py-3 text-slate-800">
                            {d.eventId ? shortAddress(d.eventId) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-emerald-700">
                            +{d.amount.toLocaleString()} VTX
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-600 max-w-[140px] truncate">
                            {d.txId ? shortAddress(d.txId) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                                d.txStatus === "pending"
                                  ? "bg-amber-50 text-amber-700"
                                  : d.txStatus === "confirmed"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-red-50 text-red-700"
                              }`}
                            >
                              {d.txStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 whitespace-nowrap">
                            {new Date(d.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
