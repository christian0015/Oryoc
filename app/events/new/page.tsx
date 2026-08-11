// app/events/new/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { EventForm } from "@/components/event-form";

export default async function NewEventPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl italic text-paper">Creer un evenement</h1>
      <p className="mt-2 text-sm text-mist">
        Ton evenement sera visible publiquement une fois valide par un moderateur.
      </p>
      <div className="mt-8">
        <EventForm />
      </div>
    </div>
  );
}
