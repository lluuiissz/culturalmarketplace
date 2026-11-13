import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getUser } from '@/lib/db';
import ProfileForm from './ProfileForm';
import ProfileHeader from './ProfileHeader';

export const dynamic = 'force-dynamic';

export default async function CustomerProfilePage() {
  const session = await getSession();
  if (!session || session.role !== 'customer') redirect('/auth/login?next=/customer/account/profile');

  const user = await getUser(session.id);

  return (
    <main className="min-h-screen bg-[#FCF9F4]">
      <ProfileHeader
        name={user?.name || session.name}
        profilePicture={user?.profile_picture || null}
      />

      {/* DIVIDER */}
      <div className="h-px w-full bg-gray-300" />

      <section className="px-4 py-5 md:px-8 md:py-6">
        <div className="mx-auto max-w-2xl">
          <ProfileForm
            initial={{
              name: user?.name || session.name,
              email: user?.email || session.email,
              phone: user?.phone || '',
              location: user?.location || '',
              bio: user?.bio || '',
              profile_picture: user?.profile_picture || null,
            }}
          />
        </div>
      </section>
    </main>
  );
}