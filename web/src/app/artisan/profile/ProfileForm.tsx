'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { compressImage } from '@/lib/imageCompress';

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

export default function ProfileForm({ initial }: { initial: ArtisanProfileInitialData }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: initial.name ?? '',
    business_name: initial.business_name ?? '',
    craft_type: initial.craft_type ?? '',
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

    // Show immediate local preview
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);

    setUploadingPhoto(true);
    setMsg(null);

    try {
      // Compress image client-side to ensure fast uploads
      const compressed = await compressImage(file, 800, 800, 0.85);

      const formData = new FormData();
      formData.append('file', compressed);

      const res = await fetch('/api/artisan/profile/photo', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        throw new Error(data.message || 'Failed to upload photo.');
      }

      setProfilePicture(data.profile_picture);
      setMsg({ text: 'Artisan portrait uploaded and published successfully!' });
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
      const res = await fetch('/api/artisan/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        throw new Error(data.message || 'Save failed.');
      }
      setMsg({ text: 'Artisan profile details updated successfully.' });
      router.refresh();
    } catch (err: unknown) {
      setMsg({ text: (err as Error).message || 'Save failed.', error: true });
    } finally {
      setBusy(false);
    }
  }

  const currentDisplayPhoto = photoPreview || profilePicture;

  return (
    <div className="card space-y-8 p-6 md:p-8 bg-white border border-abaca-300 shadow-sm rounded-2xl">
      {/* 1. Artisan Photo & Portrait Section */}
      <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-abaca-200 pb-7">
        <div className="relative group shrink-0">
          {currentDisplayPhoto ? (
            <img
              src={currentDisplayPhoto}
              alt={form.name || 'Artisan profile picture'}
              className="h-28 w-28 rounded-full object-cover border-4 border-ochre-400 shadow-md ring-4 ring-ochre-500/15"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-ochre-700 to-crimson-800 text-3xl font-sculpted font-bold text-white shadow-md border-4 border-ochre-400 ring-4 ring-ochre-500/15">
              {(form.name || 'AR').slice(0, 2).toUpperCase()}
            </div>
          )}

          {uploadingPhoto && (
            <div className="absolute inset-0 rounded-full bg-charcoal-950/70 backdrop-blur-2xs flex flex-col items-center justify-center text-white text-xs font-semibold gap-1">
              <span className="animate-spin text-ochre-300">⏳</span>
              <span>Uploading…</span>
            </div>
          )}
        </div>

        <div className="space-y-2 text-center sm:text-left flex-1">
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="font-sculpted text-base font-bold text-charcoal-900">
                Master Artisan Portrait
              </h2>
              <span className="rounded-full bg-ochre-100 px-2 py-0.5 text-[10px] font-bold text-ochre-800 uppercase tracking-wider">
                Public Avatar
              </span>
            </div>
            <p className="mt-1 text-xs text-charcoal-600 leading-relaxed">
              Your photo is showcased on the public Artisans Directory, product story cards, and living heritage workshop listings. Upload a clear portrait in JPEG, PNG, or WebP (max 8MB).
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1.5">
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
              className="btn-outline text-xs px-3.5 py-2 font-semibold flex items-center gap-1.5 border-abaca-300 hover:border-ochre-500 hover:bg-ochre-50 transition"
            >
              <span>📷</span>
              <span>{uploadingPhoto ? 'Processing…' : currentDisplayPhoto ? 'Change Artisan Photo' : 'Upload Artisan Photo'}</span>
            </button>
            {photoPreview && (
              <span className="text-[11px] text-ochre-800 font-semibold flex items-center gap-1">
                <span>✓</span> Portrait updated
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Atelier Details & Story Form */}
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-charcoal-700">
              Account Email
            </label>
            <input
              className="input bg-canvas/70 text-charcoal-500 cursor-not-allowed border-abaca-200"
              value={initial.email}
              disabled
            />
            <p className="mt-1 text-[11px] text-charcoal-500">🔒 Login email verified with registration.</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-charcoal-700">
              Master Artisan Full Name <span className="text-crimson-600">*</span>
            </label>
            <input
              className="input border-abaca-300 focus:border-ochre-500 focus:ring-ochre-500/20"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Datu Rogelio Lumapas"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-charcoal-700">
              Studio / Business Name
            </label>
            <input
              className="input border-abaca-300 focus:border-ochre-500 focus:ring-ochre-500/20"
              value={form.business_name}
              onChange={(e) => set('business_name', e.target.value)}
              placeholder="e.g. Agusan Woven Heritage Atelier"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-charcoal-700">
              Primary Craft Specialization
            </label>
            <input
              className="input border-abaca-300 focus:border-ochre-500 focus:ring-ochre-500/20"
              value={form.craft_type}
              onChange={(e) => set('craft_type', e.target.value)}
              placeholder="e.g. Traditional Banig Weaving, Agusan Woodcarving"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-charcoal-700">
              Contact Phone Number
            </label>
            <input
              className="input border-abaca-300 focus:border-ochre-500 focus:ring-ochre-500/20"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="e.g. 0917XXXXXXX"
            />
            <p className="mt-1 text-[11px] text-charcoal-500">Used for courier dispatches and pickup coordination.</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-charcoal-700">
              Workshop / Community Location
            </label>
            <input
              className="input border-abaca-300 focus:border-ochre-500 focus:ring-ochre-500/20"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder="e.g. Bunawan, Agusan del Sur"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-charcoal-700">
            Artisan Biography & Cultural Lineage Story
          </label>
          <textarea
            className="input min-h-[120px] leading-relaxed border-abaca-300 focus:border-ochre-500 focus:ring-ochre-500/20"
            value={form.bio}
            onChange={(e) => set('bio', e.target.value)}
            placeholder="Share your heritage story: your indigenous community (e.g. Manobo, Higaonon), master lineage, traditional weaving or carving techniques, and natural forest materials used..."
          />
          <p className="mt-1 text-[11px] text-charcoal-500">
            Displayed on your public profile and on each certified item's authenticity tag.
          </p>
        </div>

        {/* Submit Actions */}
        <div className="pt-3 flex flex-wrap items-center gap-4">
          <button
            type="button"
            className="btn-primary px-6 py-2.5 text-xs uppercase tracking-wider font-bold shadow-md"
            disabled={busy || uploadingPhoto}
            onClick={save}
          >
            {busy ? 'Saving Atelier…' : 'Save Atelier Profile'}
          </button>

          {msg && (
            <p
              className={`text-xs font-semibold rounded-lg px-3 py-1.5 ${
                msg.error
                  ? 'bg-red-50 text-crimson-700 border border-red-200'
                  : 'bg-ochre-50 text-charcoal-900 border border-ochre-300'
              }`}
            >
              {msg.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
