// app/compensation/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  searchCompensationRequests,
  type CompensationWithRequester,
  type CompensationSearchFilters,
} from "@/lib/actions/compensation";
import { CompensationCard } from "@/components/compensation-card";
import { EmptyState, Skeleton, Button, Input } from "@/components/ui";
import { IconPlus, IconLuggage } from "@/components/icons";

export default function CompensationPage() {
  const [type, setType] = useState<"trip_offer" | "transport_request" | "">("");
  const [toCity, setToCity] = useState("");
  const [requests, setRequests] = useState<CompensationWithRequester[] | null>(null);

  useEffect(() => {
    const filters: CompensationSearchFilters = {
      type: (type || undefined) as CompensationSearchFilters["type"],
      toCity: toCity || undefined,
    };
    searchCompensationRequests(filters).then((res) => res.ok && setRequests(res.data));
  }, [type, toCity]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl italic text-paper sm:text-4xl">Compensation</h1>
          <p className="mt-2 max-w-md text-sm text-mist-dim">
            Mets en relation voyageurs et expediteurs entre le Maroc et l&apos;etranger — sans intermediaire de
            paiement, la compensation se negocie directement entre vous.
          </p>
        </div>
        <Link href="/compensation/new">
          <Button icon={<IconPlus size={16} />}>Publier une annonce</Button>
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {[
          { value: "", label: "Tout" },
          { value: "trip_offer", label: "Trajets proposes" },
          { value: "transport_request", label: "Demandes de transport" },
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => setType(t.value as typeof type)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              type === t.value ? "border-brass bg-brass text-ink" : "border-line bg-surface text-mist hover:text-paper"
            }`}
          >
            {t.label}
          </button>
        ))}
        <Input
          value={toCity}
          onChange={(e) => setToCity(e.target.value)}
          placeholder="Ville d'arrivee..."
          className="!w-48 !py-2"
        />
      </div>

      <div className="mt-8">
        {requests === null ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-52 w-full" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <EmptyState icon={<IconLuggage size={30} />} title="Aucune annonce" description="Sois le premier a publier un trajet ou une demande." />
        ) : (
          <motion.div layout className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {requests.map((r) => (
              <CompensationCard key={r.id} request={r} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
