'use client';

import dynamic from 'next/dynamic';

const MapViewer = dynamic(() => import('@/components/MapViewer'), {
  ssr: false,
  loading: () => (
    <div className="h-44 w-full rounded-md border border-stone-200 bg-stone-100 flex items-center justify-center text-xs text-stone-400">
      🗺️ Loading workshop venue map…
    </div>
  ),
});

export default function ExperienceMap({
  lat,
  lng,
  locationName,
  artisanPhone,
}: {
  lat?: number | null;
  lng?: number | null;
  locationName?: string | null;
  artisanPhone?: string | null;
}) {
  return <MapViewer lat={lat} lng={lng} locationName={locationName} artisanPhone={artisanPhone} />;
}
