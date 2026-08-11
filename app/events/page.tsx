// app/events/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { motion } from "framer-motion";
import { searchEvents, getMyFavoriteEventIds, type EventWithDistance, type EventSearchFilters } from "@/lib/actions/events";
import { EventCard } from "@/components/event-card";
import { EmptyState, Skeleton, Button, Toggle } from "@/components/ui";
import { IconPlus, IconCalendar } from "@/components/icons";

const categories: { value: string; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "social", label: "Social" },
  { value: "culture", label: "Culture" },
  { value: "sport", label: "Sport" },
  { value: "networking", label: "Networking" },
  { value: "music", label: "Musique" },
  { value: "other", label: "Autre" },
];

export default function EventsPage() {
  const headerRef = useRef<HTMLDivElement>(null);
  const [category, setCategory] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);
  const [events, setEvents] = useState<EventWithDistance[] | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".gsap-header-word", {
        yPercent: 110,
        duration: 0.9,
        ease: "power4.out",
        stagger: 0.06,
      });
    }, headerRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    getMyFavoriteEventIds().then((res) => res.ok && setFavoriteIds(res.data));
  }, []);

  useEffect(() => {
    const filters: EventSearchFilters = {
      category: (category || undefined) as EventSearchFilters["category"],
      freeOnly: freeOnly || undefined,
    };
    searchEvents(filters).then((res) => res.ok && setEvents(res.data));
  }, [category, freeOnly]);

  const headline = "Ce qui se passe pres de toi";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div ref={headerRef} className="overflow-hidden">
          <h1 className="font-display text-4xl italic leading-tight text-paper sm:text-5xl">
            {headline.split(" ").map((word, i) => (
              <span key={i} className="mr-3 inline-block overflow-hidden">
                <span className="gsap-header-word inline-block">{word}</span>
              </span>
            ))}
          </h1>
          <p className="mt-3 max-w-md text-sm text-mist-dim">
            Des evenements organises par la communaute ORYOC — chaque annonce est validee avant publication.
          </p>
        </div>
        <Link href="/events/new">
          <Button icon={<IconPlus size={16} />}>Creer un evenement</Button>
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {categories.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              category === c.value
                ? "border-brass bg-brass text-ink"
                : "border-line bg-surface text-mist hover:text-paper"
            }`}
          >
            {c.label}
          </button>
        ))}
        <div className="ml-auto">
          <Toggle label="Gratuit uniquement" checked={freeOnly} onChange={setFreeOnly} />
        </div>
      </div>

      <div className="mt-8">
        {events === null ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] w-full" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={<IconCalendar size={30} />}
            title="Aucun evenement a venir"
            description="Reviens bientot, ou sois le premier a en organiser un."
          />
        ) : (
          <motion.div layout className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <EventCard key={e.id} event={e} favorited={favoriteIds.includes(e.id)} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
