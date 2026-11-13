'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface ProfileInitialData {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  bio?: string;
  profile_picture?: string | null;
}

export default function ProfileForm({ initial }: { initial: ProfileInitialData }) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: initial.name,
    phone: initial.phone ?? '',
    location: initial.location ?? '',
    bio: initial.bio ?? '',
  });

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/customer/account/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        throw new Error(data.message || 'Save failed.');
      }
      setMsg({ text: 'Profile details saved successfully.' });
      router.refresh();
    } catch (err: unknown) {
      setMsg({ text: (err as Error).message || 'Save failed.', error: true });
    } finally {
      setBusy(false);
    }
  }

  const label = 'mb-1 block text-xs font-semibold uppercase tracking-wider text-[#3D3028]';
  const field = 'input border-[#D6D0C9] focus:border-[#D6B56D]';

  return (
    <div className="space-y-5 rounded-2xl border border-[#D6D0C9] bg-white p-5 shadow-sm sm:p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className={label}>Email Address (Login)</label>
          <input className="input cursor-not-allowed border-[#E8DCCB] bg-[#FCF9F4] text-stone-500" value={initial.email} disabled />
          <p className="mt-1 text-[11px] text-[#71675F]">🔒 Your login email cannot be changed.</p>
        </div>

        <div>
          <label className={label}>Full Name</label>
          <input className={field} value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </div>

        <div>
          <label className={label}>Phone Number</label>
          <input
            className={field}
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="09XXXXXXXXX"
          />
          <p className="mt-1 text-[11px] text-[#71675F]">Used for courier delivery updates & workshop contact.</p>
        </div>

        <div>
          <label className={label}>Location / City</label>
          <input
            className={field}
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder="e.g. Prosperidad, Agusan del Sur"
          />
        </div>
      </div>

      <div>
        <label className={label}>Bio / About You</label>
        <textarea
          className={`${field} min-h-[100px]`}
          value={form.bio}
          onChange={(e) => set('bio', e.target.value)}
          placeholder="Share a short bio or your interest in indigenous cultural heritage crafts..."
        />
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-1">
        <button
          type="button"
          className="btn-primary px-6 py-2.5 text-xs font-bold uppercase tracking-wider shadow-sm"
          disabled={busy}
          onClick={save}
        >
          {busy ? 'Saving…' : 'Save Profile Changes'}
        </button>

        {msg && (
          <p
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
              msg.error
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-[#D6B56D] bg-[#FFF9EF] text-[#9A681D]'
            }`}
          >
            {msg.text}
          </p>
        )}
      </div>
    </div>
  );
}