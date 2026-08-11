// components/map-view.tsx
"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";

const pinIcon = new L.DivIcon({
  className: "",
  html: `<svg width="30" height="38" viewBox="0 0 24 24" fill="#c9a15a" stroke="#0b0d0e" stroke-width="1"><path d="M12 22s7-7.2 7-12.5A7 7 0 0 0 5 9.5C5 14.8 12 22 12 22Z"/><circle cx="12" cy="9.5" r="2.6" fill="#0b0d0e"/></svg>`,
  iconSize: [30, 38],
  iconAnchor: [15, 36],
  popupAnchor: [0, -34],
});

export interface MapMarkerData {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  href?: string;
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useMemo(() => {
    map.setView([lat, lng], map.getZoom());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);
  return null;
}

export function MapView({
  markers,
  center,
  zoom = 13,
  height = 360,
}: {
  markers: MapMarkerData[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: number;
}) {
  const fallbackCenter = center ?? markers[0] ?? { lat: 33.5731, lng: -7.5898 }; // Casablanca

  return (
    <div className="map-view-container border border-line" style={{ height }}>
      <MapContainer
        center={[fallbackCenter.lat, fallbackCenter.lng]}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {center && <Recenter lat={center.lat} lng={center.lng} />}
        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={pinIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-medium">{m.title}</p>
                {m.subtitle && <p className="text-xs text-mist-dim">{m.subtitle}</p>}
                {m.href && (
                  <Link href={m.href} className="text-brass">
                    Voir l&apos;annonce
                  </Link>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
