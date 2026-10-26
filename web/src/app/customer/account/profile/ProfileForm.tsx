'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { compressImage } from '@/lib/imageCompress';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: initial.name,
    phone: initial.phone ?? '',
    location: initial.location ?? '',
    bio: initial.bio ?? '',
  });

  const [profilePicture, setProfilePicture] = useState<string | null>(initial.profile_picture ?? null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show instant local preview
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);

    setUploadingPhoto(true);
    setMsg(null);

    try {
      // Client-side canvas compression: reduce size to ~150KB
      const compressed = await compressImage(file, 800, 800, 0.85);

      const formData = new FormData();
      formData.append('file', compressed);

      const res = await fetch('/api/customer/profile/photo', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        throw new Error(data.message || 'Failed to upload photo.');
      }

      setProfilePicture(data.profile_picture);
      setMsg({ text: 'Profile picture updated successfully!' });
      router.refresh();
    } catch (err: unknown) {
      setMsg({ text: (err as Error).message || 'Failed to upload photo.', error: true });
    } finally {
      setUploadingPhoto(false);
    }
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

  const currentDisplayPhoto = photoPreview || profilePicture;

  return (
    <div className="card mt-6 space-y-6 p-6">
      {/* Profile Photo Section */}
      <div className="flex flex-col sm:flex-row items-center gap-5 border-b border-stone-200 pb-6">
        <div className="relative group">
          {currentDisplayPhoto ? (
            <img
              src={currentDisplayPhoto}
              alt={form.name}
              className="h-24 w-24 rounded-full object-cover border-4 border-brand-100 shadow-sm"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-700 to-amber-700 text-2xl font-bold text-white shadow-sm border-4 border-brand-100">
              {form.name.slice(0, 2).toUpperCase() || 'CU'}
            </div>
          )}

          {uploadingPhoto && (
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center text-white text-xs font-semibold">
              Uploading…
            </div>
          )}
        </div>

        <div className="space-y-2 text-center sm:text-left flex-1">
          <div>
            <h3 className="font-semibold text-stone-900 text-sm">Customer Profile Photo</h3>
            <p className="text-xs text-stone-500">
              Upload a clear photo or avatar (JPEG, PNG, or WebP). Automatically compressed for fast loading.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoSelect}
            />
            <button
              type="button"
              disabled={uploadingPhoto}
              onClick={() => fileInputRef.current?.click()}
              className="btn-outline text-xs px-3 py-1.5 font-semibold flex items-center gap-1.5 hover:bg-stone-50"
            >
              <span>📷</span>
              <span>{uploadingPhoto ? 'Uploading…' : currentDisplayPhoto ? 'Change Photo' : 'Upload Photo'}</span>
            </button>
            {photoPreview && (
              <span className="text-[11px] text-ochre-800 font-semibold">✓ New photo selected</span>
            )}
          </div>
        </div>
      </div>

      {/* Profile Details Form */}
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-600">Email Address (Login)</label>
          <input className="input bg-stone-50 text-stone-500 cursor-not-allowed" value={initial.email} disabled />
          <p className="mt-0.5 text-[11px] text-stone-400">Your login email cannot be changed.</p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-600">Full Name</label>
          <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-600">Phone Number</label>
          <input
            className="input"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="09XXXXXXXXX"
          />
          <p className="mt-0.5 text-[11px] text-stone-400">Used for courier delivery updates & workshop contact.</p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-600">Location / City</label>
          <input
            className="input"
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder="e.g. Prosperidad, Agusan del Sur"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-600">Bio / About You</label>
          <textarea
            className="input h-24"
            value={form.bio}
            onChange={(e) => set('bio', e.target.value)}
            placeholder="Share a short bio or your interest in indigenous cultural heritage crafts..."
          />
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button className="btn-primary px-5 py-2 text-sm font-semibold" disabled={busy || uploadingPhoto} onClick={save}>
            {busy ? 'Saving…' : 'Save Profile Changes'}
          </button>
          {msg && (
            <p className={`text-xs font-medium ${msg.error ? 'text-crimson-600' : 'text-ochre-800'}`}>
              {msg.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
