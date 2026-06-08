"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

type Location = {
  animal_id: string;
  lat: number;
  lng: number;
  battery: number;
  created_at: string;
};

type LiveMapProps = {
  locations: Location[];
};

const ANIMAL_EMOJIS: Record<string, string> = {
  cow: "🐄",
  horse: "🐴",
  sheep: "🐑",
  goat: "🐐",
};

function getEmoji(animalId: string): string {
  const prefix = animalId.split("_")[0]?.toLowerCase() || "";
  return ANIMAL_EMOJIS[prefix] || "📍";
}

function createIcon(emoji: string) {
  return new L.DivIcon({
    html: `<span style="font-size:24px">${emoji}</span>`,
    className: "animal-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

export default function LiveMap({ locations }: LiveMapProps) {
  const center: [number, number] =
    locations.length > 0
      ? [locations[0].lat, locations[0].lng]
      : [52.287, 76.967];

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: "75vh", width: "100%", borderRadius: "16px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {locations.map((item) => {
        const position: [number, number] = [item.lat, item.lng];
        const emoji = getEmoji(item.animal_id);

        return (
          <Marker
            key={item.animal_id}
            position={position}
            icon={createIcon(emoji)}
          >
            <Popup>
              <strong>
                {emoji} {item.animal_id}
              </strong>
              <br />
              Battery: {item.battery}%
              <br />
              Last signal: {new Date(item.created_at).toLocaleString()}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}