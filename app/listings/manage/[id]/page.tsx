// app/listings/manage/[id]/page.tsx
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getListingById } from "@/lib/actions/listings";
import { ListingEditor } from "@/components/listing-editor";

export const dynamic = "force-dynamic";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const res = await getListingById(id);
  if (!res.ok) notFound();
  if (res.data.ownerId !== session.user.id) redirect(`/listings/${id}`);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl italic text-paper">Modifier l&apos;annonce</h1>
      <p className="mt-2 text-sm text-mist">Les champs texte s&apos;enregistrent automatiquement.</p>
      <ListingEditor listing={res.data} />
    </div>
  );
}
