// app/profile/[id]/page.tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import { getPublicProfile } from "@/lib/actions/profiles";
import { getListingsByOwner } from "@/lib/actions/listings";
import { RoleBadge, CertificationBadge } from "@/components/role-badge";
import { RatingDisplay } from "@/components/rating-display";
import { ReviewsSection } from "@/components/review-form";
import { ListingCard } from "@/components/listing-card";
import { IconUser } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getPublicProfile(id);
  if (!res.ok) notFound();
  const user = res.data;

  const listingsRes = await getListingsByOwner(id);
  const listings = listingsRes.ok ? listingsRes.data.filter((l) => l.status === "active") : [];

  const memberSince = new Date(user.createdAt).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-surface text-mist">
          {user.avatarUrl ? (
            <Image src={user.avatarUrl} alt={user.name} width={96} height={96} className="h-full w-full object-cover" />
          ) : (
            <IconUser size={32} />
          )}
        </div>
        <div>
          <h1 className="font-display text-3xl italic text-paper">{user.name}</h1>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <RoleBadge role={user.role} />
            <CertificationBadge status={user.certificationStatus} />
          </div>
          <p className="mt-2 text-sm text-mist-dim">Membre depuis {memberSince}</p>
        </div>
      </div>

      <div className="divider-zellige my-10" />

      <section>
        <h2 className="mb-4 font-display text-xl italic text-paper">Reputation</h2>
        <RatingDisplay scores={user.trustScores} />
      </section>

      <div className="divider-zellige my-10" />

      {listings.length > 0 && (
        <>
          <section>
            <h2 className="mb-4 font-display text-xl italic text-paper">Annonces</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </section>
          <div className="divider-zellige my-10" />
        </>
      )}

      <ReviewsSection targetType="profile" targetId={user.id} />
    </div>
  );
}
