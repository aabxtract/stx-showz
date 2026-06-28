"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="container-page max-w-lg py-20 text-center">
      <div className="text-5xl mb-4">💥</div>
      <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
      <p className="text-slate-600 mb-6">
        An unexpected error occurred. Please try again.
      </p>
      {error.digest && (
        <p className="text-xs text-slate-400 mb-4 font-mono">Error ID: {error.digest}</p>
      )}
      <button onClick={reset} className="btn-primary">
        Try again
      </button>
    </div>
  );
}
