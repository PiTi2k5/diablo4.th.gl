"use client";
import leaflet, { LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { createContext, useContext, useEffect, useRef, useState } from "react";

const MapContext = createContext<leaflet.Map | null>(null);

export const MAX_BOUNDS: LatLngBoundsExpression = [
  [194, -194],
  [-388, 388],
];

export function useMap() {
  const map = useContext(MapContext)!;
  if (!map) throw new Error("MapContext not found");
  return map;
}

export default function Map({ children }: { children?: React.ReactNode }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<leaflet.Map | null>(null);

  useEffect(() => {
    const map = leaflet.map(mapRef.current!, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 0,
      maxZoom: 8,
      zoomSnap: 0.5,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 120,
      crs: leaflet.CRS.Simple,
      maxBounds: MAX_BOUNDS,
    });

    map.setView([-100, 100], 3);
    setMap(map);

    return () => {
      map.remove();
    };
  }, []);

  return (
    <>
      <div ref={mapRef} className="h-full !bg-[#101010]" />
      <MapContext.Provider value={map}>{map && children}</MapContext.Provider>
    </>
  );
}
