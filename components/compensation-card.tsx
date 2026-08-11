// components/compensation-card.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { CompensationWithRequester } from "@/lib/actions/compensation";
import { revealContact } from "@/lib/actions/profiles";
import { useAuthGatedAction } from "@/lib/hooks";
import { Badge, Button } from "@/components/ui";
import { IconLuggage, IconWeight, IconCalendar, IconMail, IconPhone, IconUser } from "@/components/icons";

export function CompensationCard({ request }: { request: CompensationWithRequester }) {
  const [contact, setContact] = useState<{ email: string; phone?: string } | null>(null);
  const { run, loading } = useAuthGatedAction(revealContact);

  async function handleReveal() {
    const res = await run(request.requester.id);
    if (res) setContact(res);
  }

  const isTripOffer = request.type === "trip_offer";
  const date = new Date(request.travelDate);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <Badge tone={isTripOffer ? "brass" : "zellige"} icon={<IconLuggage size={13} />}>
          {isTripOffer ? "Trajet propose" : "Demande de transport"}
        </Badge>
        <span className="inline-flex items-center gap-1.5 text-xs text-mist-dim">
          <IconCalendar size={13} />
          {date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>

      <p className="font-display text-xl italic text-paper">
        {request.fromCity} <span className="text-mist-dim">({request.fromCountry})</span>
        <span className="mx-2 text-brass">→</span>
        {request.toCity} <span className="text-mist-dim">({request.toCountry})</span>
      </p>

      {isTripOffer ? (
        request.availableWeightKg !== undefined && (
          <p className="inline-flex items-center gap-2 text-sm text-mist">
            <IconWeight size={15} className="text-zellige-bright" /> {request.availableWeightKg} kg disponibles
          </p>
        )
      ) : (
        <div className="text-sm text-mist">
          {request.packageDescription && <p>{request.packageDescription}</p>}
          {request.weightKg !== undefined && (
            <p className="mt-1 inline-flex items-center gap-2">
              <IconWeight size={15} className="text-zellige-bright" /> ~{request.weightKg} kg
            </p>
          )}
        </div>
      )}

      {request.compensationOffer && (
        <p className="rounded-[var(--radius-control)] border border-line bg-surface-raised p-3 text-xs text-mist">
          {request.compensationOffer}
        </p>
      )}

      <div className="flex items-center justify-between border-t border-line pt-4">
        <Link href={`/profile/${request.requester.id}`} className="inline-flex items-center gap-2 text-sm text-mist hover:text-paper">
          <IconUser size={14} />
          {request.requester.name}
        </Link>
        {contact ? (
          <div className="flex flex-col items-end gap-1 text-xs text-paper">
            <span className="inline-flex items-center gap-1.5">
              <IconMail size={12} className="text-brass" /> {contact.email}
            </span>
            {contact.phone && (
              <span className="inline-flex items-center gap-1.5">
                <IconPhone size={12} className="text-brass" /> {contact.phone}
              </span>
            )}
          </div>
        ) : (
          <Button size="sm" variant="secondary" loading={loading} onClick={handleReveal}>
            Contacter
          </Button>
        )}
      </div>
    </motion.div>
  );
}
