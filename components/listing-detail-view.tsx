// components/listing-detail-view.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import type { ListingDTO } from "@/types";
import type { PublicUserDTO } from "@/lib/actions/profiles";
import { revealContact } from "@/lib/actions/profiles";
import { toggleFavoriteListing, confirmListingStillAvailable, reportListing } from "@/lib/actions/listings";
import { useAuthGatedAction } from "@/lib/hooks";
import { ListingGallery } from "@/components/listing-gallery";
import { MapView } from "@/components/map-view";
import { ProfileCard } from "@/components/profile-card";
import { ReviewsSection } from "@/components/review-form";
import { Badge, Button, Modal, Textarea } from "@/components/ui";
import {
  IconBed,
  IconBath,
  IconBalcony,
  IconPool,
  IconPin,
  IconHeart,
  IconCheck,
  IconReport,
  IconEdit,
  IconMail,
  IconPhone,
} from "@/components/icons";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const propertyTypeLabel: Record<string, string> = {
  apartment: "Appartement",
  studio: "Studio",
  villa: "Villa",
  shared_room: "Colocation",
};

export function ListingDetailView({
  listing,
  isOwner,
  initialFavorited,
}: {
  listing: ListingDTO & { owner: PublicUserDTO };
  isOwner: boolean;
  initialFavorited: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [favorited, setFavorited] = useState(initialFavorited);
  const [contact, setContact] = useState<{ email: string; phone?: string } | null>(null);
  const [confirmedNow, setConfirmedNow] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSent, setReportSent] = useState(false);

  const favoriteAction = useAuthGatedAction(toggleFavoriteListing);
  const contactAction = useAuthGatedAction(revealContact);
  const confirmAction = useAuthGatedAction(confirmListingStillAvailable);
  const reportAction = useAuthGatedAction(reportListing);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".reveal-section").forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 36,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%" },
        });
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  async function handleFavorite() {
    const result = await favoriteAction.run(listing.id);
    if (result) setFavorited(result.favorited);
  }

  async function handleReveal() {
    const result = await contactAction.run(listing.owner.id);
    if (result) setContact(result);
  }

  async function handleConfirm() {
    const result = await confirmAction.run(listing.id);
    if (result) setConfirmedNow(true);
  }

  async function handleReport() {
    const result = await reportAction.run(listing.id, reportReason);
    if (result) {
      setReportSent(true);
      setTimeout(() => setReportOpen(false), 1200);
    }
  }

  return (
    <div ref={rootRef} className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <ListingGallery
          photos={listing.photos}
          videoClips={listing.videoClips}
          panoramaScenes={listing.panoramaScenes}
          title={listing.title}
        />
      </motion.div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge tone="neutral">{propertyTypeLabel[listing.propertyType]}</Badge>
            {listing.hasPool && (
              <Badge tone="zellige" icon={<IconPool size={12} />}>
                Piscine
              </Badge>
            )}
          </div>
          <h1 className="font-display text-3xl italic text-paper sm:text-4xl">{listing.title}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-mist">
            <IconPin size={14} />
            {listing.location.neighborhood ? `${listing.location.neighborhood}, ` : ""}
            {listing.location.city}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleFavorite}
            disabled={favoriteAction.loading}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-paper hover:border-alert"
            aria-label="Favoris"
          >
            <IconHeart size={18} filled={favorited} className={favorited ? "text-alert-bright" : ""} />
          </button>
          <p className="font-display text-3xl italic text-brass-bright">
            {listing.price.toLocaleString("fr-FR")}
            <span className="text-sm text-mist-dim"> {listing.currency}/mois</span>
          </p>
        </div>
      </div>

      {isOwner && (
        <div className="reveal-section mt-4 flex flex-wrap items-center gap-3 rounded-[var(--radius-control)] border border-brass-dim/50 bg-[rgba(201,161,90,0.06)] p-4">
          <p className="text-sm text-paper">C&apos;est ton annonce.</p>
          <Button size="sm" variant="secondary" icon={<IconEdit size={14} />} onClick={() => (window.location.href = `/listings/manage/${listing.id}`)}>
            Modifier
          </Button>
          <Button size="sm" icon={<IconCheck size={14} />} loading={confirmAction.loading} onClick={handleConfirm}>
            {confirmedNow ? "Confirme !" : "Toujours disponible"}
          </Button>
        </div>
      )}

      <div className="divider-zellige my-10" />

      <section className="reveal-section grid grid-cols-2 gap-4 sm:grid-cols-4">
        <FeatureStat icon={<IconBed size={20} />} label="Pieces" value={listing.rooms} />
        <FeatureStat icon={<IconBath size={20} />} label="Salles de bain" value={listing.bathrooms} />
        <FeatureStat icon={<IconBalcony size={20} />} label="Balcons" value={listing.balconies} />
        <FeatureStat icon={<IconPool size={20} />} label="Piscine" value={listing.hasPool ? "Oui" : "Non"} />
      </section>

      <section className="reveal-section mt-12">
        <h2 className="mb-3 font-display text-xl italic text-paper">Description</h2>
        <p className="whitespace-pre-line leading-relaxed text-mist">{listing.description}</p>
      </section>

      <section className="reveal-section mt-12">
        <h2 className="mb-3 font-display text-xl italic text-paper">Emplacement</h2>
        <MapView
          markers={[{ id: listing.id, lat: listing.location.lat, lng: listing.location.lng, title: listing.title }]}
          height={320}
        />
      </section>

      <section className="reveal-section mt-12">
        <h2 className="mb-3 font-display text-xl italic text-paper">Propose par</h2>
        <ProfileCard user={listing.owner} href={`/profile/${listing.owner.id}`} />
        <div className="mt-4">
          {contact ? (
            <div className="flex flex-col gap-2 rounded-[var(--radius-control)] border border-line bg-surface-raised p-4 text-sm">
              <span className="inline-flex items-center gap-2 text-paper">
                <IconMail size={15} className="text-brass" /> {contact.email}
              </span>
              {contact.phone && (
                <span className="inline-flex items-center gap-2 text-paper">
                  <IconPhone size={15} className="text-brass" /> {contact.phone}
                </span>
              )}
            </div>
          ) : (
            <Button loading={contactAction.loading} onClick={handleReveal} icon={<IconMail size={16} />}>
              Voir les coordonnees
            </Button>
          )}
        </div>
      </section>

      <div className="divider-zellige my-10" />

      <section className="reveal-section">
        <ReviewsSection targetType="listing" targetId={listing.id} />
      </section>

      <div className="reveal-section mt-10 flex justify-center">
        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs text-mist-dim hover:text-alert-bright"
        >
          <IconReport size={13} />
          Signaler cette annonce
        </button>
      </div>

      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Signaler l'annonce">
        {reportSent ? (
          <p className="text-sm text-zellige-bright">Merci, notre equipe va examiner ce signalement.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <Textarea
              label="Que se passe-t-il ?"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Annonce frauduleuse, photos trompeuses, logement indisponible..."
            />
            <Button onClick={handleReport} loading={reportAction.loading} disabled={!reportReason.trim()}>
              Envoyer le signalement
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function FeatureStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[var(--radius-card)] border border-line bg-surface py-5 text-center">
      <span className="text-brass">{icon}</span>
      <span className="font-display text-lg italic text-paper">{value}</span>
      <span className="text-xs text-mist-dim">{label}</span>
    </div>
  );
}
