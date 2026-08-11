// components/role-badge.tsx
import type { UserRole, CertificationStatus } from "@/types";
import { Badge } from "@/components/ui";
import { IconCertified } from "@/components/icons";

const roleLabels: Record<UserRole, string> = {
  tenant: "Locataire",
  owner: "Proprietaire",
  agency: "Agence",
  broker: "Demarcheur",
  recurring_landlord: "Bailleur recurrent",
};

export function RoleBadge({ role }: { role: UserRole }) {
  return <Badge tone="neutral">{roleLabels[role]}</Badge>;
}

export function CertificationBadge({ status }: { status: CertificationStatus }) {
  if (status !== "verified") return null;
  return (
    <Badge tone="brass" icon={<IconCertified size={13} />}>
      Certifie
    </Badge>
  );
}
