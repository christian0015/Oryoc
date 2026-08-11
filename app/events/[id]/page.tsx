// app/events/[id]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getEventById } from "@/lib/actions/events";
import { FavoriteModel } from "@/lib/models";
import { connectDB } from "@/lib/db";
import { EventDetailView } from "@/components/event-detail-view";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const res = await getEventById(id);
  if (!res.ok) return { title: "Evenement introuvable — ORYOC" };
  return { title: `${res.data.title} — ORYOC`, description: res.data.description.slice(0, 160) };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getEventById(id);
  if (!res.ok) notFound();

  const session = await auth();
  const isOrganizer = session?.user?.id === res.data.organizerId;

  let isFavorited = false;
  if (session?.user?.id) {
    await connectDB();
    const fav = await FavoriteModel.findOne({ userId: session.user.id, targetType: "event", targetId: id });
    isFavorited = Boolean(fav);
  }

  if (res.data.status !== "published" && !isOrganizer) notFound();

  return <EventDetailView event={res.data} isOrganizer={isOrganizer} initialFavorited={isFavorited} />;
}
