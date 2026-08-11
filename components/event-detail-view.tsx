// components/event-detail-view.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import type { EventDTO } from "@/types";
import type { PublicUserDTO } from "@/lib/actions/profiles";
import { toggleFavoriteEvent, reportEvent, cancelEvent } from "@/lib/actions/events";
import { useAuthGatedAction } from "@/lib/hooks";
import { ProfileCard } from "@/components/profile-card";
import { Badge, Button, Modal, Textarea } from "@/components/ui";
import { IconCalendar, IconPin, IconHeart, IconReport, IconFlag } from "@/components/icons";

const MapView = dynamic(() => import("@/components/map-view").then((m) => m.MapView), { ssr: false });

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const categoryLabel: Record<string, string> = {
  social: "Social",
  culture: "Culture",
  sport: "Sport",
  networking: "Networking",
  music: "Musique",
  other: "Autre",
};

export function EventDetailView({
  event,
  isOrganizer,
  initialFavorited,
}: {
  event: EventDTO & { organizer: PublicUserDTO };
  isOrganizer: boolean;
  initialFavorited: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [favorited, setFavorited] = useState(initialFavorited);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const [cancelled, setCancelled] = useState(event.status === "cancelled");

  const favoriteAction = useAuthGatedAction(toggleFavoriteEvent);
  const reportAction = useAuthGatedAction(reportEvent);
  const cancelAction = useAuthGatedAction(cancelEvent);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".reveal-section").forEach((el) => {
        gsap.from(el, { opacity: 0, y: 32, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } });
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const date = new Date(event.dateTime);

  async function handleFavorite() {
    const res = await favoriteAction.run(event.id);
    if (res) setFavorited(res.favorited);
  }
  async function handleReport() {
    const res = await reportAction.run(event.id, reportReason);
    if (res) {
      setReportSent(true);
      setTimeout(() => setReportOpen(false), 1200);
    }
  }
  async function handleCancel() {
    const res = await cancelAction.run(event.id);
    if (res) setCancelled(true);
  }

  return (
    <div ref={rootRef} className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="relative aspect-[16/9] overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
          {event.photos[0] ? (
            <Image src={event.photos[0]} alt={event.title} fill className="object-cover" priority />
          ) : (
            <div className="flex h-full items-center justify-center text-mist-dim">
              <IconFlag size={40} />
            </div>
          )}
        </div>
      </motion.div>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex gap-2">
            <Badge tone="zellige">{categoryLabel[event.category]}</Badge>
            {event.isFree && <Badge tone="brass">Gratuit</Badge>}
            {cancelled && <Badge tone="alert">Annule</Badge>}
          </div>
          <h1 className="font-display text-3xl italic text-paper sm:text-4xl">{event.title}</h1>
        </div>
        <button
          type="button"
          onClick={handleFavorite}
          disabled={favoriteAction.loading}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-paper hover:border-alert"
          aria-label="Favoris"
        >
          <IconHeart size={18} filled={favorited} className={favorited ? "text-alert-bright" : ""} />
        </button>
      </div>

      <div className="reveal-section mt-6 flex flex-col gap-2 text-sm text-mist">
        <span className="inline-flex items-center gap-2">
          <IconCalendar size={15} className="text-brass" />
          {date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} a{" "}
          {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </span>
        <span className="inline-flex items-center gap-2">
          <IconPin size={15} className="text-brass" />
          {event.location.address}
        </span>
        {!event.isFree && event.price !== undefined && (
          <span className="font-display text-xl italic text-brass-bright">{event.price.toLocaleString("fr-FR")} MAD</span>
        )}
      </div>

      {isOrganizer && !cancelled && (
        <div className="reveal-section mt-4 flex items-center gap-3 rounded-[var(--radius-control)] border border-brass-dim/50 bg-[rgba(201,161,90,0.06)] p-4">
          <p className="text-sm text-paper">
            {event.status === "pending_moderation" ? "En attente de moderation." : "C'est ton evenement."}
          </p>
          <Button size="sm" variant="danger" loading={cancelAction.loading} onClick={handleCancel} className="ml-auto">
            Annuler l&apos;evenement
          </Button>
        </div>
      )}

      <div className="divider-zellige my-10" />

      <section className="reveal-section">
        <h2 className="mb-3 font-display text-xl italic text-paper">A propos</h2>
        <p className="whitespace-pre-line leading-relaxed text-mist">{event.description}</p>
        {event.contactLink && (
          <a href={event.contactLink} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm text-brass hover:text-brass-bright">
            Lien de contact / billeterie →
          </a>
        )}
      </section>

      <section className="reveal-section mt-10">
        <h2 className="mb-3 font-display text-xl italic text-paper">Lieu</h2>
        <MapView markers={[{ id: event.id, lat: event.location.lat, lng: event.location.lng, title: event.title }]} height={280} />
      </section>

      <section className="reveal-section mt-10">
        <h2 className="mb-3 font-display text-xl italic text-paper">Organise par</h2>
        <ProfileCard user={event.organizer} href={`/profile/${event.organizer.id}`} />
      </section>

      <div className="reveal-section mt-10 flex justify-center">
        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs text-mist-dim hover:text-alert-bright"
        >
          <IconReport size={13} />
          Signaler cet evenement
        </button>
      </div>

      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Signaler l'evenement">
        {reportSent ? (
          <p className="text-sm text-zellige-bright">Merci, notre equipe va examiner ce signalement.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <Textarea label="Que se passe-t-il ?" value={reportReason} onChange={(e) => setReportReason(e.target.value)} />
            <Button onClick={handleReport} loading={reportAction.loading} disabled={!reportReason.trim()}>
              Envoyer le signalement
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
