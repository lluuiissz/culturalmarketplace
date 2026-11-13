'use client';

import dynamic from 'next/dynamic';

const MapViewer = dynamic(() => import('@/components/MapViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[96px] w-full items-center justify-center rounded-md border border-stone-200 bg-stone-100 text-xs text-stone-400">
      🗺️
    </div>
  ),
});

export default function ExperienceMap({
  lat,
  lng,
  locationName,
  artisanPhone,
  compact = false,
}: {
  lat?: number | null;
  lng?: number | null;
  locationName?: string | null;
  artisanPhone?: string | null;
  compact?: boolean;
}) {
  if (compact) {
    // Forces whatever MapViewer renders to fill the small box
    return (
      <div className="h-full w-full overflow-hidden [&>*]:!h-full [&>*]:!w-full [&_.leaflet-container]:!h-full">
        <MapViewer lat={lat} lng={lng} locationName={locationName} artisanPhone={artisanPhone} />
      </div>
    );
  }
  return <MapViewer lat={lat} lng={lng} locationName={locationName} artisanPhone={artisanPhone} />;
}