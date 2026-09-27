import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getConversation, listMessages, sendMessage } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ status: 'error' }, { status: 401 });
  const { conversationId } = await params;
  const conv = await getConversation(Number(conversationId));
  if (!conv) return NextResponse.json({ status: 'error', message: 'Conversation not found.' }, { status: 404 });

  const isParticipant =
    (session.role === 'customer' && conv.customer_id === session.id) ||
    (session.role === 'artisan' && conv.artisan_id === session.id) ||
    session.role === 'admin';
  if (!isParticipant) return NextResponse.json({ status: 'error', message: 'Not allowed.' }, { status: 403 });

  const messages = await listMessages(conv.id);
  return NextResponse.json({ status: 'success', messages });
}

export async function POST(req: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  const session = await getSession();
  if (!session || (session.role !== 'customer' && session.role !== 'artisan')) {
    return NextResponse.json({ status: 'error' }, { status: 401 });
  }
  const { conversationId } = await params;
  const conv = await getConversation(Number(conversationId));
  if (!conv) return NextResponse.json({ status: 'error', message: 'Conversation not found.' }, { status: 404 });

  const isParticipant =
    (session.role === 'customer' && conv.customer_id === session.id) ||
    (session.role === 'artisan' && conv.artisan_id === session.id);
  if (!isParticipant) return NextResponse.json({ status: 'error', message: 'Not allowed.' }, { status: 403 });

  const { message } = (await req.json()) as { message?: string };
  const text = (message ?? '').trim();
  if (!text) return NextResponse.json({ status: 'error', message: 'Message is empty.' }, { status: 400 });

  await sendMessage(conv.id, session.role, text);
  return NextResponse.json({ status: 'success' });
}
