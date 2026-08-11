// app/listings/new/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ListingForm } from "@/components/listing-form";

export default async function NewListingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl italic text-paper">Publier une annonce</h1>
      <p className="mt-2 text-sm text-mist">
        Toutes les informations peuvent etre modifiees apres publication.
      </p>
      <div className="mt-8">
        <ListingForm />
      </div>
    </div>
  );
}
