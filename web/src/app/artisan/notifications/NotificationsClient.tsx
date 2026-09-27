'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NotificationsClient({ initial }: { initial: Array<{ id: number; message: string; is_read: boolean; created_at: string }> }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function markAllRead() {
    setBusy(true);
    await fetch('/api/notifications/read', { method: 'POST' });
    setItems((list) => list.map((n) => ({ ...n, is_read: true })));
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-3">
      {items.some((n) => !n.is_read) && (
        <button className="btn-outline" disabled={busy} onClick={markAllRead}>Mark all as read</button>
      )}
      {items.map((n) => (
        <div key={n.id} className={`card p-4 ${n.is_read ? 'opacity-60' : 'border-l-4 border-brand-500'}`}>
          <p className="text-sm text-stone-700">{n.message}</p>
          <p className="mt-1 text-xs text-stone-400">{new Date(n.created_at).toLocaleString()}</p>
        </div>
      ))}
      {items.length === 0 && <p className="text-stone-500">No notifications yet.</p>}
    </div>
  );
}
