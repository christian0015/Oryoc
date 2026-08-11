// components/listing-card.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { ListingWithDistance } from "@/lib/actions/listings";
import { toggleFavoriteListing } from "@/lib/actions/listings";
import { useAuthGatedAction } from "@/lib/hooks";
import { Badge } from "@/components/ui";
import {
  IconHeart,
  IconBed,
  IconBath,
  IconBalcony,
  IconPool,
  IconPin,
  IconPanorama360,
  IconBoost,
} from "@/components/icons";

const propertyTypeLabel: Record<string, string> = {
  apartment: "Appartement",
  studio: "Studio",
  villa: "Villa",
  shared_room: "Colocation",
};

export function ListingCard({
  listing,
  favorited = false,
}: {
  listing: ListingWithDistance;
  favorited?: boolean;
}) {
  const { run, loading } = useAuthGatedAction(toggleFavoriteListing);
  const cover = listing.photos[0];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="group overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface"
    >
      <Link href={`/listings/${listing.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-raised">
          {cover && (
            <Image
              src={cover}
              alt={listing.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          )}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {listing.isBoosted && (
              <Badge tone="brass" icon={<IconBoost size={12} />}>
                Mis en avant
              </Badge>
            )}
            {listing.panoramaScenes.length > 0 && (
              <Badge tone="zellige" icon={<IconPanorama360 size={12} />}>
                360
              </Badge>
            )}
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={(e) => {
              e.preventDefault();
              run(listing.id);
            }}
            aria-label="Ajouter aux favoris"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-ink/60 text-paper backdrop-blur-sm transition-colors hover:bg-ink/80"
          >
            <IconHeart size={17} filled={favorited} className={favorited ? "text-alert-bright" : ""} />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-lg italic leading-tight text-paper line-clamp-1">{listing.title}</h3>
          </div>
          <p className="mt-1 flex items-center gap-1 text-xs text-mist-dim">
            <IconPin size={12} />
            {listing.location.neighborhood ? `${listing.location.neighborhood}, ` : ""}
            {listing.location.city}
            {listing.distanceKm !== undefined && ` · ${listing.distanceKm.toFixed(1)} km`}
          </p>

          <div className="mt-3 flex items-center gap-3 text-xs text-mist">
            <span className="inline-flex items-center gap-1">
              <IconBed size={14} /> {listing.rooms}
            </span>
            <span className="inline-flex items-center gap-1">
              <IconBath size={14} /> {listing.bathrooms}
            </span>
            {listing.balconies > 0 && (
              <span className="inline-flex items-center gap-1">
                <IconBalcony size={14} /> {listing.balconies}
              </span>
            )}
            {listing.hasPool && <IconPool size={14} className="text-zellige-bright" />}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="font-display text-xl italic text-brass-bright">
              {listing.price.toLocaleString("fr-FR")} {listing.currency}
              <span className="text-xs text-mist-dim"> /mois</span>
            </p>
            <span className="text-xs text-mist-dim">{propertyTypeLabel[listing.propertyType]}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
