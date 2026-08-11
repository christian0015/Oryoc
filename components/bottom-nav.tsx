// components/bottom-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { IconHome, IconBuilding, IconCalendar, IconLuggage, IconUser } from "@/components/icons";

const items = [
  { href: "/", label: "Accueil", icon: IconHome },
  { href: "/listings", label: "Logements", icon: IconBuilding },
  { href: "/events", label: "Evenements", icon: IconCalendar },
  { href: "/compensation", label: "Compensation", icon: IconLuggage },
];

export function BottomNav() {
  const pathname = usePathname() ?? "/";
  const { data: session } = useSession();

  const profileHref = session?.user ? `/profile/${session.user.id}` : "/login";
  const allItems = [...items, { href: profileHref, label: "Profil", icon: IconUser }];

  const activeIndex = allItems.findIndex((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href.split("/")[1] ? `/${item.href.split("/")[1]}` : item.href)
  );

  return (
    <nav className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4 md:hidden">
      {/* Goo filter: merges the blob with the icon well behind it into one
          liquid shape, then the active pill glides between icons. */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <filter id="oryoc-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -11"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div className="relative flex items-center gap-1 rounded-[var(--radius-pill)] border border-line-soft bg-surface/90 px-2 py-2 shadow-[0_20px_50px_-16px_rgba(0,0,0,0.75)] backdrop-blur-xl">
        <div
          className="absolute inset-0 flex items-center px-2"
          style={{ filter: "url(#oryoc-goo)" }}
        >
          {activeIndex >= 0 && (
            <motion.span
              layout
              layoutId="bottom-nav-blob"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="absolute h-12 w-12 rounded-full bg-brass"
              style={{ left: `${8 + activeIndex * 52}px` }}
            />
          )}
          <span className="h-12 w-12 opacity-0" />
        </div>

        {allItems.map((item, i) => {
          const isActive = i === activeIndex;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full"
            >
              <motion.span
                animate={{ color: isActive ? "var(--color-ink)" : "var(--color-mist)" }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center"
              >
                <Icon size={20} />
              </motion.span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
