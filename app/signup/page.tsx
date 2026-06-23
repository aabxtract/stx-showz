"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet, shortAddress } from "@/components/WalletProvider";

export default function SignupPage() {
  const { isConnected, address, connect, isAuthed, signInWithServer } = useWallet();
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthed) {
      const t = setTimeout(() => router.push("/profile"), 600);
      return () => clearTimeout(t);
    }
  }, [isAuthed, router]);

  useEffect(() => {
    if (isConnected && agreed && !isAuthed && !signing) {
      setSigning(true);
      setError(null);
      signInWithServer()
        .catch((e: Error) => setError(e.message))
        .finally(() => setSigning(false));
    }
  }, [isConnected, agreed, isAuthed, signing, signInWithServer]);

  return (
    <section className="container-page !py-12 sm:!py-20">
      <div className="max-w-md mx-auto card p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Create your account
          </h1>
          <p className="text-slate-600 text-sm mt-2">
            Connect a Stacks wallet to get started. Your wallet is your account.
          </p>
        </div>

        <label className="flex items-start gap-2 text-sm text-slate-600 mb-5">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            I agree to the Veritix terms of service and acknowledge that my
            wallet address will be used as my account identifier.
          </span>
        </label>

        {isAuthed ? (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 p-4 text-center">
            <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              Account ready
            </div>
            <div className="font-mono text-sm text-emerald-900 dark:text-emerald-100 mt-1">
              {shortAddress(address)}
            </div>
            <div className="text-xs text-emerald-700 dark:text-emerald-300 mt-2">Redirecting…</div>
          </div>
        ) : isConnected ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
            <div className="text-xs text-slate-700 font-medium">
              {signing ? "Waiting for signature…" : "Wallet connected"}
            </div>
            <div className="font-mono text-sm text-slate-900 mt-1">
              {shortAddress(address)}
            </div>
            {error && <div className="text-xs text-red-600 mt-2">{error}</div>}
          </div>
        ) : (
          <button
            type="button"
            onClick={connect}
            disabled={!agreed}
            className="btn-primary w-full !py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Connect Wallet to Sign Up
          </button>
        )}

        <div className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-brand-700 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 font-medium"
          >
            Log in
          </Link>
        </div>

        <div className="mt-6 text-xs text-slate-500 text-center">
          Need a wallet? Install{" "}
          <a
            href="https://leather.io"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-slate-700"
          >
            Leather
          </a>{" "}
          or{" "}
          <a
            href="https://www.xverse.app"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-slate-700"
          >
            Xverse
          </a>
          .
        </div>
      </div>
    </section>
  );
}
