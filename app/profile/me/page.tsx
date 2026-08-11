// app/profile/me/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMyProfile } from "@/lib/actions/profiles";
import { ProfileEditor } from "@/components/profile-editor";

export const dynamic = "force-dynamic";

export default async function MyProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const res = await getMyProfile();
  if (!res.ok) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl italic text-paper">Mon profil</h1>
      <p className="mt-2 text-sm text-mist">
        Les champs texte s&apos;enregistrent automatiquement. Les autres se mettent a jour immediatement.
      </p>
      <ProfileEditor initialProfile={res.data} />
    </div>
  );
}
