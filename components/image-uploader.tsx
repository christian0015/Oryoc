// components/image-uploader.tsx
"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { CloudinaryFolder } from "@/lib/cloudinary-folders";
import { IconCamera, IconClose } from "@/components/icons";

interface UploadSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

async function getSignature(folder: CloudinaryFolder): Promise<UploadSignature> {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.message ?? "Signature d'upload refusee");
  return json.data as UploadSignature;
}

async function uploadToCloudinary(file: File, sig: UploadSignature, resourceType: "image" | "video") {
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/${resourceType}/upload`, {
    method: "POST",
    body: form,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? "Echec de l'upload");
  return json.secure_url as string;
}

async function deletePrevious(url: string) {
  await fetch("/api/upload/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  }).catch(() => null);
}

/** Single-image uploader — e.g. avatar. */
export function SingleImageUploader({
  folder,
  value,
  onChange,
  size = 96,
  label,
}: {
  folder: CloudinaryFolder;
  value?: string;
  onChange: (url: string | undefined) => void;
  size?: number;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(file: File) {
    setLoading(true);
    try {
      const previous = value;
      const sig = await getSignature(folder);
      const url = await uploadToCloudinary(file, sig, "image");
      if (previous) await deletePrevious(previous);
      onChange(url);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {label && <span className="mb-1.5 block text-sm font-medium text-mist">{label}</span>}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        style={{ width: size, height: size }}
        className="relative flex items-center justify-center overflow-hidden rounded-full border border-line bg-surface-raised text-mist hover:border-brass-dim"
      >
        {value ? (
          <Image src={value} alt="" width={size} height={size} className="h-full w-full object-cover" />
        ) : (
          <IconCamera size={22} />
        )}
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center bg-ink/60">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-brass border-t-transparent" />
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/** Multi-image gallery uploader — listing photos, event photos, certification docs. */
export function GalleryUploader({
  folder,
  values,
  onChange,
  max = 15,
  resourceType = "image",
  label,
}: {
  folder: CloudinaryFolder;
  values: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  resourceType?: "image" | "video";
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleFiles(files: FileList) {
    setLoading(true);
    try {
      const remaining = max - values.length;
      const toUpload = Array.from(files).slice(0, Math.max(0, remaining));
      const uploaded: string[] = [];
      for (const file of toUpload) {
        const sig = await getSignature(folder);
        const url = await uploadToCloudinary(file, sig, resourceType);
        uploaded.push(url);
      }
      onChange([...values, ...uploaded]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(url: string) {
    onChange(values.filter((v) => v !== url));
    await deletePrevious(url);
  }

  return (
    <div>
      {label && <span className="mb-1.5 block text-sm font-medium text-mist">{label}</span>}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {values.map((url) => (
          <motion.div
            key={url}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative aspect-square overflow-hidden rounded-[var(--radius-control)] border border-line bg-surface-raised"
          >
            {resourceType === "video" ? (
              <video src={url} className="h-full w-full object-cover" muted />
            ) : (
              <Image src={url} alt="" fill className="object-cover" />
            )}
            <button
              type="button"
              onClick={() => handleRemove(url)}
              aria-label="Supprimer"
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink/80 text-paper opacity-0 transition-opacity group-hover:opacity-100"
            >
              <IconClose size={13} />
            </button>
          </motion.div>
        ))}

        {values.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-[var(--radius-control)] border border-dashed border-line text-mist hover:border-brass-dim hover:text-paper"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-brass border-t-transparent" />
            ) : (
              <>
                <IconCamera size={20} />
                <span className="text-xs">Ajouter</span>
              </>
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={resourceType === "video" ? "video/*" : "image/*"}
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
