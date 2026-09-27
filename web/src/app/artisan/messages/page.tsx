import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { listConversations } from '@/lib/db';
import MessagesClient from '@/app/customer/account/messages/MessagesClient';

export const dynamic = 'force-dynamic';

export default async function ArtisanMessagesPage() {
  const session = await getSession();
  if (!session || session.role !== 'artisan') redirect('/auth/login?next=/artisan/messages');

  const conversations = await listConversations({ id: session.id, role: 'artisan' });
  return (
    <>
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-brand-900">Customer messages</h1>
        <MessagesClient role="artisan" conversations={conversations} initialConversationId={conversations[0]?.id ?? null} />
      </main>
    </>
  );
}
