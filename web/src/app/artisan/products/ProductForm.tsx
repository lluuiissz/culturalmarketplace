'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { Variation, TutorialDate } from '@/lib/types';
import type { LocationData } from '@/components/MapPinPicker';

const MapPinPicker = dynamic(() => import('@/components/MapPinPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-64 rounded-xl border border-stone-200 bg-stone-100 flex items-center justify-center text-sm text-stone-500">
      🗺️ Loading interactive map…
    </div>
  ),
});

interface FormState {
  name: string;
  description: string;
  price: string;
  stock_quantity: string;
  category: string;
  has_tutorial: boolean;
  tutorial_title: string;
  tutorial_description: string;
  tutorial_price: string;
  tutorial_capacity: string;
  tutorial_fee_type: 'paid' | 'free';
  tutorial_location: string;
  tutorial_lat: number | null;
  tutorial_lng: number | null;
  materials_used: string;
}

const STANDARD_VARIATION_TYPES = [
  { type: 'size', typeLabel: 'Size' },
  { type: 'color', typeLabel: 'Color' },
  { type: 'material', typeLabel: 'Material' },
  { type: 'pattern', typeLabel: 'Pattern' },
  { type: 'others', typeLabel: 'Other' },
];

export default function ProductForm({
  mode,
  productId,
  categories,
  initial,
  initialHasVariations,
  initialVariations,
  initialTutorialDates,
}: {
  mode: 'create' | 'edit';
  productId?: number;
  categories: Array<{ id: number; name: string }>;
  initial?: Partial<FormState>;
  initialHasVariations?: boolean;
  initialVariations?: Variation[];
  initialTutorialDates?: TutorialDate[];
}) {
  const initialCat = (initial?.category ?? '').trim();
  const legacyCat =
    initialCat && !categories.some((c) => c.name.toLowerCase() === initialCat.toLowerCase())
      ? initialCat
      : null;
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    category: '',
    has_tutorial: false,
    tutorial_title: '',
    tutorial_description: '',
    tutorial_price: '',
    tutorial_capacity: '',
    tutorial_fee_type: 'paid',
    tutorial_location: '',
    tutorial_lat: 8.1752,
    tutorial_lng: 125.9934,
    materials_used: '',
    ...initial,
  });

  const [hasVariations, setHasVariations] = useState(initialHasVariations ?? false);
  const [variations, setVariations] = useState<Variation[]>(initialVariations ?? []);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  const [tutorialDates, setTutorialDates] = useState<TutorialDate[]>(
    initialTutorialDates && initialTutorialDates.length > 0
      ? initialTutorialDates
      : [
          {
            date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
            time_start: '09:00',
            time_end: '12:00',
            location: initial?.tutorial_location ?? '',
          },
        ]
  );

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function addSessionDate() {
    setTutorialDates((prev) => [
      ...prev,
      {
        date: new Date(Date.now() + 86400000 * (prev.length + 3)).toISOString().split('T')[0],
        time_start: '09:00',
        time_end: '12:00',
        location: form.tutorial_location || '',
      },
    ]);
  }

  function updateSessionDate(index: number, patch: Partial<TutorialDate>) {
    setTutorialDates((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  function removeSessionDate(index: number) {
    setTutorialDates((prev) => prev.filter((_, i) => i !== index));
  }

  function handleLocationPin(loc: LocationData) {
    setForm((f) => ({
      ...f,
      tutorial_lat: loc.lat,
      tutorial_lng: loc.lng,
      tutorial_location: loc.locationName,
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');

    const validVariations = hasVariations
      ? variations.filter((v) => v.name?.trim() && (v.typeLabel || '').trim())
      : null;

    if (hasVariations && (!validVariations || validVariations.length === 0)) {
      setError('Please add at least one complete variation option with a name and type label, or uncheck variations.');
      setBusy(false);
      return;
    }

    const effectiveCategory = isCustomCategory ? customCategory.trim() : form.category;
    if (!effectiveCategory) {
      setError('Please select or enter a category.');
      setBusy(false);
      return;
    }

    const payload: Record<string, unknown> = {
      ...form,
      category: effectiveCategory,
      price: Number(form.price) || 0,
      stock_quantity: Number(form.stock_quantity) || 0,
      tutorial_price:
        form.has_tutorial && form.tutorial_price !== ''
          ? Number(form.tutorial_price)
          : null,
      tutorial_capacity:
        form.has_tutorial && form.tutorial_capacity !== ''
          ? Number(form.tutorial_capacity)
          : null,
      tutorial_location: form.has_tutorial ? form.tutorial_location || null : null,
      tutorial_lat: form.has_tutorial ? form.tutorial_lat : null,
      tutorial_lng: form.has_tutorial ? form.tutorial_lng : null,
      tutorial_dates: form.has_tutorial ? tutorialDates : null,
      has_variations: hasVariations,
      variations_data: validVariations,
      materials_used: form.materials_used ? form.materials_used.trim() : null,
    };

    if (mode === 'create') {
      const res = await fetch('/api/artisan/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setBusy(false);
      if (data.status === 'success') {
        router.push(`/artisan/products/${data.id}/media-setup`);
        return;
      }
      setError(data.message || 'Could not save.');
    } else {
      const res = await fetch(`/api/artisan/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setBusy(false);
      if (res.ok) {
        router.push('/artisan/products');
        return;
      }
      setError('Could not save changes.');
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-6">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {/* Main product basic info */}
      <div className="card space-y-4 p-5">
        <h2 className="font-serif text-lg font-bold text-brand-900 border-b border-brand-100 pb-2">
          Basic Information
        </h2>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Product name</label>
          <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Description</label>
          <textarea className="input h-24" value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Materials Used <span className="text-xs text-stone-400 font-normal">(optional — e.g. Abaca fiber, Natural dyes, Bamboo, Uway vine)</span>
          </label>
          <input
            className="input"
            value={form.materials_used}
            onChange={(e) => set('materials_used', e.target.value)}
            placeholder="e.g. Abaca fiber, Uway vine, Natural plant pigments"
          />
          <p className="mt-1 text-xs text-stone-500">
            Highlights the authentic, indigenous materials used in this handcrafted cultural work.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Price (₱)</label>
            <input className="input" type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Stock</label>
            <input className="input" type="number" min="0" value={form.stock_quantity} onChange={(e) => set('stock_quantity', e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Category</label>
            <select
              className={`input ${(form.category || isCustomCategory) ? 'border-ochre-400' : 'border-stone-300'}`}
              value={isCustomCategory ? '__other__' : form.category}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '__other__') {
                  setIsCustomCategory(true);
                  set('category', '__other__');
                } else {
                  setIsCustomCategory(false);
                  set('category', val);
                }
              }}
              required={!isCustomCategory}
            >
              <option value="" disabled>Select a category…</option>
              {legacyCat && <option value={legacyCat}>{legacyCat} (legacy — please update)</option>}
              {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              <option value="__other__">✏️ Other / + Add New Category…</option>
            </select>
            {isCustomCategory && (
              <div className="mt-2 space-y-1">
                <input
                  type="text"
                  className="input text-sm border-brand-400 bg-brand-50/40"
                  placeholder="Enter new category name…"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  required
                />
                <p className="text-[11px] text-brand-700 font-medium">
                  ✨ This new category will be automatically saved to the marketplace for future use.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Variations section */}
      <div className="card space-y-3 p-5">
        <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 cursor-pointer">
          <input type="checkbox" checked={hasVariations} onChange={(e) => setHasVariations(e.target.checked)} />
          This product has variations (sizes, colors, patterns, or custom types…)
        </label>
        {hasVariations && (
          <div className="space-y-3 pt-2">
            <p className="text-xs text-stone-500">
              Select standard variations (Size, Color, Material, Pattern) or choose <b>&ldquo;✏️ + Type New Variation Type…&rdquo;</b> to enter your own custom attribute (e.g. Wood Finish, Bead Pattern, Strap Style, Scent).
            </p>
            {variations.map((v, idx) => {
              const standardTypes = ['size', 'color', 'material', 'pattern', 'others'];
              const isStandard = standardTypes.includes(v.type);
              const isCustom = !isStandard || v.type === 'custom';
              const customTypesInUse = Array.from(
                new Map(
                  variations
                    .filter((x) => !standardTypes.includes(x.type) && x.typeLabel?.trim())
                    .map((x) => [x.typeLabel.toLowerCase(), { type: x.type, typeLabel: x.typeLabel }])
                ).values()
              );

              return (
                <div key={idx} className="flex flex-wrap items-end gap-2.5 rounded-lg bg-stone-50 p-3 border border-stone-200">
                  <div className="flex-1 min-w-[130px]">
                    <label className="block text-xs font-medium text-stone-600">Variation Type</label>
                    <select
                      className="input mt-1 w-full text-xs bg-white"
                      value={isStandard ? v.type : (customTypesInUse.some((ct) => ct.type === v.type) ? v.type : 'custom')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'custom') {
                          setVariations((vs) => vs.map((x, i) => (i === idx ? { ...x, type: 'custom', typeLabel: '' } : x)));
                        } else {
                          const std = STANDARD_VARIATION_TYPES.find((x) => x.type === val);
                          if (std) {
                            setVariations((vs) => vs.map((x, i) => (i === idx ? { ...x, type: std.type, typeLabel: std.typeLabel } : x)));
                          } else {
                            const cst = customTypesInUse.find((x) => x.type === val);
                            if (cst) {
                              setVariations((vs) => vs.map((x, i) => (i === idx ? { ...x, type: cst.type, typeLabel: cst.typeLabel } : x)));
                            }
                          }
                        }
                      }}
                    >
                      <optgroup label="Standard Types">
                        {STANDARD_VARIATION_TYPES.map((t) => (
                          <option key={t.type} value={t.type}>{t.typeLabel}</option>
                        ))}
                      </optgroup>
                      {customTypesInUse.length > 0 && (
                        <optgroup label="Your Custom Types">
                          {customTypesInUse.map((ct) => (
                            <option key={ct.type} value={ct.type}>{ct.typeLabel}</option>
                          ))}
                        </optgroup>
                      )}
                      <option value="custom">✏️ + Type New Variation Type…</option>
                    </select>
                  </div>

                  {isCustom && (
                    <div className="flex-1 min-w-[120px]">
                      <label className="block text-xs font-bold text-brand-700">Custom Type Name *</label>
                      <input
                        className="input mt-1 w-full text-xs border-brand-400 bg-brand-50/40"
                        placeholder="e.g. Wood Finish"
                        value={v.typeLabel}
                        onChange={(e) => {
                          const label = e.target.value;
                          const slug = 'custom_' + label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
                          setVariations((vs) => vs.map((x, i) => (i === idx ? { ...x, type: slug || 'custom', typeLabel: label } : x)));
                        }}
                        required
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-[110px]">
                    <label className="block text-xs font-medium text-stone-600">Option / Value</label>
                    <input
                      className="input mt-1 w-full text-xs bg-white"
                      placeholder={isCustom ? 'e.g. Mahogany' : 'e.g. Small / Red'}
                      value={v.name}
                      onChange={(e) => setVariations((vs) => vs.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))}
                      required
                    />
                  </div>

                  <div className="w-24 sm:w-20">
                    <label className="block text-xs font-medium text-stone-600">Stock</label>
                    <input
                      className="input mt-1 w-full text-xs bg-white"
                      type="number"
                      min={0}
                      value={v.stock}
                      onChange={(e) => setVariations((vs) => vs.map((x, i) => (i === idx ? { ...x, stock: Math.max(0, Number(e.target.value)) } : x)))}
                    />
                  </div>

                  <div className="w-28 sm:w-24">
                    <label className="block text-xs font-medium text-stone-600">Extra price (₱)</label>
                    <input
                      className="input mt-1 w-full text-xs bg-white"
                      type="number"
                      min={0}
                      step="0.01"
                      value={v.price}
                      onChange={(e) => setVariations((vs) => vs.map((x, i) => (i === idx ? { ...x, price: Math.max(0, Number(e.target.value)) } : x)))}
                    />
                  </div>

                  <button
                    type="button"
                    className="text-stone-400 hover:text-red-600 p-2 text-sm transition"
                    title="Remove variation"
                    onClick={() => setVariations((vs) => vs.filter((_, i) => i !== idx))}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
            <button
              type="button"
              className="btn-outline text-xs inline-flex items-center gap-1.5"
              onClick={() => {
                const last = variations[variations.length - 1];
                setVariations((vs) => [
                  ...vs,
                  last
                    ? { name: '', stock: 10, price: 0, type: last.type, typeLabel: last.typeLabel }
                    : { name: '', stock: 10, price: 0, type: 'size', typeLabel: 'Size' },
                ]);
              }}
            >
              <span>+</span> Add variation
            </button>
          </div>
        )}
      </div>

      {/* Available Cultural Experience (Workshop / Tutorial) Section */}
      <div className={`card overflow-hidden transition-all duration-200 border-2 ${form.has_tutorial ? 'border-brand-500 shadow-md' : 'border-stone-200'}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-brand-50 to-white p-5 border-b border-brand-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🌿</span>
              <h2 className="font-serif text-lg font-bold text-brand-900">
                Available Cultural Experience
              </h2>
              {form.has_tutorial ? (
                <span className="badge bg-ochre-400 text-charcoal-950 font-bold border border-ochre-500 text-xs">Enabled</span>
              ) : (
                <span className="badge bg-stone-200 text-stone-600 text-xs">Optional</span>
              )}
            </div>
            <p className="mt-1 text-xs text-stone-500">
              Offer a live workshop, hands-on masterclass, or weaving tutorial where buyers learn directly from you in Agusan del Sur.
            </p>
          </div>

          <button
            type="button"
            onClick={() => set('has_tutorial', !form.has_tutorial)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              form.has_tutorial
                ? 'bg-brand-600 text-white shadow-sm hover:bg-brand-700'
                : 'btn-outline bg-white hover:bg-brand-50'
            }`}
          >
            <span>{form.has_tutorial ? '✓ Cultural Experience Active' : '+ Add Available Cultural Experience'}</span>
          </button>
        </div>

        {form.has_tutorial && (
          <div className="space-y-5 p-5 bg-white">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-stone-700">Workshop / Experience Title</label>
                <input
                  className="input"
                  placeholder="e.g. Masterclass on Traditional Basketry & Uway Weaving"
                  value={form.tutorial_title}
                  onChange={(e) => set('tutorial_title', e.target.value)}
                  required={form.has_tutorial}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-stone-700">Cultural Experience Description</label>
                <textarea
                  className="input h-24"
                  placeholder="Describe the hands-on session, materials provided, cultural heritage significance, and what attendees will create and take home."
                  value={form.tutorial_description}
                  onChange={(e) => set('tutorial_description', e.target.value)}
                  required={form.has_tutorial}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Workshop Fee (₱)</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 250"
                  value={form.tutorial_price}
                  onChange={(e) => set('tutorial_price', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">Fee Type</label>
                  <select
                    className="input"
                    value={form.tutorial_fee_type}
                    onChange={(e) => set('tutorial_fee_type', e.target.value as 'paid' | 'free')}
                  >
                    <option value="paid">Paid</option>
                    <option value="free">Free</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">Max Capacity</label>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    placeholder="e.g. 15"
                    value={form.tutorial_capacity}
                    onChange={(e) => set('tutorial_capacity', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Interactive Map Pinning */}
            <div className="pt-2">
              <MapPinPicker
                initialLat={form.tutorial_lat}
                initialLng={form.tutorial_lng}
                initialLocation={form.tutorial_location}
                onChange={handleLocationPin}
              />
            </div>

            {/* Scheduled Session Dates & Times */}
            <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-stone-800">
                    📅 Available Session Dates & Times
                  </h3>
                  <p className="text-xs text-stone-500">
                    Buyers can choose any of these scheduled session slots during checkout.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-outline px-2.5 py-1 text-xs"
                  onClick={addSessionDate}
                >
                  + Add Session Date
                </button>
              </div>

              <div className="space-y-2">
                {tutorialDates.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center gap-2 rounded-lg bg-white p-3 border border-stone-200 shadow-xs text-sm"
                  >
                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-[11px] text-stone-500">Session Date</label>
                      <input
                        type="date"
                        className="input mt-1"
                        value={item.date}
                        onChange={(e) => updateSessionDate(idx, { date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="w-28">
                      <label className="block text-[11px] text-stone-500">Start Time</label>
                      <input
                        type="time"
                        className="input mt-1"
                        value={item.time_start}
                        onChange={(e) => updateSessionDate(idx, { time_start: e.target.value })}
                        required
                      />
                    </div>
                    <div className="w-28">
                      <label className="block text-[11px] text-stone-500">End Time</label>
                      <input
                        type="time"
                        className="input mt-1"
                        value={item.time_end}
                        onChange={(e) => updateSessionDate(idx, { time_end: e.target.value })}
                        required
                      />
                    </div>
                    <div className="flex-1 min-w-[150px]">
                      <label className="block text-[11px] text-stone-500">Venue Note (optional)</label>
                      <input
                        className="input mt-1"
                        placeholder={form.tutorial_location || 'Venue note'}
                        value={item.location ?? ''}
                        onChange={(e) => updateSessionDate(idx, { location: e.target.value })}
                      />
                    </div>
                    {tutorialDates.length > 1 && (
                      <button
                        type="button"
                        className="text-stone-400 hover:text-red-600 p-2 text-sm mt-4"
                        onClick={() => removeSessionDate(idx)}
                        title="Remove session"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="btn-primary" disabled={busy} type="submit">
          {busy ? 'Saving…' : mode === 'create' ? 'Save & add photos' : 'Save changes'}
        </button>
        {mode === 'create' && (
          <p className="text-xs text-stone-500">
            Photos and NFC tags can be added in the next step.
          </p>
        )}
      </div>
    </form>
  );
}
