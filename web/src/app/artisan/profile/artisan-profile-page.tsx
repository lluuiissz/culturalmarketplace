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
  const name = artisan?.name ?? session.name;

  return (
    <main className="min-h-screen bg-canvas">
      <ProfileHeader
        artisanId={session.id}
        name={name}
        businessName={artisan?.business_name ?? ''}
        profilePicture={artisan?.profile_picture ?? null}
      />

      <div className="px-4 py-6 md:px-8">
        <div className="mx-auto max-w-3xl">
          <ProfileForm
            initial={{
              name,
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
      </div>
    </main>
  );
}
