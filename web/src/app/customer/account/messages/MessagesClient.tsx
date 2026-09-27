'use client';

import { useEffect, useRef, useState } from 'react';

interface Conv { id: number; counterpart: string; product_name: string | null }
interface Msg { id: number; sender_role: string; message: string; created_at: string }

export default function MessagesClient({
  role, conversations, initialConversationId,
}: {
  role: 'customer' | 'artisan';
  conversations: Conv[];
  initialConversationId: number | null;
}) {
  const [activeId, setActiveId] = useState<number | null>(initialConversationId);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeId) return;
    let alive = true;
    async function poll() {
      const res = await fetch(`/api/chat/${activeId}/messages`);
      if (res.ok) {
        const data = await res.json();
        if (alive) setMessages(data.messages ?? []);
      }
    }
    poll();
    const t = setInterval(poll, 3000);
    return () => { alive = false; clearInterval(t); };
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !activeId) return;
    setDraft('');
    await fetch(`/api/chat/${activeId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    });
    const res = await fetch(`/api/chat/${activeId}/messages`);
    if (res.ok) setMessages((await res.json()).messages ?? []);
  }

  if (conversations.length === 0) {
    return <p className="mt-8 text-stone-500">No conversations yet. Open a product and tap “Message artisan”.</p>;
  }

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-[260px_1fr]">
      <div className="space-y-2">
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveId(c.id)}
            className={`w-full rounded-xl border p-3 text-left ${activeId === c.id ? 'border-brand-500 bg-brand-50' : 'border-stone-200 bg-white hover:border-brand-300'}`}
          >
            <p className="font-semibold text-stone-800">{c.counterpart}</p>
            {c.product_name && <p className="text-xs text-stone-500">about {c.product_name}</p>}
          </button>
        ))}
      </div>
      <div className="card flex h-[480px] flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender_role === role ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${m.sender_role === role ? 'bg-brand-500 text-white' : 'bg-stone-100 text-stone-800'}`}>
                <p className="whitespace-pre-line">{m.message}</p>
                <p className={`mt-1 text-[10px] ${m.sender_role === role ? 'text-white/70' : 'text-stone-400'}`}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {messages.length === 0 && <p className="text-sm text-stone-400">No messages yet — say hello!</p>}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={send} className="flex gap-2 border-t border-stone-100 p-3">
          <input className="input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message…" />
          <button className="btn-primary" type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}
