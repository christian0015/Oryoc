// app/compensation/manage/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getMyCompensationRequests } from "@/lib/actions/compensation";
import { ManageCompensationList } from "@/components/manage-compensation-list";
import { Button } from "@/components/ui";
import { IconPlus } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function ManageCompensationPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const res = await getMyCompensationRequests();
  const requests = res.ok ? res.data : [];

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl italic text-paper">Mes annonces</h1>
        <Link href="/compensation/new">
          <Button size="sm" icon={<IconPlus size={14} />}>
            Nouvelle annonce
          </Button>
        </Link>
      </div>
      <ManageCompensationList initialRequests={requests} />
    </div>
  );
}
