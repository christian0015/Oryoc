// components/panorama-capture.tsx
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useDeviceOrientation } from "@/lib/hooks";
import { GalleryUploader, SingleImageUploader } from "@/components/image-uploader";
import { CLOUDINARY_FOLDERS } from "@/lib/cloudinary-folders";
import { Button, Input, Modal, Select } from "@/components/ui";
import { IconPanorama360, IconPlus, IconTrash, IconCheck } from "@/components/icons";
import type { PanoramaScene, PanoramaLink } from "@/types";

const PanoramaViewer = dynamic(() => import("@/components/panorama-viewer").then((m) => m.PanoramaViewer), {
  ssr: false,
});

const SEGMENT_COUNT = 12; // 30 degree slices around the compass

/**
 * Live coverage ring: as the owner physically turns around with their
 * phone's native 360/panorama camera mode active, we highlight the
 * heading slices they've swept through so they know when they've gone
 * full circle before saving the stitched equirectangular photo.
 */
export function PanoramaCaptureGuide({ onCaptured }: { onCaptured: (imageUrl: string) => void }) {
  const { alpha, supported, permission, requestPermission } = useDeviceOrientation();
  const [visited, setVisited] = useState<Set<number>>(new Set());
  const [capturedUrl, setCapturedUrl] = useState<string | undefined>();

  useEffect(() => {
    if (alpha === null) return;
    const segment = Math.floor(((alpha % 360) / 360) * SEGMENT_COUNT);
    setVisited((prev) => (prev.has(segment) ? prev : new Set(prev).add(segment)));
  }, [alpha]);

  const coverage = Math.round((visited.size / SEGMENT_COUNT) * 100);

  return (
    <div className="flex flex-col items-center gap-5 rounded-[var(--radius-card)] border border-line bg-surface p-6 text-center">
      <p className="text-sm text-mist">
        Active le mode panorama de ton telephone, puis tourne lentement sur toi-meme a 360°. Cette jauge suit ta
        couverture.
      </p>

      {!supported ? (
        <p className="text-xs text-mist-dim">Capteur d&apos;orientation non disponible sur cet appareil.</p>
      ) : permission !== "granted" ? (
        <Button type="button" variant="secondary" onClick={requestPermission}>
          Activer le capteur de rotation
        </Button>
      ) : (
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle cx="90" cy="90" r="78" fill="none" stroke="var(--color-line)" strokeWidth="10" />
          {Array.from({ length: SEGMENT_COUNT }).map((_, i) => {
            const angle = (i / SEGMENT_COUNT) * 2 * Math.PI - Math.PI / 2;
            const x1 = 90 + 68 * Math.cos(angle);
            const y1 = 90 + 68 * Math.sin(angle);
            const x2 = 90 + 88 * Math.cos(angle);
            const y2 = 90 + 88 * Math.sin(angle);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={visited.has(i) ? "var(--color-brass)" : "var(--color-line)"}
                strokeWidth="6"
                strokeLinecap="round"
              />
            );
          })}
          <text x="90" y="96" textAnchor="middle" className="font-display italic" fill="var(--color-paper)" fontSize="26">
            {coverage}%
          </text>
        </svg>
      )}

      {coverage >= 80 && (
        <p className="inline-flex items-center gap-1.5 text-xs text-zellige-bright">
          <IconCheck size={14} /> Couverture suffisante — tu peux importer ta photo 360
        </p>
      )}

      <SingleImageUploader
        folder={CLOUDINARY_FOLDERS.panoramaScenes}
        value={capturedUrl}
        onChange={(url) => {
          setCapturedUrl(url);
          if (url) onCaptured(url);
        }}
        size={72}
        label="Photo 360 (equirectangulaire) stitchee par ton appareil"
      />
    </div>
  );
}

/** Full 360 tour builder: add scenes, name them, and link hotspots between
 * them by clicking directly on the sphere in placement mode. */
