// app/listings/[id]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getListingById } from "@/lib/actions/listings";
import { FavoriteModel } from "@/lib/models";
import { connectDB } from "@/lib/db";
import { ListingDetailView } from "@/components/listing-detail-view";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const res = await getListingById(id);
  if (!res.ok) return { title: "Annonce introuvable — ORYOC" };
  return {
    title: `${res.data.title} — ORYOC`,
    description: res.data.description.slice(0, 160),
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getListingById(id);
  if (!res.ok) notFound();

  const session = await auth();
  const isOwner = session?.user?.id === res.data.ownerId;

  let isFavorited = false;
  if (session?.user?.id) {
    await connectDB();
    const fav = await FavoriteModel.findOne({ userId: session.user.id, targetType: "listing", targetId: id });
    isFavorited = Boolean(fav);
  }

  return <ListingDetailView listing={res.data} isOwner={isOwner} initialFavorited={isFavorited} />;
}
