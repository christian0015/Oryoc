// app/compensation/new/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CompensationForm } from "@/components/compensation-form";

export default async function NewCompensationPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <h1 className="font-display text-3xl italic text-paper">Publier une annonce</h1>
      <p className="mt-2 text-sm text-mist">Trouve un partenaire de voyage pour transporter un colis, ou propose ta place disponible.</p>
      <div className="mt-8">
        <CompensationForm />
      </div>
    </div>
  );
}
