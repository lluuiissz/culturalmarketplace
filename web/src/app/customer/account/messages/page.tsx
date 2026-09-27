import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { listConversations } from '@/lib/db';
import MessagesClient from './MessagesClient';

export const dynamic = 'force-dynamic';

export default async function CustomerMessagesPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'customer') redirect('/auth/login?next=/customer/account/messages');
  const { c } = await searchParams;

  const conversations = await listConversations({ id: session.id, role: 'customer' });
  return (
    <>
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-brand-900">Messages</h1>
        <MessagesClient
          role="customer"
          conversations={conversations.map((c2) => ({ id: c2.id, counterpart: c2.counterpart, product_name: c2.product_name }))}
          initialConversationId={c ? Number(c) : conversations[0]?.id ?? null}
        />
      </main>
    </>
  );
}
