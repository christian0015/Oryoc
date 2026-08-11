// components/filters-bar.tsx
"use client";

import { useState } from "react";
import type { ListingSearchFilters } from "@/types";
import { Modal, Input, Select, Toggle, Button } from "@/components/ui";
import { IconFilters, IconSearch } from "@/components/icons";

const contractTypes = [
  { value: "", label: "Tous les contrats" },
  { value: "long_term", label: "Longue duree" },
  { value: "student_lease", label: "Bail etudiant" },
  { value: "roommate_share", label: "Colocation" },
];

export function FiltersBar({
  value,
  onChange,
}: {
  value: ListingSearchFilters;
  onChange: (filters: ListingSearchFilters) => void;
}) {
  const [draft, setDraft] = useState<ListingSearchFilters>(value);
  const [open, setOpen] = useState(false);

  const activeCount = Object.values(value).filter((v) => v !== undefined && v !== "" && v !== false).length;

  function apply() {
    onChange(draft);
    setOpen(false);
  }

  function reset() {
    const empty: ListingSearchFilters = {};
    setDraft(empty);
    onChange(empty);
    setOpen(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[220px]">
        <IconSearch size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mist-dim" />
        <input
          value={value.city ?? ""}
          onChange={(e) => onChange({ ...value, city: e.target.value })}
          placeholder="Ville — Casablanca, Rabat, Marrakech..."
          className="w-full rounded-[var(--radius-pill)] border border-line bg-surface py-2.5 pl-11 pr-4 text-sm text-paper placeholder:text-mist-dim outline-none focus:border-brass"
        />
      </div>

      <button
        type="button"
        onClick={() => {
          setDraft(value);
          setOpen(true);
        }}
        className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-line bg-surface px-4 py-2.5 text-sm text-paper hover:border-brass-dim"
      >
        <IconFilters size={16} />
        Filtres
        {activeCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brass text-xs text-ink">
            {activeCount}
          </span>
        )}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Filtres" maxWidth="max-w-lg">
        <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto pr-1">
          <Input
            label="Quartier"
            value={draft.neighborhood ?? ""}
            onChange={(e) => setDraft({ ...draft, neighborhood: e.target.value || undefined })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Prix min (MAD)"
              type="number"
              value={draft.minPrice ?? ""}
              onChange={(e) => setDraft({ ...draft, minPrice: e.target.value ? Number(e.target.value) : undefined })}
            />
            <Input
              label="Prix max (MAD)"
              type="number"
              value={draft.maxPrice ?? ""}
              onChange={(e) => setDraft({ ...draft, maxPrice: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Pieces min"
              type="number"
              value={draft.minRooms ?? ""}
              onChange={(e) => setDraft({ ...draft, minRooms: e.target.value ? Number(e.target.value) : undefined })}
            />
            <Input
              label="Pieces max"
              type="number"
              value={draft.maxRooms ?? ""}
              onChange={(e) => setDraft({ ...draft, maxRooms: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Salles de bain min"
              type="number"
              value={draft.minBathrooms ?? ""}
              onChange={(e) =>
                setDraft({ ...draft, minBathrooms: e.target.value ? Number(e.target.value) : undefined })
              }
            />
            <Input
              label="Balcons min"
              type="number"
              value={draft.minBalconies ?? ""}
              onChange={(e) =>
                setDraft({ ...draft, minBalconies: e.target.value ? Number(e.target.value) : undefined })
              }
            />
          </div>

          <Select
            label="Type de contrat"
            value={draft.contractType ?? ""}
            onChange={(e) =>
              setDraft({ ...draft, contractType: (e.target.value || undefined) as ListingSearchFilters["contractType"] })
            }
          >
            {contractTypes.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>

          <div className="flex flex-col gap-3 rounded-[var(--radius-control)] border border-line p-4">
            <Toggle
              label="Avec piscine"
              checked={!!draft.hasPool}
              onChange={(v) => setDraft({ ...draft, hasPool: v || undefined })}
            />
            <Toggle
              label="Proprietaires certifies uniquement"
              checked={!!draft.certifiedOnly}
              onChange={(v) => setDraft({ ...draft, certifiedOnly: v || undefined })}
            />
            <Toggle
              label="Avec visite 360"
              checked={!!draft.has360Tour}
              onChange={(v) => setDraft({ ...draft, has360Tour: v || undefined })}
            />
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={reset} className="flex-1">
              Effacer
            </Button>
            <Button onClick={apply} className="flex-1">
              Appliquer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
