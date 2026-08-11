// components/event-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { createEvent } from "@/lib/actions/events";
import { geocodeAddressAction } from "@/lib/actions/listings";
import { Input, Textarea, Select, Toggle, Button } from "@/components/ui";
import { GalleryUploader } from "@/components/image-uploader";
import { CLOUDINARY_FOLDERS } from "@/lib/cloudinary-folders";
import { IconPin } from "@/components/icons";

const MapView = dynamic(() => import("@/components/map-view").then((m) => m.MapView), { ssr: false });

const categories = [
  { value: "social", label: "Social" },
  { value: "culture", label: "Culture" },
  { value: "sport", label: "Sport" },
  { value: "networking", label: "Networking" },
  { value: "music", label: "Musique" },
  { value: "other", label: "Autre" },
];

export function EventForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("social");
  const [dateTime, setDateTime] = useState("");
  const [address, setAddress] = useState("");
  const [geocoded, setGeocoded] = useState<{ lat: number; lng: number; displayName: string } | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("");
  const [contactLink, setContactLink] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleLocate() {
    if (!address.trim()) {
      setError("Renseigne une adresse avant de localiser");
      return;
    }
    setGeocoding(true);
    setError(null);
    const res = await geocodeAddressAction(`${address}, Maroc`);
    setGeocoding(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setGeocoded(res.data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!geocoded) {
      setError("Localise l'adresse avant de publier");
      return;
    }

    setSubmitting(true);
    const res = await createEvent({
      title,
      description,
      category,
      photos,
      dateTime: new Date(dateTime).toISOString(),
      location: { address, lat: geocoded.lat, lng: geocoded.lng },
      isFree,
      price: isFree ? undefined : Number(price),
      capacity: capacity ? Number(capacity) : undefined,
      contactLink: contactLink || undefined,
    });
    setSubmitting(false);

    if (!res.ok) {
      setError(res.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push(`/events/${res.data.id}`), 1200);
  }

  if (done) {
    return (
      <div className="rounded-[var(--radius-card)] border border-brass-dim/50 bg-[rgba(201,161,90,0.06)] p-6 text-center">
        <p className="font-display text-xl italic text-paper">Evenement soumis</p>
        <p className="mt-2 text-sm text-mist">Il sera visible publiquement une fois valide par un moderateur.</p>
      </div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="flex flex-col gap-6"
    >
      <Input label="Titre" required value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea label="Description" required value={description} onChange={(e) => setDescription(e.target.value)} />

      <div className="grid grid-cols-2 gap-4">
        <Select label="Categorie" value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
        <Input label="Date et heure" type="datetime-local" required value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
      </div>

      <Input label="Adresse" required value={address} onChange={(e) => setAddress(e.target.value)} />
      <Button type="button" variant="secondary" icon={<IconPin size={16} />} loading={geocoding} onClick={handleLocate} className="self-start">
        Localiser sur la carte
      </Button>
      {geocoded && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-mist-dim">{geocoded.displayName}</p>
          <MapView markers={[{ id: "preview", lat: geocoded.lat, lng: geocoded.lng, title: title || "Ton evenement" }]} height={240} />
        </div>
      )}

      <Toggle label="Evenement gratuit" checked={isFree} onChange={setIsFree} />
      <div className="grid grid-cols-2 gap-4">
        {!isFree && <Input label="Prix (MAD)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />}
        <Input label="Capacite (optionnel)" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
      </div>
      <Input label="Lien de contact / billeterie (optionnel)" value={contactLink} onChange={(e) => setContactLink(e.target.value)} placeholder="https://..." />

      <GalleryUploader folder={CLOUDINARY_FOLDERS.eventPhotos} values={photos} onChange={setPhotos} max={8} label="Photos" />

      {error && <p className="text-sm text-alert-bright">{error}</p>}

      <Button type="submit" size="lg" loading={submitting} className="self-start">
        Soumettre l&apos;evenement
      </Button>
    </motion.form>
  );
}
