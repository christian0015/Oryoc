// app/events/manage/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getMyEvents } from "@/lib/actions/events";
import { ManageEventsList } from "@/components/manage-events-list";
import { Button } from "@/components/ui";
import { IconPlus } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function ManageEventsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const res = await getMyEvents();
  const events = res.ok ? res.data : [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl italic text-paper">Mes evenements</h1>
        <Link href="/events/new">
          <Button size="sm" icon={<IconPlus size={14} />}>
            Nouvel evenement
          </Button>
        </Link>
      </div>
      <ManageEventsList initialEvents={events} />
    </div>
  );
}
