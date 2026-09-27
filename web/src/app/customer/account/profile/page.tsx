import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import ProfileForm from './ProfileForm';

export const dynamic = 'force-dynamic';

export default async function CustomerProfilePage() {
  const session = await getSession();
  if (!session || session.role !== 'customer') redirect('/auth/login?next=/customer/account/profile');

  return (
    <>
      <main className="mx-auto max-w-xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-brand-900">My profile</h1>
        <ProfileForm initial={{ name: session.name, email: session.email }} />
      </main>
    </>
  );
}
