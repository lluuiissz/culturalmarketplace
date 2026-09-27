import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getArtisan } from '@/lib/db';
import ProfileForm from './ProfileForm';

export const dynamic = 'force-dynamic';

export default async function ArtisanProfilePage() {
  const session = await getSession();
  if (!session || session.role !== 'artisan') redirect('/auth/login?next=/artisan/profile');

  const artisan = await getArtisan(session.id);
  return (
    <>
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-brand-900">My profile</h1>
        <ProfileForm
          initial={{
            name: artisan?.name ?? session.name,
            business_name: artisan?.business_name ?? '',
            craft_type: artisan?.craft_type ?? '',
            phone: artisan?.phone ?? '',
            location: artisan?.location ?? '',
            bio: artisan?.bio ?? '',
          }}
        />
      </main>
    </>
  );
}
