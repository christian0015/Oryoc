// components/manage-listings-list.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { ListingDTO, ListingStatus } from "@/types";
import {
  confirmListingStillAvailable,
  moveListingToTrash,
  deleteListingPermanently,
} from "@/lib/actions/listings";
import { Badge, Button, Modal, EmptyState } from "@/components/ui";
import { IconCheck, IconEdit, IconTrash, IconBuilding } from "@/components/icons";

const statusMeta: Record<ListingStatus, { label: string; tone: "brass" | "neutral" | "alert" | "zellige" }> = {
  active: { label: "Active", tone: "zellige" },
  pending_confirmation: { label: "A confirmer", tone: "brass" },
  trash: { label: "Corbeille", tone: "alert" },
  archived: { label: "Archivee", tone: "neutral" },
};

export function ManageListingsList({ initialListings }: { initialListings: ListingDTO[] }) {
  const [listings, setListings] = useState(initialListings);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  async function handleConfirm(id: string) {
    const res = await confirmListingStillAvailable(id);
    if (res.ok) {
      setListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: "active", lastConfirmedAt: new Date().toISOString() } : l))
      );
    }
  }

  async function handleTrash(id: string) {
    const res = await moveListingToTrash(id);
    if (res.ok) setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status: "trash" } : l)));
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    const res = await deleteListingPermanently(pendingDelete);
    if (res.ok) setListings((prev) => prev.filter((l) => l.id !== pendingDelete));
    setPendingDelete(null);
  }

  if (listings.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState
          icon={<IconBuilding size={28} />}
          title="Aucune annonce pour l'instant"
          description="Publie ta premiere annonce pour la voir apparaitre ici."
        />
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-3">
      {listings.map((l) => {
        const meta = statusMeta[l.status];
        const daysSinceConfirm = Math.floor((Date.now() - new Date(l.lastConfirmedAt).getTime()) / 86_400_000);
        return (
          <div key={l.id} className="flex items-center gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4">
            <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-[var(--radius-control)] bg-surface-raised">
              {l.photos[0] && <Image src={l.photos[0]} alt={l.title} fill className="object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium text-paper">{l.title}</p>
                <Badge tone={meta.tone}>{meta.label}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-mist-dim">
                {l.price.toLocaleString("fr-FR")} {l.currency}/mois · confirmee il y a {daysSinceConfirm} j
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {l.status !== "trash" && (
                <Button size="sm" variant="ghost" icon={<IconCheck size={14} />} onClick={() => handleConfirm(l.id)}>
                  Confirmer
                </Button>
              )}
              <Link href={`/listings/manage/${l.id}`}>
                <Button size="sm" variant="secondary" icon={<IconEdit size={14} />}>
                  Modifier
                </Button>
              </Link>
              {l.status !== "trash" ? (
                <button
                  onClick={() => handleTrash(l.id)}
                  aria-label="Mettre a la corbeille"
                  className="rounded-full p-2 text-mist hover:bg-surface-raised hover:text-alert-bright"
                >
                  <IconTrash size={15} />
                </button>
              ) : (
                <button
                  onClick={() => setPendingDelete(l.id)}
                  aria-label="Supprimer definitivement"
                  className="rounded-full p-2 text-alert hover:bg-surface-raised"
                >
                  <IconTrash size={15} />
                </button>
              )}
            </div>
          </div>
        );
      })}

      <Modal open={!!pendingDelete} onClose={() => setPendingDelete(null)} title="Supprimer definitivement ?">
        <p className="text-sm text-mist">
          Cette action supprime l&apos;annonce et toutes ses photos de facon irreversible.
        </p>
        <div className="mt-5 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setPendingDelete(null)}>
            Annuler
          </Button>
          <Button variant="danger" className="flex-1" onClick={handleDelete}>
            Supprimer
          </Button>
        </div>
      </Modal>
    </div>
  );
}
