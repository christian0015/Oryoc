// components/listing-editor.tsx
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { ListingDTO } from "@/types";
import {
  updateListingField,
  updateListingLocation,
  updateListingMedia,
  updatePanoramaScenes,
  geocodeAddressAction,
} from "@/lib/actions/listings";
import { useAutosaveField } from "@/lib/hooks";
import { Input, Textarea, Select, Toggle, SaveIndicator, Button } from "@/components/ui";
import { GalleryUploader } from "@/components/image-uploader";
import { CLOUDINARY_FOLDERS } from "@/lib/cloudinary-folders";
import { IconPin } from "@/components/icons";

const PanoramaTourBuilder = dynamic(
  () => import("@/components/panorama-capture").then((m) => m.PanoramaTourBuilder),
  { ssr: false }
);
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

export function ListingEditor({ listing }: { listing: ListingDTO }) {
  const [propertyType, setPropertyType] = useState(listing.propertyType);
  const [contractType, setContractType] = useState(listing.contractType);
  const [hasPool, setHasPool] = useState(listing.hasPool);
  const [photos, setPhotos] = useState(listing.photos);
  const [videoClips, setVideoClips] = useState(listing.videoClips);
  const [panoramaScenes, setPanoramaScenes] = useState(listing.panoramaScenes);
  const [location, setLocation] = useState(listing.location);
  const [addressDraft, setAddressDraft] = useState(listing.location.address);
  const [geocoding, setGeocoding] = useState(false);

  const titleField = useAutosaveField(listing.title, (v) => updateListingField(listing.id, "title", v));
  const descriptionField = useAutosaveField(listing.description, (v) =>
    updateListingField(listing.id, "description", v)
  );
  const priceField = useAutosaveField(String(listing.price), (v) =>
    updateListingField(listing.id, "price", Number(v))
  );
  const roomsField = useAutosaveField(String(listing.rooms), (v) => updateListingField(listing.id, "rooms", Number(v)));
  const bathroomsField = useAutosaveField(String(listing.bathrooms), (v) =>
    updateListingField(listing.id, "bathrooms", Number(v))
  );
  const balconiesField = useAutosaveField(String(listing.balconies), (v) =>
    updateListingField(listing.id, "balconies", Number(v))
  );

  async function handlePropertyTypeChange(v: string) {
    setPropertyType(v as ListingDTO["propertyType"]);
    await updateListingField(listing.id, "propertyType", v);
  }
  async function handleContractTypeChange(v: string) {
    setContractType(v as ListingDTO["contractType"]);
    await updateListingField(listing.id, "contractType", v);
  }
  async function handlePoolChange(v: boolean) {
    setHasPool(v);
    await updateListingField(listing.id, "hasPool", v);
  }

  async function handlePhotosChange(urls: string[]) {
    setPhotos(urls);
    await updateListingMedia(listing.id, { photos: urls });
  }
  async function handleVideosChange(urls: string[]) {
    setVideoClips(urls);
    await updateListingMedia(listing.id, { videoClips: urls });
  }
  async function handleScenesChange(scenes: typeof panoramaScenes) {
    setPanoramaScenes(scenes);
    await updatePanoramaScenes(listing.id, scenes);
  }

  async function handleRelocate() {
    setGeocoding(true);
    const res = await geocodeAddressAction(`${addressDraft}, ${location.neighborhood ?? ""}, ${location.city}, Maroc`);
    setGeocoding(false);
    if (res.ok) {
      const next = { ...location, address: addressDraft, lat: res.data.lat, lng: res.data.lng };
      setLocation(next);
      await updateListingLocation(listing.id, next);
    }
  }

  return (
    <div className="mt-8 flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-mist">Titre</span>
          <SaveIndicator state={titleField.state} />
        </div>
        <Input value={titleField.value} onChange={(e) => titleField.setValue(e.target.value)} />

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-mist">Description</span>
          <SaveIndicator state={descriptionField.state} />
        </div>
        <Textarea value={descriptionField.value} onChange={(e) => descriptionField.setValue(e.target.value)} />

        <div className="grid grid-cols-2 gap-4">
          <Select label="Type de bien" value={propertyType} onChange={(e) => handlePropertyTypeChange(e.target.value)}>
            {propertyTypes.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
          <Select label="Type de contrat" value={contractType} onChange={(e) => handleContractTypeChange(e.target.value)}>
            {contractTypes.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Prix", field: priceField },
          { label: "Pieces", field: roomsField },
          { label: "Salles de bain", field: bathroomsField },
          { label: "Balcons", field: balconiesField },
        ].map(({ label, field }) => (
          <div key={label}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-mist">{label}</span>
              <SaveIndicator state={field.state} />
            </div>
            <Input type="number" value={field.value} onChange={(e) => field.setValue(e.target.value)} className="mt-1" />
          </div>
        ))}
      </section>

      <Toggle label="Piscine" checked={hasPool} onChange={handlePoolChange} />

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg italic text-paper">Emplacement</h2>
        <Input value={addressDraft} onChange={(e) => setAddressDraft(e.target.value)} label="Adresse" />
        <Button type="button" size="sm" variant="secondary" icon={<IconPin size={14} />} loading={geocoding} onClick={handleRelocate} className="self-start">
          Mettre a jour la position
        </Button>
        <MapView markers={[{ id: listing.id, lat: location.lat, lng: location.lng, title: listing.title }]} height={240} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg italic text-paper">Photos et videos</h2>
        <GalleryUploader folder={CLOUDINARY_FOLDERS.listingPhotos} values={photos} onChange={handlePhotosChange} max={20} />
        <GalleryUploader
          folder={CLOUDINARY_FOLDERS.listingVideos}
          values={videoClips}
          onChange={handleVideosChange}
          max={4}
          resourceType="video"
        />
      </section>

      <section>
        <PanoramaTourBuilder scenes={panoramaScenes} onChange={handleScenesChange} />
      </section>
    </div>
  );
}
