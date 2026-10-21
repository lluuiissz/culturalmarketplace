import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getArtisan } from '@/lib/db';
import ProfileForm from './ProfileForm';
import WeaveDivider from '@/components/WeaveDivider';

export const dynamic = 'force-dynamic';

export default async function ArtisanProfilePage() {
  const session = await getSession();
  if (!session || session.role !== 'artisan') redirect('/auth/login?next=/artisan/profile');

  const artisan = await getArtisan(session.id);
  return (
    <main className="min-h-screen bg-canvas px-4 py-8 md:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Navigation & Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
              <Link href="/artisan/dashboard" className="hover:text-ochre-800 hover:underline">
                Atelier Dashboard
              </Link>
              <span>/</span>
              <span className="text-charcoal-500">Master Profile</span>
            </div>
            <h1 className="mt-1 font-sculpted text-2xl font-bold tracking-tight text-charcoal-900 md:text-3xl">
              Master Artisan Profile
            </h1>
            <p className="mt-1 text-xs text-charcoal-600 md:text-sm">
              Manage your personal heritage biography, studio identity, workshop location, and public artisan portrait.
            </p>
          </div>

          <Link
            href={`/artisans/${session.id}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-abaca-300 bg-white px-3.5 py-2 text-xs font-semibold text-charcoal-800 shadow-2xs hover:bg-ochre-50 transition"
          >
            <span>👁️</span>
            <span>View Public Profile</span>
          </Link>
        </div>

        <WeaveDivider pattern="diamond" className="my-5" subtle />

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
