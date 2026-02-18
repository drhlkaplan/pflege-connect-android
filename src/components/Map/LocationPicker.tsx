import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, LocateFixed } from "lucide-react";
import { GERMAN_CITIES } from "@/lib/germanCities";

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const selectedIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  city: string;
  onLocationChange: (lat: number, lng: number, city: string) => void;
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 12, { duration: 1 });
  }, [lat, lng, map]);
  return null;
}

export function LocationPicker({ latitude, longitude, city, onLocationChange }: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState(city || "");
  const [searchResults, setSearchResults] = useState<typeof GERMAN_CITIES>([]);
  const [showResults, setShowResults] = useState(false);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    const filtered = GERMAN_CITIES.filter((c) =>
      c.name.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filtered);
    setShowResults(filtered.length > 0);
  }, []);

  const selectCity = (c: typeof GERMAN_CITIES[0]) => {
    setSearchQuery(c.name);
    setShowResults(false);
    setFlyTarget({ lat: c.latitude, lng: c.longitude });
    onLocationChange(c.latitude, c.longitude, c.name);
  };

  const handleMapClick = (lat: number, lng: number) => {
    // Find nearest city
    let nearest = GERMAN_CITIES[0];
    let minDist = Infinity;
    for (const c of GERMAN_CITIES) {
      const d = Math.sqrt(Math.pow(c.latitude - lat, 2) + Math.pow(c.longitude - lng, 2));
      if (d < minDist) {
        minDist = d;
        nearest = c;
      }
    }
    const cityName = minDist < 0.5 ? nearest.name : "";
    onLocationChange(lat, lng, cityName);
    setSearchQuery(cityName);
  };

  const centerLat = latitude || 51.1657;
  const centerLng = longitude || 10.4515;
  const zoom = latitude ? 10 : 6;

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowResults(searchResults.length > 0)}
              placeholder="Şehir ara..."
              className="pl-9"
            />
          </div>
        </div>
        {showResults && (
          <div className="absolute z-[1000] mt-1 w-full bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
            {searchResults.map((c) => (
              <button
                key={c.name}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                onClick={() => selectCity(c)}
              >
                <MapPin className="w-3 h-3 text-muted-foreground" />
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="rounded-lg overflow-hidden border" style={{ height: "280px" }}>
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={zoom}
          className="h-full w-full"
          style={{ height: "280px" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onMapClick={handleMapClick} />
          {flyTarget && <FlyTo lat={flyTarget.lat} lng={flyTarget.lng} />}
          {latitude && longitude && (
            <Marker position={[latitude, longitude]} icon={selectedIcon} />
          )}
        </MapContainer>
      </div>

      {latitude && longitude && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <LocateFixed className="w-3 h-3" />
          {city ? `${city} • ` : ""}
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </p>
      )}
    </div>
  );
}
