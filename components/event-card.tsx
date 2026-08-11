// components/event-card.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { EventWithDistance } from "@/lib/actions/events";
import { toggleFavoriteEvent } from "@/lib/actions/events";
import { useAuthGatedAction } from "@/lib/hooks";
import { Badge } from "@/components/ui";
import { IconHeart, IconCalendar, IconPin, IconFlag } from "@/components/icons";

const categoryLabel: Record<string, string> = {
  social: "Social",
  culture: "Culture",
  sport: "Sport",
  networking: "Networking",
  music: "Musique",
  other: "Autre",
};

export function EventCard({ event, favorited = false }: { event: EventWithDistance; favorited?: boolean }) {
  const { run, loading } = useAuthGatedAction(toggleFavoriteEvent);
  const date = new Date(event.dateTime);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="group overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface"
    >
      <Link href={`/events/${event.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-raised">
          {event.photos[0] ? (
            <Image
              src={event.photos[0]}
              alt={event.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-mist-dim">
              <IconFlag size={28} />
            </div>
          )}
          <div className="absolute left-3 top-3 flex gap-1.5">
            <Badge tone="zellige">{categoryLabel[event.category]}</Badge>
            {event.isFree && <Badge tone="brass">Gratuit</Badge>}
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={(e) => {
              e.preventDefault();
              run(event.id);
            }}
            aria-label="Ajouter aux favoris"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-ink/60 text-paper backdrop-blur-sm hover:bg-ink/80"
          >
            <IconHeart size={17} filled={favorited} className={favorited ? "text-alert-bright" : ""} />
          </button>
        </div>

        <div className="p-4">
          <h3 className="font-display text-lg italic leading-tight text-paper line-clamp-1">{event.title}</h3>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-mist">
            <IconCalendar size={13} />
            {date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} ·{" "}
            {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-mist-dim">
            <IconPin size={13} />
            {event.location.address}
            {event.distanceKm !== undefined && ` · ${event.distanceKm.toFixed(1)} km`}
          </p>
          {!event.isFree && event.price !== undefined && (
            <p className="mt-2 font-display text-lg italic text-brass-bright">
              {event.price.toLocaleString("fr-FR")} MAD
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
