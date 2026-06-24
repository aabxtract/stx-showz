"use client";

import { useRef, useState } from "react";
import Image from "next/image";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }

      const { url } = await res.json();
      onChange(url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-colors ${
          dragOver
            ? "border-brand-400 bg-brand-50 dark:bg-brand-900/20"
            : "border-slate-300 dark:border-slate-600 hover:border-brand-300"
        } ${value ? "p-2" : "p-6 sm:p-8"}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleInputChange}
          className="sr-only"
        />

        {value ? (
          <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100">
            <Image
              src={value}
              alt="Event image"
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm font-medium">Click or drop to replace</span>
            </div>
          </div>
        ) : (
          <div className="text-center">
            {uploading ? (
              <div className="text-sm text-slate-500">Uploading…</div>
            ) : (
              <>
                <div className="text-3xl mb-2">📷</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-brand-600 font-medium">Click to upload</span> or drag and drop
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  JPEG, PNG, WebP, GIF (max 5MB)
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {error && <div className="text-xs text-red-600">{error}</div>}

      <div>
        <label className="label">Or enter image URL</label>
        <input
          className="input"
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
        />
      </div>
    </div>
  );
}
