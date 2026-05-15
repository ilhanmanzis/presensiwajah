"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for Leaflet default icon issue in Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons
const createIcon = (color) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 0 4px rgba(0,0,0,0.4);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 20],
    popupAnchor: [0, -20]
  });
};

const schoolIcon = createIcon("#3b82f6"); // blue
const masukIcon = createIcon("#22c55e"); // green
const pulangIcon = createIcon("#f97316"); // orange

function FitBounds({ schoolPos, masuk, pulang, radius }) {
  const map = useMap();
  
  useEffect(() => {
    const bounds = L.latLngBounds([schoolPos]);
    
    if (masuk?.latitude && masuk?.longitude) {
      bounds.extend([masuk.latitude, masuk.longitude]);
    }
    if (pulang?.latitude && pulang?.longitude) {
      bounds.extend([pulang.latitude, pulang.longitude]);
    }

    // Extend bounds to cover the school radius (roughly 1 degree = ~111,000 meters)
    const radiusInDeg = radius / 111000;
    bounds.extend([schoolPos.lat + radiusInDeg, schoolPos.lng + radiusInDeg]);
    bounds.extend([schoolPos.lat - radiusInDeg, schoolPos.lng - radiusInDeg]);

    // Apply the bounds with padding
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
  }, [map, schoolPos, masuk, pulang, radius]);

  return null;
}

export default function MapDetail({ settings, masuk, pulang }) {
  const defaultPos = { lat: -6.200000, lng: 106.816666 };

  const schoolPos = settings ? { lat: settings.latitude, lng: settings.longitude } : defaultPos;
  const radius = settings ? settings.radius : 100;

  return (
    <div className="w-full h-full relative">
      <style jsx global>{`
        .leaflet-container {
          width: 100%;
          height: 100%;
          border-radius: inherit;
        }
      `}</style>
      <MapContainer center={schoolPos} zoom={16} scrollWheelZoom={true}>
        <FitBounds schoolPos={schoolPos} masuk={masuk} pulang={pulang} radius={radius} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Lokasi Sekolah */}
        <Marker position={schoolPos} icon={schoolIcon}>
          <Popup>Lokasi Sekolah</Popup>
        </Marker>
        <Circle
          center={schoolPos}
          pathOptions={{
            fillColor: '#3b82f6',
            color: '#2563eb',
            fillOpacity: 0.2,
            weight: 2
          }}
          radius={radius}
        />

        {/* Lokasi Masuk */}
        {masuk && masuk.latitude && masuk.longitude && (
          <Marker position={{ lat: masuk.latitude, lng: masuk.longitude }} icon={masukIcon}>
            <Popup>Presensi Masuk<br />{masuk.distance ? Math.floor(masuk.distance) : 0}m dari sekolah</Popup>
          </Marker>
        )}

        {/* Lokasi Pulang */}
        {pulang && pulang.latitude && pulang.longitude && (
          <Marker position={{ lat: pulang.latitude, lng: pulang.longitude }} icon={pulangIcon}>
            <Popup>Presensi Pulang<br />{pulang.distance ? Math.floor(pulang.distance) : 0}m dari sekolah</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
