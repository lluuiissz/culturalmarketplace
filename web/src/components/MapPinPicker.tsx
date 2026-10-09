'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

export interface LocationData {
  lat: number;
  lng: number;
  locationName: string;
}

const AGUSAN_PRESETS = [
  { name: 'Bunawan (Center)', lat: 8.1752, lng: 125.9934 },
  { name: 'San Francisco', lat: 8.5056, lng: 125.9788 },
  { name: 'Prosperidad', lat: 8.6019, lng: 125.9189 },
  { name: 'Bayugan City', lat: 8.7497, lng: 125.7483 },
  { name: 'Trento', lat: 8.0463, lng: 126.0641 },
  { name: 'Talacogon', lat: 8.4526, lng: 125.7925 },
  { name: 'Esperanza', lat: 8.6750, lng: 125.6500 },
];

export default function MapPinPicker({
  initialLat,
  initialLng,
  initialLocation,
  onChange,
}: {
  initialLat?: number | null;
  initialLng?: number | null;
  initialLocation?: string | null;
  onChange: (loc: LocationData) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);

  const defaultLat = initialLat ?? 8.1752;
  const defaultLng = initialLng ?? 125.9934;

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: defaultLat,
    lng: defaultLng,
  });
  const [venueName, setVenueName] = useState(initialLocation ?? '');
  const [geolocating, setGeolocating] = useState(false);
  const [reverseLoading, setReverseLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = await import('leaflet');

      if (!isMounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [coords.lat, coords.lng],
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Custom artisanal pin SVG
      const customPin = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="transform: translate(-50%, -100%);">
            <div style="background-color: #b4651e; color: white; width: 36px; height: 36px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid white;">
              <span style="transform: rotate(45deg); font-size: 16px;">📍</span>
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      const marker = L.marker([coords.lat, coords.lng], {
        icon: customPin,
        draggable: true,
      }).addTo(map);

      async function fetchReverseGeocode(lat: number, lng: number) {
        try {
          setReverseLoading(true);
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
            headers: { 'Accept-Language': 'en' },
          });
          if (res.ok) {
            const data = await res.json();
            const addr = data.display_name || '';
            if (addr) {
              setVenueName((prev) => (prev ? prev : addr));
              onChange({ lat, lng, locationName: venueName || addr });
            }
          }
        } catch {
          // ignore network failure for reverse geocode
        } finally {
          setReverseLoading(false);
        }
      }

      function updatePosition(newLat: number, newLng: number, fetchAddress = false) {
        setCoords({ lat: newLat, lng: newLng });
        onChange({ lat: newLat, lng: newLng, locationName: venueName });
        if (fetchAddress) {
          fetchReverseGeocode(newLat, newLng);
        }
      }

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        updatePosition(pos.lat, pos.lng, true);
      });

      map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        updatePosition(lat, lng, true);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePresetChange(presetIndex: number) {
    const p = AGUSAN_PRESETS[presetIndex];
    if (!p) return;
    setCoords({ lat: p.lat, lng: p.lng });
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([p.lat, p.lng], 14);
      markerRef.current.setLatLng([p.lat, p.lng]);
    }
    onChange({ lat: p.lat, lng: p.lng, locationName: venueName || p.name });
  }

  function handleLocateMe() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeolocating(false);
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([lat, lng], 15);
          markerRef.current.setLatLng([lat, lng]);
        }
        onChange({ lat, lng, locationName: venueName });
      },
      () => {
        setGeolocating(false);
        alert('Could not determine your location. Please check browser permissions or pin manually.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-brand-200 bg-brand-50/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-semibold text-brand-900">
          📍 Workshop Venue & Pinned Location
        </label>
        <div className="flex items-center gap-2">
          <select
            className="input w-48 text-xs py-1"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value !== '') handlePresetChange(Number(e.target.value));
            }}
          >
            <option value="" disabled>Center on Municipality…</option>
            {AGUSAN_PRESETS.map((p, i) => (
              <option key={p.name} value={i}>{p.name}</option>
            ))}
          </select>
          <button
            type="button"
            className="btn-outline px-2.5 py-1 text-xs"
            onClick={handleLocateMe}
            disabled={geolocating}
          >
            {geolocating ? 'Locating…' : '🎯 Pin My Current Location'}
          </button>
        </div>
      </div>

      <p className="text-xs text-stone-500">
        Click or drag the pin anywhere on the map to mark the exact workshop venue. Attendees will see this location and can open directions on Google Maps.
      </p>

      {/* Map Element */}
      <div
        ref={mapContainerRef}
        className="h-64 w-full rounded-lg border border-stone-300 shadow-inner z-0"
        style={{ minHeight: '260px' }}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-700">
            Venue / Landmark Name {reverseLoading && <span className="text-brand-600">(Finding address…)</span>}
          </label>
          <input
            className="input"
            placeholder="e.g. Purok 3, San Teodoro, Bunawan, Agusan del Sur"
            value={venueName}
            onChange={(e) => {
              const val = e.target.value;
              setVenueName(val);
              onChange({ lat: coords.lat, lng: coords.lng, locationName: val });
            }}
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-stone-500 pt-5">
          <span className="rounded bg-white px-2 py-1.5 border border-stone-200 font-mono">
            Lat: {coords.lat.toFixed(5)}
          </span>
          <span className="rounded bg-white px-2 py-1.5 border border-stone-200 font-mono">
            Lng: {coords.lng.toFixed(5)}
          </span>
        </div>
      </div>
    </div>
  );
}
