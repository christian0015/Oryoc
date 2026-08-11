// components/home-view.tsx
"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import type { ListingWithDistance } from "@/lib/actions/listings";
import type { EventWithDistance } from "@/lib/actions/events";
import { ListingCard } from "@/components/listing-card";
import { EventCard } from "@/components/event-card";
import { Button } from "@/components/ui";
import {
  IconCertified,
  IconReliability,
  IconPanorama360,
  IconLuggage,
  IconPlus,
  IconSearch,
} from "@/components/icons";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    Icon: IconCertified,
    title: "Profils certifies",
    body: "Documents verifies par notre equipe avant l'obtention du badge — proprietaires, agences et demarcheurs.",
  },
  {
    Icon: IconReliability,
    title: "Reputation a trois facettes",
    body: "Fiabilite, respect, sociabilite — jamais une note unique qui cache l'essentiel.",
  },
  {
    Icon: IconPanorama360,
    title: "Visites en 360°",
    body: "Explore chaque piece avant de te deplacer, grace a des visites immersives liees entre elles.",
  },
  {
    Icon: IconLuggage,
    title: "Reseau de compensation",
    body: "Voyageurs et expediteurs entre le Maroc et l'etranger, mis en relation directement.",
  },
];

export function HomeView({ listings, events }: { listings: ListingWithDistance[]; events: EventWithDistance[] }) {
  const { data: session } = useSession();
  const heroRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-word", {
        yPercent: 120,
        duration: 1,
        ease: "power4.out",
        stagger: 0.07,
        delay: 0.1,
      });
      gsap.from(".hero-sub", { opacity: 0, y: 20, duration: 0.8, delay: 0.6, ease: "power3.out" });
      gsap.from(".hero-cta", { opacity: 0, y: 20, duration: 0.8, delay: 0.75, ease: "power3.out" });

      gsap.to(".hero-accent-1", {
        yPercent: -30,
        rotate: 20,
        ease: "none",
        scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to(".hero-accent-2", {
        yPercent: 40,
        rotate: -15,
        ease: "none",
        scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: true },
      });

      gsap.utils.toArray<HTMLElement>(".reveal-section").forEach((el) => {
        gsap.from(el, { opacity: 0, y: 40, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } });
      });

      gsap.utils.toArray<HTMLElement>(".feature-item").forEach((el, i) => {
        gsap.from(el, {
          opacity: 0,
          y: 30,
          duration: 0.6,
          delay: i * 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%" },
        });
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const headline = ["La location", "longue duree,", "enfin de confiance"];

  return (
    <div ref={rootRef}>
      <section ref={heroRef} className="relative overflow-hidden px-6 pb-24 pt-20 sm:px-8 sm:pt-28">
        <HeroAccent className="hero-accent-1 absolute -right-16 -top-10 opacity-50" />
        <HeroAccent className="hero-accent-2 absolute -left-20 bottom-0 opacity-30" />

        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="font-display text-5xl italic leading-[1.05] text-paper sm:text-7xl">
            {headline.map((line, li) => (
              <span key={li} className="block overflow-hidden">
                {line.split(" ").map((word, wi) => (
                  <span key={wi} className="mr-3 inline-block overflow-hidden">
                    <span className="hero-word inline-block">{word}</span>
                  </span>
                ))}
              </span>
            ))}
          </h1>
          <p className="hero-sub mx-auto mt-6 max-w-lg text-base text-mist sm:text-lg">
            Annonces verifiees, proprietaires notes, visites 360° — ORYOC reconstruit la confiance dans la
            location longue duree au Maroc.
          </p>
          <div className="hero-cta mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link href="/listings">
              <Button size="lg" icon={<IconSearch size={18} />}>
                Explorer les logements
              </Button>
            </Link>
            <Link href={session?.user ? "/listings/new" : "/register"}>
              <Button size="lg" variant="secondary" icon={<IconPlus size={18} />}>
                Publier une annonce
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="reveal-section mx-auto max-w-6xl px-6 py-16 sm:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ Icon, title, body }) => (
            <div key={title} className="feature-item flex flex-col gap-3">
              <Icon size={26} className="text-brass" />
              <h3 className="font-display text-lg italic text-paper">{title}</h3>
              <p className="text-sm leading-relaxed text-mist">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="divider-zellige mx-auto max-w-6xl" />

      {listings.length > 0 && (
        <section className="reveal-section mx-auto max-w-6xl px-6 py-16 sm:px-8">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-display text-3xl italic text-paper">Logements recents</h2>
            <Link href="/listings" className="text-sm text-brass hover:text-brass-bright">
              Tout voir →
            </Link>
          </div>
          <motion.div layout className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </motion.div>
        </section>
      )}

      {events.length > 0 && (
        <section className="reveal-section mx-auto max-w-6xl px-6 py-16 sm:px-8">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-display text-3xl italic text-paper">Evenements a venir</h2>
            <Link href="/events" className="text-sm text-brass hover:text-brass-bright">
              Tout voir →
            </Link>
          </div>
          <motion.div layout className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </motion.div>
        </section>
      )}

      <section className="reveal-section mx-auto max-w-3xl px-6 py-24 text-center sm:px-8">
        <h2 className="font-display text-3xl italic text-paper sm:text-4xl">Rejoins ORYOC</h2>
        <p className="mx-auto mt-4 max-w-md text-sm text-mist">
          Cree ton compte pour publier une annonce, contacter un proprietaire ou laisser un avis.
        </p>
        <div className="mt-7">
          <Link href="/register">
            <Button size="lg">Creer mon compte</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function HeroAccent({ className }: { className?: string }) {
  return (
    <svg width="340" height="340" viewBox="0 0 340 340" fill="none" className={className}>
      <circle cx="170" cy="170" r="120" stroke="var(--color-brass-dim)" strokeWidth="1" />
      <circle cx="170" cy="170" r="150" stroke="var(--color-zellige)" strokeWidth="1" />
      <path d="M170 20v40M170 280v40M20 170h40M280 170h40" stroke="var(--color-brass-dim)" strokeWidth="1" />
    </svg>
  );
}
