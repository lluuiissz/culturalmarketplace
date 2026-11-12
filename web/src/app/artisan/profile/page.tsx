import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getArtisan } from '@/lib/db';
import ProfileHeader from './ProfileHeader';
import ProfileForm from './ProfileForm';

export const dynamic = 'force-dynamic';

export default async function ArtisanProfilePage() {
  const session = await getSession();
  if (!session || session.role !== 'artisan') redirect('/auth/login?next=/artisan/profile');

  const artisan = await getArtisan(session.id);

  return (
    <main className="min-h-screen bg-canvas">
      {/* Header: photo, names, actions */}
      <div className="border-b border-abaca-200">
        <div className="mx-auto max-w-3xl px-4 py-6 md:px-8">
          <ProfileHeader
            name={artisan?.name ?? session.name}
            businessName={artisan?.business_name ?? null}
            profilePicture={artisan?.profile_picture ?? null}
            publicHref={`/artisans/${session.id}`}
          />
        </div>
      </div>

      {/* Profile form */}
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-8">
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
    </main>
  );
}
