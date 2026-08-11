// components/profile-editor.tsx
"use client";

import { useState } from "react";
import type { UserDTO } from "@/types";
import {
  updateProfileField,
  updateAvatar,
  submitCertificationDocuments,
} from "@/lib/actions/profiles";
import { useAutosaveField } from "@/lib/hooks";
import { Input, Select, SaveIndicator, Button, Badge } from "@/components/ui";
import { SingleImageUploader, GalleryUploader } from "@/components/image-uploader";
import { CLOUDINARY_FOLDERS } from "@/lib/cloudinary-folders";
import { IconCertified } from "@/components/icons";

const roles = [
  { value: "tenant", label: "Locataire" },
  { value: "owner", label: "Proprietaire" },
  { value: "agency", label: "Agence" },
  { value: "broker", label: "Demarcheur" },
  { value: "recurring_landlord", label: "Bailleur recurrent" },
];

const certificationCopy: Record<UserDTO["certificationStatus"], { label: string; tone: "brass" | "neutral" | "alert" }> = {
  unverified: { label: "Non verifie", tone: "neutral" },
  pending: { label: "Documents en cours d'examen", tone: "brass" },
  verified: { label: "Compte certifie", tone: "brass" },
  rejected: { label: "Documents refuses — resoumets-les", tone: "alert" },
};

export function ProfileEditor({ initialProfile }: { initialProfile: UserDTO }) {
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl);
  const [role, setRole] = useState(initialProfile.role);
  const [locale, setLocale] = useState(initialProfile.locale);
  const [certDocs, setCertDocs] = useState<string[]>(initialProfile.certificationDocuments);
  const [certStatus, setCertStatus] = useState(initialProfile.certificationStatus);
  const [submitting, setSubmitting] = useState(false);

  const nameField = useAutosaveField(initialProfile.name, (v) => updateProfileField("name", v));
  const phoneField = useAutosaveField(initialProfile.phone ?? "", (v) => updateProfileField("phone", v));

  async function handleAvatarChange(url: string | undefined) {
    setAvatarUrl(url);
    if (url) await updateAvatar(url);
  }

  async function handleRoleChange(value: string) {
    setRole(value as UserDTO["role"]);
    await updateProfileField("role", value);
  }

  async function handleLocaleChange(value: string) {
    setLocale(value as UserDTO["locale"]);
    await updateProfileField("locale", value);
  }

  async function handleCertSubmit() {
    setSubmitting(true);
    const res = await submitCertificationDocuments(certDocs);
    setSubmitting(false);
    if (res.ok) setCertStatus("pending");
  }

  const cert = certificationCopy[certStatus];

  return (
    <div className="mt-8 flex flex-col gap-10">
      <div className="flex items-center gap-5">
        <SingleImageUploader
          folder={CLOUDINARY_FOLDERS.avatars}
          value={avatarUrl}
          onChange={handleAvatarChange}
          size={88}
        />
        <div>
          <p className="font-medium text-paper">{initialProfile.name}</p>
          <p className="text-sm text-mist-dim">{initialProfile.email}</p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-mist">Nom</span>
            <SaveIndicator state={nameField.state} />
          </div>
          <Input value={nameField.value} onChange={(e) => nameField.setValue(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-mist">Telephone</span>
            <SaveIndicator state={phoneField.state} />
          </div>
          <Input value={phoneField.value} onChange={(e) => phoneField.setValue(e.target.value)} className="mt-1.5" />
        </div>
        <Select label="Role" value={role} onChange={(e) => handleRoleChange(e.target.value)}>
          {roles.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
        <Select label="Langue" value={locale} onChange={(e) => handleLocaleChange(e.target.value)}>
          <option value="fr">Francais</option>
          <option value="en">English</option>
        </Select>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-display text-xl italic text-paper">Certification</h2>
          <Badge tone={cert.tone} icon={cert.tone === "brass" ? <IconCertified size={13} /> : undefined}>
            {cert.label}
          </Badge>
        </div>
        <p className="mb-4 text-sm text-mist">
          Depose une piece d&apos;identite et un justificatif de propriete (ou mandat d&apos;agence) pour obtenir le
          badge certifie. Un moderateur examine chaque soumission.
        </p>
        <GalleryUploader
          folder={CLOUDINARY_FOLDERS.certificationDocs}
          values={certDocs}
          onChange={setCertDocs}
          max={5}
        />
        <Button
          onClick={handleCertSubmit}
          loading={submitting}
          disabled={certDocs.length === 0}
          className="mt-4"
          size="sm"
        >
          Soumettre pour verification
        </Button>
      </div>
    </div>
  );
}
