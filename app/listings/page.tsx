// app/listings/page.tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { ListingSearchFilters } from "@/types";
import { searchListings, getMyFavoriteListingIds, type ListingWithDistance } from "@/lib/actions/listings";
import { FiltersBar } from "@/components/filters-bar";
import { ListingCard } from "@/components/listing-card";
import { EmptyState, Skeleton, Button } from "@/components/ui";
import { IconPlus, IconBuilding } from "@/components/icons";

export default function ListingsPage() {
  const [filters, setFilters] = useState<ListingSearchFilters>({});
  const [listings, setListings] = useState<ListingWithDistance[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getMyFavoriteListingIds().then((res) => res.ok && setFavoriteIds(res.data));
  }, []);

  useEffect(() => {
    setPage(1);
    startTransition(async () => {
      const res = await searchListings(filters, 1);
      if (res.ok) {
        setListings(res.data.listings);
        setTotal(res.data.total);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  async function loadMore() {
    const nextPage = page + 1;
    const res = await searchListings(filters, nextPage);
    if (res.ok) {
      setListings((prev) => [...prev, ...res.data.listings]);
      setPage(nextPage);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl italic text-paper">Logements</h1>
          <p className="mt-1 text-sm text-mist-dim">{total} annonce{total > 1 ? "s" : ""} verifiee{total > 1 ? "s" : ""}</p>
        </div>
        <Link href="/listings/new">
          <Button icon={<IconPlus size={16} />}>Publier une annonce</Button>
        </Link>
      </div>

      <FiltersBar value={filters} onChange={setFilters} />

      <div className="mt-8">
        {isPending && listings.length === 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] w-full" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <EmptyState
            icon={<IconBuilding size={32} />}
            title="Aucun logement ne correspond"
            description="Essaie d'elargir tes filtres — nos plages de prix et de pieces sont deja flexibles."
          />
        ) : (
          <motion.div layout className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} favorited={favoriteIds.includes(l.id)} />
            ))}
          </motion.div>
        )}

        {listings.length < total && (
          <div className="mt-8 flex justify-center">
            <Button variant="secondary" onClick={loadMore}>
              Voir plus
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
