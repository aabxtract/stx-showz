"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet, shortAddress } from "@/components/WalletProvider";

export default function LoginPage() {
  const { isConnected, address, connect, isAuthed, signInWithServer } = useWallet();
  const router = useRouter();
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthed) {
      const t = setTimeout(() => router.push("/profile"), 600);
      return () => clearTimeout(t);
    }
  }, [isAuthed, router]);

  useEffect(() => {
    if (isConnected && !isAuthed && !signing) {
      setSigning(true);
      setError(null);
      signInWithServer()
        .catch((e: Error) => setError(e.message))
        .finally(() => setSigning(false));
    }
  }, [isConnected, isAuthed, signing, signInWithServer]);

  return (
    <section className="container-page !py-12 sm:!py-20">
      <div className="max-w-md mx-auto card p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-slate-600 text-sm mt-2">
            Sign in to Veritix by connecting your Stacks wallet.
          </p>
        </div>

        {isAuthed ? (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 p-4 text-center">
            <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Signed in</div>
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
            {error && (
              <div className="text-xs text-red-600 mt-2">{error}</div>
            )}
            {!signing && error && (
              <button
                className="btn-primary mt-3"
                onClick={() => {
                  setError(null);
                  setSigning(true);
                  signInWithServer()
                    .catch((e: Error) => setError(e.message))
                    .finally(() => setSigning(false));
                }}
              >
                Retry sign-in
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={connect}
            className="btn-primary w-full"
          >
            Connect Wallet to Login
          </button>
        )}

        <div className="mt-6 text-center text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-brand-700 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 font-medium"
          >
            Sign up
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
