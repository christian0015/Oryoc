// app/listings/manage/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getMyListings } from "@/lib/actions/listings";
import { ManageListingsList } from "@/components/manage-listings-list";
import { Button } from "@/components/ui";
import { IconPlus } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function ManageListingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const res = await getMyListings();
  const listings = res.ok ? res.data : [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl italic text-paper">Mes annonces</h1>
        <Link href="/listings/new">
          <Button size="sm" icon={<IconPlus size={14} />}>
            Nouvelle annonce
          </Button>
        </Link>
      </div>
      <ManageListingsList initialListings={listings} />
    </div>
  );
}
