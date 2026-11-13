import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getArtisan } from '@/lib/db';
import ProfileForm from './ProfileForm';
import ProfileHeader from './ProfileHeader';

export const dynamic = 'force-dynamic';

export default async function ArtisanProfilePage() {
  const session = await getSession();

  if (!session || session.role !== 'artisan') {
    redirect('/auth/login?next=/artisan/profile');
  }

  const artisan = await getArtisan(session.id);

  const artisanName = artisan?.name ?? session.name;
  const businessName = artisan?.business_name || 'Your Handicrafts';

  return (
    <main className="min-h-screen bg-[#FCF9F4]">
      {/* PROFILE HEADER (client component with working upload) */}
      <ProfileHeader
        artisanId={session.id}
        name={artisanName}
        businessName={businessName}
        profilePicture={artisan?.profile_picture ?? null}
      />

      {/* PROFILE DIVIDER */}
      {/* PROFILE DIVIDER */}
<div className="h-px w-full bg-gray-300" />

      {/* PROFILE FORM */}
      <section className="px-4 py-5 md:px-8 md:py-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-[#D6D0C9] bg-white p-5 shadow-sm sm:p-6">
          <ProfileForm
            initial={{
              name: artisan?.name ?? session.name,
              email: artisan?.email ?? session.email,
              business_name: artisan?.business_name ?? '',
              craft_type: artisan?.craft_type ?? '',
              phone: artisan?.phone ?? '',
              location: artisan?.location ?? '',
              bio: artisan?.bio ?? '',
              profile_picture: artisan?.profile_picture ?? null,
            }}
          />
        </div>
      </section>
    </main>
  );
}