// components/listing-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createListing, geocodeAddressAction } from "@/lib/actions/listings";
import { Input, Textarea, Select, Toggle, Button } from "@/components/ui";
import { GalleryUploader } from "@/components/image-uploader";
import { CLOUDINARY_FOLDERS } from "@/lib/cloudinary-folders";
import { IconPin } from "@/components/icons";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/map-view").then((m) => m.MapView), { ssr: false });

const propertyTypes = [
  { value: "apartment", label: "Appartement" },
  { value: "studio", label: "Studio" },
  { value: "villa", label: "Villa" },
  { value: "shared_room", label: "Colocation" },
];

const contractTypes = [
  { value: "long_term", label: "Longue duree" },
  { value: "student_lease", label: "Bail etudiant" },
  { value: "roommate_share", label: "Colocation" },
];

export function ListingForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [propertyType, setPropertyType] = useState("apartment");
  const [contractType, setContractType] = useState("long_term");
  const [price, setPrice] = useState("");
  const [rooms, setRooms] = useState("1");
  const [bathrooms, setBathrooms] = useState("1");
  const [balconies, setBalconies] = useState("0");
  const [hasPool, setHasPool] = useState(false);
  const [address, setAddress] = useState("");
  const [geocoded, setGeocoded] = useState<{ lat: number; lng: number; displayName: string } | null>(null);
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [videoClips, setVideoClips] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLocate() {
    if (!address.trim() && !city.trim()) {
      setError("Renseigne au moins l'adresse et la ville avant de localiser");
      return;
    }
    setGeocoding(true);
    setError(null);
    const res = await geocodeAddressAction(`${address}, ${neighborhood}, ${city}, Maroc`);
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
    const res = await createListing({
      title,
      description,
      propertyType,
      contractType,
      price: Number(price),
      currency: "MAD",
      rooms: Number(rooms),
      bathrooms: Number(bathrooms),
      balconies: Number(balconies),
      hasPool,
      location: { address, city, neighborhood: neighborhood || undefined, lat: geocoded.lat, lng: geocoded.lng },
      photos,
      videoClips,
    });
    setSubmitting(false);

    if (!res.ok) {
      setError(res.message);
      return;
    }
    router.push(`/listings/${res.data.id}`);
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="flex flex-col gap-8"
    >
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl italic text-paper">L&apos;essentiel</h2>
        <Input label="Titre de l'annonce" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea
          label="Description"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Type de bien" value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
            {propertyTypes.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
          <Select label="Type de contrat" value={contractType} onChange={(e) => setContractType(e.target.value)}>
            {contractTypes.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl italic text-paper">Caracteristiques</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Input label="Prix (MAD/mois)" type="number" required value={price} onChange={(e) => setPrice(e.target.value)} />
          <Input label="Pieces" type="number" required value={rooms} onChange={(e) => setRooms(e.target.value)} />
          <Input label="Salles de bain" type="number" required value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />
          <Input label="Balcons" type="number" value={balconies} onChange={(e) => setBalconies(e.target.value)} />
        </div>
        <Toggle label="Piscine" checked={hasPool} onChange={setHasPool} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl italic text-paper">Emplacement</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Ville" required value={city} onChange={(e) => setCity(e.target.value)} />
          <Input label="Quartier" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
        </div>
        <Input label="Adresse" required value={address} onChange={(e) => setAddress(e.target.value)} />
        <Button type="button" variant="secondary" icon={<IconPin size={16} />} loading={geocoding} onClick={handleLocate} className="self-start">
          Localiser sur la carte
        </Button>
        {geocoded && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-mist-dim">{geocoded.displayName}</p>
            <MapView markers={[{ id: "preview", lat: geocoded.lat, lng: geocoded.lng, title: title || "Ton annonce" }]} height={260} />
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl italic text-paper">Photos et videos</h2>
        <GalleryUploader folder={CLOUDINARY_FOLDERS.listingPhotos} values={photos} onChange={setPhotos} max={20} label="Photos (3 minimum)" />
        <GalleryUploader
          folder={CLOUDINARY_FOLDERS.listingVideos}
          values={videoClips}
          onChange={setVideoClips}
          max={4}
          resourceType="video"
          label="Videos courtes (optionnel)"
        />
      </section>

      {error && <p className="text-sm text-alert-bright">{error}</p>}

      <Button type="submit" size="lg" loading={submitting} className="self-start">
        Publier l&apos;annonce
      </Button>
    </motion.form>
  );
}
