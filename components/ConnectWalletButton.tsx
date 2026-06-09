"use client";

import { useEffect, useRef, useState } from "react";
import { shortAddress, useWallet } from "./WalletProvider";

export default function ConnectWalletButton({
  className = "btn-primary",
}: {
  className?: string;
}) {
  const { isConnected, address, connect, disconnect, network, setNetwork } =
    useWallet();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (!isConnected) {
    return (
      <button type="button" onClick={connect} className={className}>
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-secondary !py-2 !px-3 gap-2"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="font-mono text-xs">{shortAddress(address)}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 card p-2 z-50">
          <div className="px-3 py-2">
            <div className="text-xs text-slate-500">Connected wallet</div>
            <div className="font-mono text-xs break-all text-slate-800 mt-0.5">
              {address}
            </div>
          </div>
          <div className="px-3 py-2 border-t border-slate-100">
            <div className="text-xs text-slate-500 mb-1.5">Network</div>
            <div className="flex gap-1">
              {(["testnet", "mainnet"] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => setNetwork(n)}
                  className={`flex-1 px-2 py-1.5 rounded-lg text-xs capitalize border ${
                    network === n
                      ? "bg-brand-50 border-brand-200 text-brand-700"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => {
              disconnect();
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 mt-1 rounded-lg text-sm text-rose-600 hover:bg-rose-50 border-t border-slate-100"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
