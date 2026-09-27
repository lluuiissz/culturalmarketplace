import { getSession } from '@/lib/auth';
import ProfileClient from './ProfileClient';

export const dynamic = 'force-dynamic';

export default async function AdminProfilePage() {
  const session = await getSession();
  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand-900">My profile</h1>
      <ProfileClient initial={{ name: session?.name ?? '', email: session?.email ?? '' }} />
    </div>
  );
}
