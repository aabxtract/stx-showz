"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet, shortAddress } from "@/components/WalletProvider";

export default function LoginPage() {
  const { isConnected, address, connect } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) {
      const t = setTimeout(() => router.push("/profile"), 800);
      return () => clearTimeout(t);
    }
  }, [isConnected, router]);

  return (
    <section className="container-page !py-20">
      <div className="max-w-md mx-auto card p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-slate-600 text-sm mt-2">
            Sign in to Veritix by connecting your Stacks wallet.
          </p>
        </div>

        {isConnected ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
            <div className="text-xs text-emerald-700 font-medium">
              Connected
            </div>
            <div className="font-mono text-sm text-emerald-900 mt-1">
              {shortAddress(address)}
            </div>
            <div className="text-xs text-emerald-700 mt-2">
              Redirecting to your profile…
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={connect}
            className="btn-primary w-full !py-3"
          >
            Connect Wallet to Login
          </button>
        )}

        <div className="mt-6 text-center text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-brand-700 hover:text-brand-800 font-medium"
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
