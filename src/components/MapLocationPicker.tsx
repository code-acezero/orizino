import React, { useState, useCallback, useRef, useEffect } from "react";
import { MapPin, Search, Crosshair, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MapLocationPickerProps {
  lat?: number;
  lng?: number;
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  className?: string;
}

const DEFAULT_LAT = 23.8103;
const DEFAULT_LNG = 90.4125;

const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  lat = DEFAULT_LAT,
  lng = DEFAULT_LNG,
  onLocationSelect,
  className = "",
}) => {
  const [position, setPosition] = useState({ lat, lng });
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [address, setAddress] = useState("");
  const mapRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  // Reverse geocode
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`);
      const data = await res.json();
      if (data?.display_name) {
        setAddress(data.display_name);
        return data.display_name;
      }
    } catch {
      // silent
    }
    return undefined;
  }, []);

  // Forward geocode (search)
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`);
      const data = await res.json();
      if (data?.[0]) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);
        setPosition({ lat: newLat, lng: newLng });
        setAddress(data[0].display_name || "");
        onLocationSelect(newLat, newLng, data[0].display_name);
      }
    } catch {
      // silent
    }
    setSearching(false);
  }, [searchQuery, onLocationSelect]);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        setPosition({ lat: newLat, lng: newLng });
        const addr = await reverseGeocode(newLat, newLng);
        onLocationSelect(newLat, newLng, addr);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true }
    );
  }, [onLocationSelect, reverseGeocode]);

  // Handle map click via embedded OpenStreetMap tile
  const handleMapClick = useCallback(async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert pixel to approx lat/lng offset (zoom ~14, rough)
    const zoom = 14;
    const scale = 256 * Math.pow(2, zoom);
    const lonPerPx = 360 / scale;
    const latPerPx = 360 / scale * Math.cos(position.lat * Math.PI / 180);
    
    const offsetX = x - rect.width / 2;
    const offsetY = y - rect.height / 2;
    
    const newLng = position.lng + offsetX * lonPerPx;
    const newLat = position.lat - offsetY * latPerPx;
    
    setPosition({ lat: newLat, lng: newLng });
    const addr = await reverseGeocode(newLat, newLng);
    onLocationSelect(newLat, newLng, addr);
  }, [position, onLocationSelect, reverseGeocode]);

  // Build tile URL
  const zoom = 14;
  const tileUrl = `https://tile.openstreetmap.org/${zoom}/${Math.floor((position.lng + 180) / 360 * Math.pow(2, zoom))}/${Math.floor((1 - Math.log(Math.tan(position.lat * Math.PI / 180) + 1 / Math.cos(position.lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))}.png`;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search location..."
            className="pl-9 rounded-xl"
          />
        </div>
        <Button variant="outline" size="icon" onClick={handleSearch} disabled={searching} className="rounded-xl">
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
        <Button variant="outline" size="icon" onClick={getCurrentLocation} disabled={locating} className="rounded-xl" title="Use my location">
          {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
        </Button>
      </div>

      {/* Map display */}
      <div
        ref={mapRef}
        onClick={handleMapClick}
        className="relative w-full h-48 rounded-xl overflow-hidden border border-border cursor-crosshair bg-secondary/20"
      >
        <img
          src={`https://staticmap.openstreetmap.de/staticmap.php?center=${position.lat},${position.lng}&zoom=${zoom}&size=600x240&maptype=mapnik&markers=${position.lat},${position.lng},red-pushpin`}
          alt="Map"
          className="w-full h-full object-cover"
          draggable={false}
        />
        {/* Center pin overlay */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none">
          <MapPin className="w-8 h-8 text-destructive drop-shadow-lg" fill="currentColor" />
        </div>
      </div>

      {/* Selected coordinates & address */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <div>
          <p className="font-mono">{position.lat.toFixed(6)}, {position.lng.toFixed(6)}</p>
          {address && <p className="text-foreground mt-0.5 line-clamp-2">{address}</p>}
        </div>
      </div>
    </div>
  );
};

export default MapLocationPicker;