export function PanoramaTourBuilder({
  scenes,
  onChange,
}: {
  scenes: PanoramaScene[];
  onChange: (scenes: PanoramaScene[]) => void;
}) {
  const [showGuide, setShowGuide] = useState(false);
  const [pendingName, setPendingName] = useState("");
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [previewSceneId, setPreviewSceneId] = useState<string | null>(null);
  const [linking, setLinking] = useState<{ sourceSceneId: string; marker: { yaw: number; pitch: number } | null } | null>(
    null
  );
  const [linkTarget, setLinkTarget] = useState<string>("");

  function addCapturedScene() {
    if (!pendingUrl || !pendingName.trim()) return;
    const id = `scene-${Date.now()}`;
    onChange([...scenes, { id, name: pendingName.trim(), imageUrl: pendingUrl, links: [] }]);
    setPendingUrl(null);
    setPendingName("");
    setShowGuide(false);
  }

  function removeScene(id: string) {
    onChange(
      scenes
        .filter((s) => s.id !== id)
        .map((s) => ({ ...s, links: s.links.filter((l) => l.targetSceneId !== id) }))
    );
  }

  function confirmLink() {
    if (!linking?.marker || !linkTarget) return;
    const newLink: PanoramaLink = {
      targetSceneId: linkTarget,
      hotspotYaw: linking.marker.yaw,
      hotspotPitch: linking.marker.pitch,
    };
    onChange(
      scenes.map((s) => (s.id === linking.sourceSceneId ? { ...s, links: [...s.links, newLink] } : s))
    );
    setLinking(null);
    setLinkTarget("");
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h3 className="inline-flex items-center gap-2 font-display text-lg italic text-paper">
          <IconPanorama360 size={18} className="text-zellige-bright" />
          Visite 360
        </h3>
        <Button type="button" size="sm" variant="secondary" icon={<IconPlus size={14} />} onClick={() => setShowGuide(true)}>
          Ajouter une piece
        </Button>
      </div>

      {scenes.length === 0 && (
        <p className="text-sm text-mist-dim">Aucune scene pour l&apos;instant — ajoute la premiere piece de la visite.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {scenes.map((scene) => (
          <motion.div
            key={scene.id}
            layout
            className="overflow-hidden rounded-[var(--radius-control)] border border-line bg-surface-raised"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={scene.imageUrl} alt={scene.name} className="h-28 w-full object-cover" />
            <div className="flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-medium text-paper">{scene.name}</p>
                <p className="text-xs text-mist-dim">{scene.links.length} lien(s)</p>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setPreviewSceneId(scene.id)}
                  className="rounded-full px-2.5 py-1 text-xs text-mist hover:bg-surface hover:text-paper"
                >
                  Apercu
                </button>
                {scenes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setLinking({ sourceSceneId: scene.id, marker: null })}
                    className="rounded-full px-2.5 py-1 text-xs text-mist hover:bg-surface hover:text-paper"
                  >
                    Lier
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeScene(scene.id)}
                  aria-label="Supprimer"
                  className="rounded-full p-1.5 text-mist hover:bg-surface hover:text-alert-bright"
                >
                  <IconTrash size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Modal open={showGuide} onClose={() => setShowGuide(false)} title="Nouvelle piece" maxWidth="max-w-lg">
        <div className="flex flex-col gap-4">
          <Input label="Nom de la piece" value={pendingName} onChange={(e) => setPendingName(e.target.value)} placeholder="Salon, Chambre 1..." />
          <PanoramaCaptureGuide onCaptured={setPendingUrl} />
          <Button type="button" disabled={!pendingUrl || !pendingName.trim()} onClick={addCapturedScene}>
            Ajouter cette scene
          </Button>
        </div>
      </Modal>

      {previewSceneId && (
        <PanoramaViewer scenes={scenes} onClose={() => setPreviewSceneId(null)} />
      )}

      {linking && (
        <div className="fixed inset-0 z-[200]">
          <PanoramaViewer
            scenes={[scenes.find((s) => s.id === linking.sourceSceneId)!]}
            placementMode
            pendingMarker={linking.marker}
            onPlacementPick={(yawPitch) => setLinking({ ...linking, marker: yawPitch })}
            onClose={() => setLinking(null)}
          />
          {linking.marker && (
            <div className="absolute inset-x-0 bottom-24 z-10 flex justify-center px-4">
              <div className="flex items-center gap-3 rounded-[var(--radius-pill)] border border-line-soft bg-surface p-2 pl-4 shadow-xl">
                <span className="text-sm text-paper">Mene vers :</span>
                <Select value={linkTarget} onChange={(e) => setLinkTarget(e.target.value)} className="!py-1.5">
                  <option value="">Choisir...</option>
                  {scenes
                    .filter((s) => s.id !== linking.sourceSceneId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </Select>
                <Button type="button" size="sm" disabled={!linkTarget} onClick={confirmLink}>
                  Valider
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
