// components/nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useAuthModal } from "@/components/providers";
import { IconUser, IconLogout, IconPlus } from "@/components/icons";
import { Button } from "@/components/ui";

const links = [
  { href: "/listings", label: "Logements" },
  { href: "/events", label: "Evenements" },
  { href: "/compensation", label: "Compensation" },
];

export function Nav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { openAuthModal } = useAuthModal();

  return (
    <header className="sticky top-0 z-50 hidden border-b border-line-soft bg-ink/85 backdrop-blur-md md:block">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-8">
        <Link href="/" className="font-display text-2xl italic tracking-tight text-paper">
          ORYOC
        </Link>

        <nav className="flex items-center gap-8">
          {links.map((l) => {
            const isActive = pathname?.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative text-sm font-medium transition-colors ${
                  isActive ? "text-paper" : "text-mist hover:text-paper"
                }`}
              >
                {l.label}
                {isActive && (
                  <span className="absolute -bottom-[19px] left-0 right-0 h-[2px] bg-brass" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {status === "authenticated" && session?.user ? (
            <>
              <Link href="/listings/new">
                <Button size="sm" icon={<IconPlus size={16} />}>
                  Publier
                </Button>
              </Link>
              <Link
                href={`/profile/${session.user.id}`}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-paper hover:border-brass-dim"
                aria-label="Mon profil"
              >
                <IconUser size={17} />
              </Link>
              <button
                onClick={() => signOut()}
                aria-label="Se deconnecter"
                className="flex h-9 w-9 items-center justify-center rounded-full text-mist hover:bg-surface-raised hover:text-paper"
              >
                <IconLogout size={17} />
              </button>
            </>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => openAuthModal()}>
              Se connecter
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
