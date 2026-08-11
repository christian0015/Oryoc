// components/listing-gallery.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import type { PanoramaScene } from "@/types";
import { IconChevronRight, IconClose, IconPanorama360 } from "@/components/icons";

const PanoramaViewer = dynamic(() => import("@/components/panorama-viewer").then((m) => m.PanoramaViewer), {
  ssr: false,
});

export function ListingGallery({
  photos,
  videoClips,
  panoramaScenes,
  title,
}: {
  photos: string[];
  videoClips: string[];
  panoramaScenes: PanoramaScene[];
  title: string;
}) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  const media = [...photos.map((url) => ({ type: "image" as const, url })), ...videoClips.map((url) => ({ type: "video" as const, url }))];
  const current = media[index];

  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
        <AnimatePresence mode="wait">
          {current?.type === "image" ? (
            <motion.div
              key={current.url}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0"
            >
              <Image src={current.url} alt={title} fill className="cursor-zoom-in object-cover" onClick={() => setLightbox(true)} priority />
            </motion.div>
          ) : current ? (
            <motion.video
              key={current.url}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              src={current.url}
              controls
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : null}
        </AnimatePresence>

        {panoramaScenes.length > 0 && (
          <button
            type="button"
            onClick={() => setTourOpen(true)}
            className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-brass px-4 py-2 text-sm font-medium text-ink shadow-lg"
          >
            <IconPanorama360 size={16} />
            Visite 360
          </button>
        )}

        {media.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIndex((i) => (i - 1 + media.length) % media.length)}
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 rotate-180 items-center justify-center rounded-full bg-ink/60 text-paper backdrop-blur-sm"
              aria-label="Precedent"
            >
              <IconChevronRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % media.length)}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-ink/60 text-paper backdrop-blur-sm"
              aria-label="Suivant"
            >
              <IconChevronRight size={16} />
            </button>
          </>
        )}
      </div>

      {media.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {media.map((m, i) => (
            <button
              key={m.url}
              onClick={() => setIndex(i)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-[var(--radius-control)] border ${
                i === index ? "border-brass" : "border-line"
              }`}
            >
              {m.type === "image" ? (
                <Image src={m.url} alt="" fill className="object-cover" />
              ) : (
                <video src={m.url} className="h-full w-full object-cover" muted />
              )}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {lightbox && current?.type === "image" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 p-6"
            onClick={() => setLightbox(false)}
          >
            <button
              onClick={() => setLightbox(false)}
              className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-ink/70 text-paper"
              aria-label="Fermer"
            >
              <IconClose size={18} />
            </button>
            <div className="relative h-full w-full max-w-5xl">
              <Image src={current.url} alt={title} fill className="object-contain" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {tourOpen && <PanoramaViewer scenes={panoramaScenes} onClose={() => setTourOpen(false)} />}
    </div>
  );
}
