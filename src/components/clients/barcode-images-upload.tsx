"use client";

import { useState } from "react";
import { Loader2, ScanLine, Upload, X } from "lucide-react";
import { uploadImage } from "@/lib/cloudinary";

interface BarcodeImagesUploadProps {
  inputId: string;
  images: string[];
  onAppend: (urls: string[]) => void;
  onRemove: (index: number) => void;
  onSetPrimary: (index: number) => void;
  onUploadingChange: (uploading: boolean) => void;
  onView?: (url: string) => void;
}

export function BarcodeImagesUpload({
  inputId, images, onAppend, onRemove, onSetPrimary, onUploadingChange, onView,
}: BarcodeImagesUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = async (files: FileList | null) => {
    const selected = Array.from(files ?? []);
    if (selected.length === 0) return;
    if (selected.some((file) => !file.type.startsWith("image/"))) {
      setError("Please select image files only.");
      return;
    }

    setUploading(true);
    onUploadingChange(true);
    setError("");
    try {
      const results = await Promise.allSettled(selected.map((file) => uploadImage(file)));
      const uploaded = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
      if (uploaded.length) onAppend(uploaded);
      const failed = results.filter((result) => result.status === "rejected");
      if (failed.length) {
        const reason = failed[0] as PromiseRejectedResult;
        const detail = reason.reason instanceof Error ? reason.reason.message : "Upload failed";
        setError(`${failed.length} image${failed.length === 1 ? "" : "s"} could not be uploaded: ${detail}`);
      }
    } finally {
      setUploading(false);
      onUploadingChange(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-border/40 bg-muted/10 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <ScanLine className="h-4 w-4 text-muted-foreground" /> Barcode Images
      </div>
      <p className="text-xs text-muted-foreground">Upload one or more images. The first is the primary barcode used on order documents.</p>
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((url, index) => (
            <div key={`${url}-${index}`} className="rounded-lg border border-border/40 bg-background p-2">
              <button type="button" onClick={() => onView?.(url)} disabled={!onView} aria-label={`View barcode image ${index + 1}`} className="flex h-28 w-full items-center justify-center overflow-hidden rounded-md bg-muted/20 disabled:cursor-default">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Barcode ${index + 1}`} className="max-h-full max-w-full object-contain" />
              </button>
              <div className="mt-2 flex items-center justify-between gap-1 text-[11px]">
                {index === 0 ? <span className="font-semibold text-primary">Primary</span> : <button type="button" onClick={() => onSetPrimary(index)} className="text-primary hover:underline">Make primary</button>}
                <button type="button" onClick={() => onRemove(index)} aria-label={`Remove barcode image ${index + 1}`} className="inline-flex items-center gap-0.5 text-destructive hover:underline"><X className="h-3 w-3" /> Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <label htmlFor={inputId} className={`flex min-h-20 w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border/40 bg-background/30 text-xs font-medium text-muted-foreground transition-colors ${uploading ? "cursor-wait opacity-60" : "cursor-pointer hover:border-primary/40 hover:bg-accent/20"}`}>
        {uploading ? <><Loader2 className="h-5 w-5 animate-spin text-primary" /> Uploading to image hosting…</> : <><Upload className="h-5 w-5" /> Add barcode images</>}
      </label>
      <input id={inputId} type="file" accept="image/*" multiple disabled={uploading} className="sr-only" onChange={(event) => { const files = event.currentTarget.files; void handleFiles(files); event.currentTarget.value = ""; }} />
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
