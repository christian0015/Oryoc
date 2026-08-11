// components/profile-card.tsx
import Link from "next/link";
import Image from "next/image";
import type { PublicUserDTO } from "@/lib/actions/profiles";
import { RoleBadge, CertificationBadge } from "@/components/role-badge";
import { RatingDisplay } from "@/components/rating-display";
import { IconUser } from "@/components/icons";

export function ProfileCard({ user, href }: { user: PublicUserDTO; href?: string }) {
  const content = (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-surface-raised text-mist">
        {user.avatarUrl ? (
          <Image src={user.avatarUrl} alt={user.name} width={44} height={44} className="h-full w-full object-cover" />
        ) : (
          <IconUser size={18} />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate font-medium text-paper">{user.name}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <RoleBadge role={user.role} />
          <CertificationBadge status={user.certificationStatus} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex items-center justify-between gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4">
      {href ? (
        <Link href={href} className="min-w-0 flex-1">
          {content}
        </Link>
      ) : (
        <div className="min-w-0 flex-1">{content}</div>
      )}
      <RatingDisplay scores={user.trustScores} compact />
    </div>
  );
}
