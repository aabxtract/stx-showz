"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import VerificationResult, { type VerifyState } from "@/components/VerificationResult";
import ConnectWalletButton from "@/components/ConnectWalletButton";
import { verifyTicket } from "@/lib/apiClient";
import { useWallet } from "@/components/WalletProvider";

export default function VerifyPage() {
  const { isAuthed } = useWallet();
  const [ticketId, setTicketId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    state: VerifyState;
    ticketId: string;
    eventTitle?: string;
    error?: string;
  } | null>(null);

  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const animFrameRef = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    setScanning(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    setResult(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Check for BarcodeDetector API
      if ("BarcodeDetector" in window) {
        const detector = new BarcodeDetector({ formats: ["qr_code"] });
        detectorRef.current = detector;
        setScanning(true);
        scanLoop(detector);
      } else {
        // No BarcodeDetector — just show camera, user must use manual input
        setScanning(true);
        setCameraError("QR scanning not supported in this browser. Use manual input below.");
      }
    } catch {
      setCameraError("Could not access camera. Check permissions.");
    }
  };

  const scanLoop = async (detector: BarcodeDetector) => {
    if (!videoRef.current || !scanning) return;
    try {
      const barcodes = await detector.detect(videoRef.current);
      if (barcodes.length > 0) {
        const value = barcodes[0].rawValue;
        // Extract ticket ID from URL or use raw value
        const match = value.match(/\/events\/[^/]+\/verify\?.*ticketId=([^&]+)/) || [null, value];
        const id = match[1] ?? value;
        setTicketId(id);
        stopCamera();
        // Auto-verify
        handleVerifyById(id);
        return;
      }
    } catch {
      // Ignore detection errors
    }
    animFrameRef.current = requestAnimationFrame(() => scanLoop(detector));
  };

  const handleVerifyById = async (id: string) => {
    setSubmitting(true);
    try {
      const res = await verifyTicket(id);
      if (res.ok) {
        const ticket = (res as { ticket?: { eventTitle?: string } }).ticket;
        setResult({ state: "valid", ticketId: id, eventTitle: ticket?.eventTitle });
      } else if (res.error?.toLowerCase().includes("already used")) {
        setResult({ state: "used", ticketId: id });
      } else {
        setResult({ state: "invalid", ticketId: id, error: res.error });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId.trim()) return;
    handleVerifyById(ticketId.trim());
  };

  if (!isAuthed) {
    return (
      <div className="container-page max-w-2xl">
        <PageHeader title="Verify tickets" subtitle="Sign in as the event organizer to verify tickets." />
        <div className="mt-6 flex justify-center">
          <ConnectWalletButton className="btn-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container-page max-w-2xl">
      <PageHeader
        title="Verify tickets"
        subtitle="Scan a QR code or enter the Ticket ID to validate."
      />

      {/* Camera scanner */}
      <div className="card p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">QR Scanner</h3>
          {scanning ? (
            <button onClick={stopCamera} className="btn-secondary !py-1.5 !px-3 text-xs">
              Stop
            </button>
          ) : (
            <button onClick={startCamera} className="btn-primary !py-1.5 !px-3 text-xs">
              Open Camera
            </button>
          )}
        </div>

        <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          {!scanning && (
            <div className="absolute inset-0 grid place-items-center text-slate-500 text-sm">
              Camera off
            </div>
          )}
          {scanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-white/60 rounded-lg" />
            </div>
          )}
        </div>

        {cameraError && <div className="text-xs text-amber-600 mt-2">{cameraError}</div>}
      </div>

      {/* Manual input */}
      <form onSubmit={handleVerify} className="card p-6 space-y-4">
        <div>
          <label className="label">Ticket ID</label>
          <input
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
            className="input font-mono"
            placeholder="e.g. clx9ab8s700001abc"
            required
          />
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={submitting || !ticketId.trim()}>
            {submitting ? "Verifying…" : "Verify Ticket"}
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-6">
          <VerificationResult
            state={result.state}
            ticketId={result.ticketId}
            eventId={result.eventTitle || result.error || ""}
          />
        </div>
      )}
    </div>
  );
}
