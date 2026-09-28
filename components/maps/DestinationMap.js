"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  APIProvider,
  Map,
  Marker,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";
import { Star, MapPin, ExternalLink, AlertCircle, Compass } from "lucide-react";

/**
 * Helper component inside APIProvider that auto-fits map bounds to all visible markers
 */
function MapBoundsFitter({ destinations }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !destinations || destinations.length === 0) return;

    if (typeof window !== "undefined" && window.google && window.google.maps) {
      const bounds = new window.google.maps.LatLngBounds();
      let hasValidCoords = false;

      destinations.forEach((dest) => {
        const lat = Number(dest.latitude);
        const lng = Number(dest.longitude);
        if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
          bounds.extend({ lat, lng });
          hasValidCoords = true;
        }
      });

      if (hasValidCoords) {
        map.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
      }
    }
  }, [map, destinations]);

  return null;
}

export default function DestinationMap({
  destinations = [],
  selectedDestinationId = null,
  onSelectDestination = () => {},
  className = "h-[500px] w-full rounded-2xl overflow-hidden shadow-xl border border-gray-100",
  mapId = undefined,
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const [selectedDest, setSelectedDest] = useState(null);
  const [mapError, setMapError] = useState(false);

  // Catch Google Maps authentication failures (invalid/unbilled API keys, domain restrictions)
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!apiKey || apiKey.trim() === "") {
        console.warn("[DestinationMap] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing or empty at build/runtime. Fallback preview displayed.");
      } else {
        console.log("[DestinationMap] Google Maps Key is present (length:", apiKey.length, ")");
      }

      window.gm_authFailure = () => {
        console.warn("[DestinationMap] Google Maps API Key Authentication Failed (gm_authFailure). Verify Google Cloud HTTP referrer restrictions, billing, and Maps JS API enablement.");
        setMapError(true);
      };
    }
  }, [apiKey]);

  // Filter valid destinations with coordinates
  const validDestinations = (destinations || []).filter((dest) => {
    const lat = Number(dest?.latitude);
    const lng = Number(dest?.longitude);
    return !isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0);
  });

  // Sync external selection prop
  useEffect(() => {
    if (selectedDestinationId) {
      const matched = validDestinations.find(
        (d) => (d._id || d.id) === selectedDestinationId
      );
      if (matched) {
        setSelectedDest(matched);
      }
    }
  }, [selectedDestinationId, validDestinations]);

  // Default fallback center (India / Global overview)
  const defaultCenter = { lat: 20.5937, lng: 78.9629 };
  const defaultZoom = 4;

  // Fallback UI when Google Maps API key is missing or authentication failed
  if (!apiKey || apiKey.trim() === "" || mapError) {
    return (
      <div className={`${className} bg-slate-900 text-white flex flex-col justify-center items-center p-6 text-center relative overflow-hidden group`}>
        <div className="absolute inset-0 bg-gradient-to-br from-coral-500/10 via-teal-500/10 to-transparent pointer-events-none" />
        <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-4 text-coral-400 shadow-lg">
          <MapPin size={28} />
        </div>
        <h3 className="text-xl font-bold tracking-tight mb-2 text-white">
          Destination Map Preview
        </h3>
        <p className="text-slate-300 text-sm max-w-md mb-6 leading-relaxed">
          Interactive map is temporarily unavailable. You can still explore all mapped destinations and their coordinates.
        </p>

        <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4 w-full max-w-md text-left text-xs space-y-2 mb-6">
          <div className="flex items-center justify-between text-slate-400 font-medium pb-2 border-b border-slate-700">
            <span>Mapped Destinations ({validDestinations.length})</span>
            <span>Coordinates Ready</span>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {validDestinations.map((d) => (
              <div key={d._id || d.id} className="flex justify-between items-center text-slate-300 py-1">
                <span className="font-semibold text-white truncate max-w-[180px]">{d.name}, {d.country}</span>
                <span className="font-mono text-slate-400 text-[10px]">
                  {d.latitude.toFixed(2)}, {d.longitude.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/40 px-3 py-1.5 rounded-full border border-slate-700/50">
          <Compass size={14} className="text-coral-400" />
          <span>Map preview available</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} relative`}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={defaultZoom}
          gestureHandling="greedy"
          disableDefaultUI={false}
          className="w-full h-full rounded-2xl"
          mapId={mapId}
        >
          {/* Fit map bounds dynamically to markers */}
          <MapBoundsFitter destinations={validDestinations} />

          {/* Render Markers for each valid destination */}
          {validDestinations.map((dest) => {
            const isSelected = selectedDest && (selectedDest._id || selectedDest.id) === (dest._id || dest.id);
            return (
              <Marker
                key={dest._id || dest.id}
                position={{ lat: Number(dest.latitude), lng: Number(dest.longitude) }}
                title={`${dest.name}, ${dest.country}`}
                onClick={() => {
                  setSelectedDest(dest);
                  onSelectDestination(dest);
                }}
              />
            );
          })}

          {/* Info Window for Active Selection */}
          {selectedDest && (
            <InfoWindow
              position={{
                lat: Number(selectedDest.latitude),
                lng: Number(selectedDest.longitude),
              }}
              onCloseClick={() => setSelectedDest(null)}
            >
              <div className="p-1 max-w-[220px] font-sans text-slate-800">
                {selectedDest.image && (
                  <div className="relative h-28 w-full rounded-lg overflow-hidden mb-2 bg-slate-100">
                    <img
                      src={selectedDest.image}
                      alt={selectedDest.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1">
                      <Star size={10} className="fill-amber-400 text-amber-400" />
                      {selectedDest.rating || 4.8}
                    </div>
                  </div>
                )}
                
                <h4 className="font-bold text-sm text-slate-900 line-clamp-1 mb-0.5">
                  {selectedDest.name}
                </h4>
                <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                  <MapPin size={11} className="text-coral-500 shrink-0" />
                  {selectedDest.country}
                </p>

                <div className="flex items-center justify-end pt-2 border-t border-slate-100 mt-2">
                  <Link
                    href={`/destinations/${selectedDest.slug || selectedDest._id}`}
                    className="inline-flex items-center gap-1 bg-coral-500 hover:bg-coral-600 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors shadow-sm"
                  >
                    <span>View</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}
