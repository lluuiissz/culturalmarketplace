import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getUser } from '@/lib/db';
import ProfileForm from './ProfileForm';

export const dynamic = 'force-dynamic';

export default async function CustomerProfilePage() {
  const session = await getSession();
  if (!session || session.role !== 'customer') redirect('/auth/login?next=/customer/account/profile');

  const user = await getUser(session.id);

  return (
    <>
      <main className="mx-auto max-w-xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-brand-900">My profile</h1>
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
      </main>
    </>
  );
}
