'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface ArtisanProfileInitialData {
  name: string;
  email: string;
  business_name?: string;
  craft_type?: string;
  phone?: string;
  location?: string;
  bio?: string;
  profile_picture?: string | null;
}

const labelClass = 'mb-1 block text-xs text-stone-600';
const inputClass = 'input !rounded-xl !py-2 border-stone-300';

export default function ProfileForm({ initial }: { initial: ArtisanProfileInitialData }) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: initial.name ?? '',
    business_name: initial.business_name ?? '',
    craft_type: initial.craft_type ?? '',
    phone: initial.phone ?? '',
    location: initial.location ?? '',
    bio: initial.bio ?? '',
  });

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/artisan/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        throw new Error(data.message || 'Save failed.');
      }
      setMsg({ text: 'Profile updated successfully.' });
      router.refresh();
    } catch (err: unknown) {
      setMsg({ text: (err as Error).message || 'Save failed.', error: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-stone-300 bg-white p-6 sm:p-8">
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="ap-email">Email</label>
          <input
            id="ap-email"
            className={`${inputClass} cursor-not-allowed bg-canvas/70 text-stone-500`}
            value={initial.email}
            disabled
          />
          <p className="mt-1 text-[11px] text-stone-500">Contact admin for updating of email</p>
        </div>

        <div>
          <label className={labelClass} htmlFor="ap-name">Full name</label>
          <input
            id="ap-name"
            className={inputClass}
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            required
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="ap-business">Organization / Business Name</label>
          <input
            id="ap-business"
            className={inputClass}
            value={form.business_name}
            onChange={(e) => set('business_name', e.target.value)}
            placeholder="e.g. Agusan Woven Heritage Atelier"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="ap-craft">Primary Craft Specialization</label>
          <input
            id="ap-craft"
            className={inputClass}
            value={form.craft_type}
            onChange={(e) => set('craft_type', e.target.value)}
            placeholder="e.g. Traditional Banig Weaving"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="ap-phone">Phone number</label>
          <input
            id="ap-phone"
            className={inputClass}
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="e.g. 09171234567"
          />
          <p className="mt-1 text-[11px] text-stone-500">Used for courier dispatches and pickup coordination.</p>
        </div>

        <div>
          <label className={labelClass} htmlFor="ap-location">Workshop / Community Location</label>
          <input
            id="ap-location"
            className={inputClass}
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder="e.g. Bunawan, Agusan del Sur"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className={labelClass} htmlFor="ap-bio">Artisan Background &amp; Cultural Story</label>
        <textarea
          id="ap-bio"
          className={`${inputClass} min-h-[110px] leading-relaxed`}
          value={form.bio}
          onChange={(e) => set('bio', e.target.value)}
          placeholder="Share your heritage story: your community, your lineage, the techniques and natural materials you use..."
        />
      </div>

      <div className="mt-5">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="btn-primary mx-auto block w-[92%] !rounded-md !bg-[#9E0000] !py-1.5 text-sm font-bold hover:!bg-[#8B0000] disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Save'}
        </button>

        {msg && (
          <p
            className={`mt-3 text-center text-xs font-semibold ${
              msg.error ? 'text-crimson-700' : 'text-ochre-800'
            }`}
          >
            {msg.text}
          </p>
        )}
      </div>
    </div>
  );
}
