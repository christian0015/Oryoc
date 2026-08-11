// components/panorama-viewer.tsx
"use client";

import { Suspense, useMemo, useState } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { TextureLoader, BackSide } from "three";
import { AnimatePresence, motion } from "framer-motion";
import type { PanoramaScene } from "@/types";
import { IconClose, IconChevronRight } from "@/components/icons";

const SPHERE_RADIUS = 500;
const HOTSPOT_RADIUS = 480;

function yawPitchToPosition(yawDeg: number, pitchDeg: number, radius: number): [number, number, number] {
  const yaw = (yawDeg * Math.PI) / 180;
  const pitch = (pitchDeg * Math.PI) / 180;
  const x = radius * Math.cos(pitch) * Math.sin(yaw);
  const y = radius * Math.sin(pitch);
  const z = -radius * Math.cos(pitch) * Math.cos(yaw);
  return [x, y, z];
}

function positionToYawPitch(x: number, y: number, z: number): { yaw: number; pitch: number } {
  const radius = Math.sqrt(x * x + y * y + z * z) || 1;
  const pitch = Math.asin(y / radius);
  const yaw = Math.atan2(x, -z);
  return { yaw: (yaw * 180) / Math.PI, pitch: (pitch * 180) / Math.PI };
}

function SphereScene({
  imageUrl,
  onSurfaceClick,
}: {
  imageUrl: string;
  onSurfaceClick?: (yawPitch: { yaw: number; pitch: number }) => void;
}) {
  const texture = useLoader(TextureLoader, imageUrl);
  return (
    <mesh
      scale={[-1, 1, 1]}
      onClick={
        onSurfaceClick
          ? (e) => {
              e.stopPropagation();
              onSurfaceClick(positionToYawPitch(e.point.x, e.point.y, e.point.z));
            }
          : undefined
      }
    >
      <sphereGeometry args={[SPHERE_RADIUS, 64, 48]} />
      <meshBasicMaterial map={texture} side={BackSide} toneMapped={false} />
    </mesh>
  );
}

function PlacementMarker({ yaw, pitch }: { yaw: number; pitch: number }) {
  const position = useMemo(() => yawPitchToPosition(yaw, pitch, HOTSPOT_RADIUS), [yaw, pitch]);
  return (
    <Html position={position} center distanceFactor={260}>
      <span className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-brass bg-brass/40" />
    </Html>
  );
}

function Hotspot({
  yaw,
  pitch,
  label,
  onClick,
}: {
  yaw: number;
  pitch: number;
  label: string;
  onClick: () => void;
}) {
  const position = useMemo(() => yawPitchToPosition(yaw, pitch, HOTSPOT_RADIUS), [yaw, pitch]);
  return (
    <Html position={position} center distanceFactor={260} zIndexRange={[10, 0]}>
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-1.5 rounded-full border border-brass/70 bg-ink/80 px-3 py-1.5 text-xs text-paper backdrop-blur-sm transition-transform hover:scale-105"
      >
        <span className="h-2 w-2 animate-pulse rounded-full bg-brass" />
        {label}
        <IconChevronRight size={12} />
      </button>
    </Html>
  );
}

export function PanoramaViewer({
  scenes,
  onClose,
  fullscreen = true,
  placementMode = false,
  onPlacementPick,
  pendingMarker,
}: {
  scenes: PanoramaScene[];
  onClose?: () => void;
  fullscreen?: boolean;
  placementMode?: boolean;
  onPlacementPick?: (yawPitch: { yaw: number; pitch: number }) => void;
  pendingMarker?: { yaw: number; pitch: number } | null;
}) {
  const [currentSceneId, setCurrentSceneId] = useState(scenes[0]?.id);
  const currentScene = scenes.find((s) => s.id === currentSceneId) ?? scenes[0];

  if (!currentScene) return null;

  const container = (
    <div className="relative h-full w-full bg-ink">
      <Canvas camera={{ fov: 75, position: [0, 0, 0.1] }}>
        <Suspense fallback={null}>
          <AnimatePresence mode="wait">
            <SphereScene
              key={currentScene.id}
              imageUrl={currentScene.imageUrl}
              onSurfaceClick={placementMode ? onPlacementPick : undefined}
            />
          </AnimatePresence>
          {pendingMarker && <PlacementMarker yaw={pendingMarker.yaw} pitch={pendingMarker.pitch} />}
          {!placementMode &&
            currentScene.links.map((link, i) => {
              const target = scenes.find((s) => s.id === link.targetSceneId);
              if (!target) return null;
              return (
                <Hotspot
                  key={i}
                  yaw={link.hotspotYaw}
                  pitch={link.hotspotPitch}
                  label={target.name}
                  onClick={() => setCurrentSceneId(target.id)}
                />
              );
            })}
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={-0.35} autoRotate={false} />
      </Canvas>

      {placementMode && (
        <div className="pointer-events-none absolute inset-x-0 top-16 flex justify-center">
          <span className="rounded-full border border-brass/60 bg-ink/80 px-4 py-2 text-xs text-paper backdrop-blur-sm">
            Clique sur l&apos;endroit qui mene vers une autre piece
          </span>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-5">
        <span className="pointer-events-auto rounded-full border border-line-soft bg-ink/70 px-3 py-1.5 text-xs text-paper backdrop-blur-sm">
          {currentScene.name}
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la visite"
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-ink/70 text-paper backdrop-blur-sm hover:bg-ink"
          >
            <IconClose size={16} />
          </button>
        )}
      </div>

      {!placementMode && scenes.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-5">
          <div className="pointer-events-auto flex gap-2 rounded-full border border-line-soft bg-ink/70 p-1.5 backdrop-blur-sm">
            {scenes.map((s) => (
              <button
                key={s.id}
                onClick={() => setCurrentSceneId(s.id)}
                className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                  s.id === currentScene.id ? "bg-brass text-ink" : "text-mist hover:text-paper"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (!fullscreen) return <div className="h-full w-full overflow-hidden rounded-[var(--radius-card)]">{container}</div>;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200]"
      >
        {container}
      </motion.div>
    </AnimatePresence>
  );
}
