import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { listNotifications } from '@/lib/db';
import NotificationsClient from './NotificationsClient';

export const dynamic = 'force-dynamic';

export default async function ArtisanNotificationsPage() {
  const session = await getSession();
  if (!session || session.role !== 'artisan') redirect('/auth/login?next=/artisan/notifications');

  const notifications = await listNotifications(session.id, 'artisan');
  return (
    <>
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-brand-900">Notifications</h1>
        <NotificationsClient
          initial={notifications.map((n) => ({ id: n.id, message: n.message, is_read: n.is_read, created_at: n.created_at }))}
        />
      </main>
    </>
  );
}
