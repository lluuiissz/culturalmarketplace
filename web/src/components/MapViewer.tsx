'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';

interface TownPreset {
  name: string;
  lat: number;
  lng: number;
}

const AGUSAN_TOWNS: TownPreset[] = [
  { name: 'San Francisco (Hub)', lat: 8.5085, lng: 125.9789 },
  { name: 'Prosperidad (Capital)', lat: 8.5833, lng: 125.9167 },
  { name: 'Bayugan City', lat: 8.7125, lng: 125.7483 },
  { name: 'Trento', lat: 8.0483, lng: 126.0642 },
  { name: 'Bunawan', lat: 8.2708, lng: 125.9917 },
  { name: 'Esperanza', lat: 8.6792, lng: 125.6514 },
  { name: 'Talacogon', lat: 8.4500, lng: 125.7833 },
  { name: 'Butuan City', lat: 8.9475, lng: 125.5406 },
];

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export default function MapViewer({
  lat,
  lng,
  locationName,
  height = '240px',
  allowPathfinding = true,
  artisanPhone,
}: {
  lat?: number | null;
  lng?: number | null;
  locationName?: string | null;
  height?: string;
  allowPathfinding?: boolean;
  artisanPhone?: string | null;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const routeLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userMarkerRef = useRef<any>(null);

  const hasCoords = typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
  const destLat = hasCoords ? lat! : 8.5085;
  const destLng = hasCoords ? lng! : 125.9789;

  // Pathfinding state
  const [locating, setLocating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [userPos, setUserPos] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; driveMins: number; walkMins: number } | null>(null);

  function toggleFullscreen() {
    setIsFullscreen((prev) => {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 150);
      return !prev;
    });
  }

  // Initialize base Leaflet map
  useEffect(() => {
    let isMounted = true;

    async function initViewer() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = await import('leaflet');
      if (!isMounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [destLat, destLng],
        zoom: hasCoords ? 14 : 11,
        zoomControl: true,
        dragging: true,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Custom Venue Pin
      const venueIcon = L.divIcon({
        className: 'custom-venue-pin',
        html: `
          <div style="transform: translate(-50%, -100%);">
            <div style="background-color: #15803d; color: white; width: 36px; height: 36px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.35); border: 2.5px solid white;">
              <span style="transform: rotate(45deg); font-size: 16px;">🏛️</span>
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      const marker = L.marker([destLat, destLng], { icon: venueIcon }).addTo(map);
      marker.bindPopup(`<b>${locationName || 'Workshop Venue'}</b><br/><span style="font-size:11px;color:#555">Workshop Destination</span>`).openPopup();

      mapInstanceRef.current = map;
    }

    initViewer();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [destLat, destLng, hasCoords, locationName]);

  // Compute & draw route path between User and Venue
  const drawRoute = useCallback(async (startLat: number, startLng: number, startLabel: string) => {
    if (!mapInstanceRef.current) return;
    const L = await import('leaflet');
    const map = mapInstanceRef.current;

    // Remove prior route line & user marker
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    // Add User Location Marker (Pulse Beacon)
    const userIcon = L.divIcon({
      className: 'custom-user-beacon',
      html: `
        <div style="position: relative; width: 26px; height: 26px; transform: translate(-50%, -50%);">
          <div style="position: absolute; width: 26px; height: 26px; border-radius: 50%; background: #2563eb; opacity: 0.35; animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="position: absolute; top: 4px; left: 4px; width: 18px; height: 18px; border-radius: 50%; background: #2563eb; border: 2.5px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>
        </div>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });

    const userMarker = L.marker([startLat, startLng], { icon: userIcon }).addTo(map);
    userMarker.bindPopup(`<b>${startLabel}</b><br/><span style="font-size:11px;color:#555">Starting Point</span>`);
    userMarkerRef.current = userMarker;

    // Fetch realistic road route from OpenStreetMap OSRM
    let routeCoords: Array<[number, number]> = [];
    let distKm = haversineDistanceKm(startLat, startLng, destLat, destLng);
    let driveTime = Math.max(2, Math.round((distKm / 35) * 60)); // ~35 km/h local average

    try {
      const osrmRes = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson`,
        { signal: AbortSignal.timeout(4500) }
      );
      if (osrmRes.ok) {
        const data = await osrmRes.json();
        if (data.routes && data.routes[0]) {
          const r = data.routes[0];
          routeCoords = r.geometry.coordinates.map(([lngPt, latPt]: [number, number]) => [latPt, lngPt]);
          distKm = Number((r.distance / 1000).toFixed(1));
          driveTime = Math.max(1, Math.round(r.duration / 60));
        }
      }
    } catch {
      // Offline fallback: direct straight geodetic polyline
      routeCoords = [
        [startLat, startLng],
        [destLat, destLng],
      ];
    }

    if (routeCoords.length === 0) {
      routeCoords = [
        [startLat, startLng],
        [destLat, destLng],
      ];
    }

    // Draw Route Polyline with shadow
    const polyline = L.polyline(routeCoords, {
      color: '#C5832B', // sacred ochre gold navigation route
      weight: 5,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    routeLayerRef.current = polyline;

    // Auto-fit both markers in view
    map.fitBounds(
      L.latLngBounds([
        [startLat, startLng],
        [destLat, destLng],
      ]),
      { padding: [40, 40], maxZoom: 16 }
    );

    const walkTime = Math.max(3, Math.round((distKm / 4.5) * 60));
    setRouteInfo({ distanceKm: distKm, driveMins: driveTime, walkMins: walkTime });
    setUserPos({ lat: startLat, lng: startLng, label: startLabel });
  }, [destLat, destLng]);

  // Request browser GPS position
  function handleLocateMe() {
    setErrorMsg('');
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser. Please select a starting town below.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        drawRoute(latitude, longitude, 'Your Current Location');
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setErrorMsg('Location access was denied. You can select your starting town from the list below.');
        } else {
          setErrorMsg('Unable to acquire GPS signal. Please select your nearest town from the list below.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }

  function handleSelectTown(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    if (!val) return;
    setErrorMsg('');
    const town = AGUSAN_TOWNS.find((t) => t.name === val);
    if (town) {
      drawRoute(town.lat, town.lng, town.name);
    }
  }

  function copyAddress() {
    if (locationName) {
      navigator.clipboard.writeText(locationName);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  // Google Maps & Waze Directions URLs
  const googleMapsNavUrl = userPos
    ? `https://www.google.com/maps/dir/?api=1&origin=${userPos.lat},${userPos.lng}&destination=${destLat},${destLng}&travelmode=driving`
    : `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;

  const wazeNavUrl = `https://waze.com/ul?ll=${destLat},${destLng}&navigate=yes`;

  return (
    <div className={isFullscreen ? "fixed inset-0 z-50 bg-white p-3 sm:p-6 overflow-y-auto flex flex-col space-y-3" : "space-y-3 rounded-xl border-2 border-ochre-300 bg-gradient-to-b from-ochre-50/20 to-white p-4 shadow-xs"}>
      {/* Venue Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/80 pb-2.5">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-charcoal-900">
            <span>🏛️ Workshop Venue:</span>
            <span className="font-semibold text-stone-800">{locationName || 'Pinned Studio Location'}</span>
          </div>
          <p className="text-[11px] text-stone-500">Agusan del Sur, Philippines</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {artisanPhone && (
            <a
              href={`tel:${artisanPhone}`}
              className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 border border-stone-200 hover:bg-stone-50 transition shadow-xs"
              title="Call studio for directions"
            >
              <span>📞</span>
              <span>Call</span>
            </a>
          )}

          {locationName && (
            <button
              type="button"
              onClick={copyAddress}
              className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-stone-700 border border-stone-200 hover:bg-stone-50 transition shadow-xs"
              title="Copy location address to clipboard"
            >
              <span>{copied ? '✓' : '📋'}</span>
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          )}

          <a
            href={googleMapsNavUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-charcoal-900 px-3 py-1 text-xs font-bold text-ochre-300 hover:bg-charcoal-800 border border-ochre-500/40 transition shadow-xs"
          >
            <span>🗺️</span>
            <span>Google Maps</span>
          </a>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-200 transition shadow-xs"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand full map view'}
          >
            <span>{isFullscreen ? '✕' : '⛶'}</span>
            <span>{isFullscreen ? 'Exit' : 'Expand'}</span>
          </button>
        </div>
      </div>

      {/* Pathfinding Controls (User Friendly Navigation Bar) */}
      {allowPathfinding && (
        <div className="rounded-lg bg-white p-3 border border-stone-200 shadow-xs space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1">
              <span>🧭</span>
              <span>Find Your Route to the Workshop:</span>
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleLocateMe}
                disabled={locating}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-50 transition shadow-xs"
              >
                <span>{locating ? '⏳' : '📍'}</span>
                <span>{locating ? 'Locating You…' : 'Locate Me & Draw Route'}</span>
              </button>

              <div className="flex items-center gap-1 text-xs text-stone-500">
                <span>or</span>
                <select
                  onChange={handleSelectTown}
                  defaultValue=""
                  className="input py-1 px-2 text-xs rounded-lg border-stone-300 bg-stone-50"
                >
                  <option value="" disabled>Start from town…</option>
                  {AGUSAN_TOWNS.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-ochre-900 bg-ochre-50 p-2 rounded border border-ochre-300 font-medium">
              ⚠️ {errorMsg}
            </p>
          )}

          {/* Real-time Route Statistics & Live Navigation Launchers */}
          {routeInfo && userPos && (
            <div className="mt-2 rounded-lg bg-ochre-50 p-3 border border-ochre-300 text-xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="font-bold text-charcoal-900 text-sm flex items-center gap-1">
                    <span>📏</span>
                    <span>{routeInfo.distanceKm} km away</span>
                  </div>
                  <span className="text-stone-400">·</span>
                  <div className="text-stone-700 flex items-center gap-1">
                    <span>🚗</span>
                    <span>~{routeInfo.driveMins} mins drive</span>
                  </div>
                  <span className="text-stone-400">·</span>
                  <div className="text-stone-700 flex items-center gap-1">
                    <span>🚶</span>
                    <span>~{routeInfo.walkMins} mins walk</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={googleMapsNavUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded bg-brand-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-brand-700 shadow-xs"
                  >
                    <span>🚗</span> Turn-by-Turn GPS
                  </a>
                  <a
                    href={wazeNavUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded bg-charcoal-900 border border-charcoal-800 px-2.5 py-1 text-xs font-bold text-white hover:bg-ochre-600 shadow-xs"
                  >
                    <span>🧭</span> Waze
                  </a>
                </div>
              </div>

              <p className="text-[11px] text-charcoal-800">
                Route path traced from <b>{userPos.label}</b> to <b>{locationName || 'Workshop Venue'}</b>. Click &ldquo;Turn-by-Turn GPS&rdquo; for live voice navigation on your phone.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Interactive Leaflet Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full rounded-lg border border-stone-200 shadow-inner z-0 overflow-hidden"
        style={{ height: isFullscreen ? '65vh' : height, minHeight: '180px' }}
      />
    </div>
  );
}
