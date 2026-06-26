"use client";

import { useEffect, useState } from "react";
import QRCodeLib from "qrcode";

export default function QRCode({ value }: { value: string }) {
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    QRCodeLib.toString(value, {
      type: "svg",
      width: 200,
      margin: 2,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    }).then(setSvg);
  }, [value]);

  if (!svg) {
    return (
      <div className="inline-block bg-white dark:bg-[var(--card-bg)] p-4 rounded-2xl border border-slate-200 shadow-soft">
        <div className="w-[200px] h-[200px] animate-pulse bg-slate-100 rounded-xl" />
        <div className="text-center text-[10px] font-mono text-slate-500 mt-3 tracking-wide">
          {value}
        </div>
      </div>
    );
  }

  return (
    <div className="inline-block bg-white dark:bg-[var(--card-bg)] p-4 rounded-2xl border border-slate-200 shadow-soft">
      <div
        className="w-[200px] h-[200px]"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div className="text-center text-[10px] font-mono text-slate-500 mt-3 tracking-wide">
        {value}
      </div>
    </div>
  );
}
