"use client";

import { TABRIZ_CENTER, type LatLng } from "@/lib/home-visit/geo";
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";

function ClickHandler({ onPick }: { onPick: (next: LatLng) => void }) {
  useMapEvents({
    click(event) {
      onPick({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

function Recenter({ value }: { value: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (!value) return;
    map.setView([value.lat, value.lng], Math.max(map.getZoom(), 14));
  }, [map, value]);
  return null;
}

export default function LocationMapInner({
  value,
  onChange,
}: {
  value: LatLng | null;
  onChange: (next: LatLng) => void;
}) {
  const center = value || TABRIZ_CENTER;
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={value ? 14 : 12}
      className="z-0 h-56 w-full rounded-xl"
      style={{ height: 224, width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onChange} />
      <Recenter value={value} />
      {value ? (
        <CircleMarker
          center={[value.lat, value.lng]}
          radius={10}
          pathOptions={{ color: "#0f766e", fillColor: "#14b8a6", fillOpacity: 0.85 }}
        />
      ) : null}
    </MapContainer>
  );
}
