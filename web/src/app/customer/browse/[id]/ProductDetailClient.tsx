'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import type { Product } from '@/lib/types';

interface QuantityStepperProps {
  value: number;
  min?: number;
  max: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  label?: string;
  stockLabel?: string;
}

function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  disabled = false,
  label = 'Quantity to Order',
  stockLabel,
}: QuantityStepperProps) {
  const safeMax = Math.max(min, max);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-abaca-200 bg-canvas/40 p-3.5">
      <div className="min-w-0">
        <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-800">
          {label}
        </label>
        {stockLabel && (
          <p className="mt-0.5 text-[11px] text-stone-500 font-medium truncate">
            {stockLabel}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-xl border border-abaca-300 bg-white shadow-2xs overflow-hidden">
          <button
            type="button"
            onClick={() => onChange(Math.max(min, value - 1))}
            disabled={disabled || value <= min}
            className="flex h-9 w-9 items-center justify-center text-base font-bold text-charcoal-700 hover:bg-ochre-50 active:bg-ochre-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <input
            type="number"
            min={min}
            max={safeMax}
            value={value}
            disabled={disabled}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val)) onChange(Math.min(safeMax, Math.max(min, val)));
            }}
            className="w-12 text-center text-sm font-bold text-charcoal-900 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => onChange(Math.min(safeMax, value + 1))}
            disabled={disabled || value >= safeMax}
            className="flex h-9 w-9 items-center justify-center text-base font-bold text-charcoal-700 hover:bg-ochre-50 active:bg-ochre-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        {value >= safeMax && safeMax > 0 && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-ochre-800 bg-ochre-100 px-2 py-1 rounded-md border border-ochre-200">
            Max
          </span>
        )}
      </div>
    </div>
  );
}

export default function ProductDetailClient({ product, loggedIn }: { product: Product; loggedIn: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<'product' | 'workshop' | 'bundle'>('product');
  const [selectedVariants, setSelectedVariants] = useState<Record<string, { name: string; price: number }>>({});
  const [session, setSession] = useState(0);
  const [qty, setQty] = useState(1);
  const [attendeeFor, setAttendeeFor] = useState<'self' | 'others'>('self');
  const [attendeeNames, setAttendeeNames] = useState<string[]>(['']);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const variations = product.variations_data ?? [];
  const grouped = variations.reduce<Record<string, typeof variations>>((acc, v) => {
    (acc[v.typeLabel] ??= []).push(v);
    return acc;
  }, {});

  // Listen to hash triggers (e.g. #workshop-booking or #session-0) to seamlessly switch mode and session
  useEffect(() => {
    if (typeof window === 'undefined') return;

    function handleHash() {
      const hash = window.location.hash;
      if (hash.includes('workshop')) {
        setMode('workshop');
      } else if (hash.startsWith('#session-')) {
        const idx = parseInt(hash.replace('#session-', ''), 10);
        if (!isNaN(idx)) {
          setMode('workshop');
          setSession(idx);
        }
      }
    }

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  function toggleVariation(typeLabel: string, name: string, price: number) {
    setSelectedVariants((prev) => {
      const next = { ...prev };
      if (next[typeLabel]?.name === name) {
        delete next[typeLabel];
      } else {
        next[typeLabel] = { name, price };
      }
      return next;
    });
  }

  function handleQtyChange(newQty: number) {
    const validQty = Math.max(1, newQty);
    setQty(validQty);
    setAttendeeNames((prev) => {
      const next = [...prev];
      while (next.length < validQty) next.push('');
      return next.slice(0, validQty);
    });
  }

  function updateAttendeeName(index: number, name: string) {
    setAttendeeNames((prev) => {
      const next = [...prev];
      next[index] = name;
      return next;
    });
  }

  const currentVariantPrice = Object.values(selectedVariants).reduce((sum, v) => sum + (v.price || 0), 0);
  const formattedVariant = Object.entries(selectedVariants)
    .map(([type, v]) => `${type}: ${v.name}`)
    .join(' · ');

  const productPrice = Number(product.price) + currentVariantPrice;
  const workshopPrice = Number(product.tutorial_price ?? 0);
  const bundleUnitPrice = productPrice + workshopPrice;

  async function addToCart(purchaseType: 'product' | 'workshop' | 'bundle') {
    if (!loggedIn) {
      router.push(`/auth/login?next=/customer/browse/${product.id}`);
      return;
    }

    if (purchaseType !== 'product' && attendeeFor === 'others') {
      const missing = attendeeNames.slice(0, qty).some((n) => !n.trim());
      if (missing) {
        setMsg(`Please enter the full name for all ${qty} attendee slot${qty > 1 ? 's' : ''}.`);
        return;
      }
    }

    setBusy(true);
    setMsg('');
    const attendeeString = purchaseType !== 'product' && attendeeFor === 'others'
      ? attendeeNames.slice(0, qty).map((n) => n.trim()).filter(Boolean).join(', ')
      : null;

    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: product.id,
        purchase_type: purchaseType,
        quantity: qty,
        selected_variant: purchaseType !== 'workshop' ? (formattedVariant || null) : null,
        selected_session: purchaseType !== 'product' ? product.tutorial_dates?.[session] ?? null : null,
        attendee_for: purchaseType !== 'product' ? attendeeFor : 'self',
        attendee_name: attendeeString,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.status === 'success') {
      router.refresh();
      const label =
        purchaseType === 'bundle'
          ? 'Craft & Workshop bundle added to cart!'
          : purchaseType === 'workshop'
          ? 'Workshop booking added to cart'
          : 'Product added to cart';
      toast.success(label, { label: 'View cart →', href: '/cart' });
      setMsg('');
    } else {
      setMsg(data.message || 'Could not add to cart.');
    }
  }

  async function messageArtisan() {
    if (!loggedIn) {
      router.push(`/auth/login?next=/customer/browse/${product.id}`);
      return;
    }
    setBusy(true);
    setMsg('');
    const res = await fetch('/api/chat/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: product.id }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.status === 'success') router.push(`/customer/account/messages?c=${data.conversation_id}`);
    else setMsg(data.message || 'Please sign in as a customer to chat.');
  }

  const hasVariations = Object.entries(grouped).length > 0;

  return (
    <div id="workshop-booking" className="mt-6 scroll-mt-24 space-y-5">
      {msg && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-crimson-800 shadow-2xs">
          ⚠️ {msg}
        </div>
      )}

      {/* Choice Selector: Order Product vs Book Cultural Experience vs Bundle */}
      {product.has_tutorial && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal-700">
              Select Experience Option:
            </label>
            <span className="text-[11px] font-semibold text-forest-700">
              🌿 Live Workshop Available
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-2 bg-abaca-100/60 rounded-2xl border border-abaca-200/90 text-xs shadow-2xs">
            {/* Option 1: Product Only */}
            <button
              type="button"
              onClick={() => setMode('product')}
              className={`flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl font-semibold transition text-center ${
                mode === 'product'
                  ? 'bg-white text-charcoal-900 shadow-sm border border-ochre-400 ring-2 ring-ochre-500/20'
                  : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-white/60'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                <span>📦</span>
                <span>Order Craft</span>
              </div>
              <span className="text-[11px] font-medium text-stone-500">
                ₱{productPrice.toFixed(2)}
              </span>
            </button>

            {/* Option 2: Workshop Only */}
            <button
              type="button"
              onClick={() => setMode('workshop')}
              className={`flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl font-semibold transition text-center relative ${
                mode === 'workshop'
                  ? 'bg-white text-forest-900 shadow-sm border border-forest-500 ring-2 ring-forest-500/25'
                  : 'text-charcoal-600 hover:text-forest-900 hover:bg-white/60'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                <span>🌿</span>
                <span>Live Workshop</span>
              </div>
              <span className="text-[11px] font-bold text-forest-700">
                {product.tutorial_fee_type === 'free' ? 'FREE PASS' : `₱${workshopPrice.toFixed(2)}`}
              </span>
            </button>

            {/* Option 3: Craft + Workshop Bundle */}
            <button
              type="button"
              onClick={() => setMode('bundle')}
              className={`flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl font-semibold transition text-center ${
                mode === 'bundle'
                  ? 'bg-white text-amber-950 shadow-sm border border-amber-400 ring-2 ring-amber-500/25'
                  : 'text-charcoal-600 hover:text-amber-900 hover:bg-white/60'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                <span>✨</span>
                <span>Craft + Workshop</span>
              </div>
              <span className="text-[11px] font-bold text-amber-700">
                ₱{bundleUnitPrice.toFixed(2)}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* PANEL 1: Order Handcrafted Product Mode (Clean, no confusion for products without variants like Product 31) */}
      {mode === 'product' && (
        <div className="space-y-5 rounded-2xl border border-abaca-200/90 bg-white p-5 shadow-xs">
          {hasVariations ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-abaca-100 pb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-charcoal-800">
                  Select Variations & Customization
                </span>
                <span className="text-xs text-stone-500 font-medium">
                  {product.stock_quantity > 0 ? `${product.stock_quantity} available` : 'Made to order'}
                </span>
              </div>

              {Object.entries(grouped).map(([label, opts]) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-charcoal-800">{label}</label>
                    {selectedVariants[label] && (
                      <span className="text-[11px] text-ochre-700 font-semibold">
                        Selected: {selectedVariants[label].name}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {opts.map((v) => {
                      const isSelected = selectedVariants[label]?.name === v.name;
                      return (
                        <button
                          key={v.name}
                          type="button"
                          onClick={() => toggleVariation(v.typeLabel, v.name, Number(v.price) || 0)}
                          className={`rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition ${
                            isSelected
                              ? 'border-ochre-700 bg-ochre-700 text-white shadow-xs'
                              : 'border-abaca-300 bg-white text-charcoal-800 hover:border-ochre-500'
                          }`}
                        >
                          {v.name} {Number(v.price) > 0 ? `(+₱${v.price})` : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-b border-abaca-100 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-charcoal-800">
                  Purchase Order Details
                </span>
                <span className="rounded-full bg-ochre-50 px-2.5 py-0.5 text-[10px] font-bold text-ochre-800 border border-ochre-200">
                  Ready to Dispatch
                </span>
              </div>
              <p className="mt-1 text-xs text-stone-500">
                Direct handcrafted artisan piece. Authentic cultural heritage craft.
              </p>
            </div>
          )}

          {/* Quantity Stepper: Solves input confusion and prevents stretching */}
          <QuantityStepper
            value={qty}
            min={1}
            max={Math.max(1, product.stock_quantity)}
            onChange={handleQtyChange}
            label="Order Quantity"
            stockLabel={
              product.stock_quantity > 0
                ? `${product.stock_quantity} pieces available in artisan atelier`
                : 'Made to order by master artisan'
            }
          />

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              className="btn-primary flex-1 py-3.5 text-xs font-bold uppercase tracking-wider shadow-md rounded-xl"
              disabled={busy || product.stock_quantity <= 0}
              onClick={() => addToCart('product')}
            >
              🛒 Add Product to Cart — ₱{(productPrice * qty).toFixed(2)}
            </button>
            <button
              type="button"
              className="btn-outline px-4 py-3 text-xs font-semibold rounded-xl"
              disabled={busy}
              onClick={messageArtisan}
              title="Chat with master custodian"
            >
              💬 Message
            </button>
          </div>
        </div>
      )}

      {/* PANEL 2: Book Cultural Experience Mode (Visible workshop booking with prominent button) */}
      {mode === 'workshop' && product.has_tutorial && (
        <div className="space-y-5 rounded-2xl border-2 border-forest-300 bg-forest-50/25 p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-forest-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🌿</span>
                <p className="text-sm font-bold text-forest-900 font-sculpted">
                  {product.tutorial_title || 'Living Cultural Workshop Session'}
                </p>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Hands-on masterclass in Agusan del Sur with Master Custodian
              </p>
            </div>
            <span className="badge bg-forest-700 text-white font-bold py-1 px-2.5 text-xs">
              {product.tutorial_fee_type === 'free' ? 'FREE PASS' : `₱${workshopPrice.toFixed(2)} / attendee`}
            </span>
          </div>

          {/* Session Date Selection */}
          {product.tutorial_dates && product.tutorial_dates.length > 0 ? (
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-800">
                1. Select Scheduled Session Date & Time:
              </label>
              <div className="space-y-2">
                {product.tutorial_dates.map((d, i) => (
                  <label
                    key={i}
                    className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer text-xs transition ${
                      session === i
                        ? 'border-forest-600 bg-white ring-2 ring-forest-500/20 shadow-xs'
                        : 'border-abaca-200 bg-white/70 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="session"
                      className="mt-1 accent-forest-700"
                      checked={session === i}
                      onChange={() => setSession(i)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-charcoal-900 text-sm">📅 {d.date}</p>
                      <p className="text-stone-600 font-medium mt-0.5">🕒 {d.time_start} – {d.time_end}</p>
                      {d.location && <p className="text-stone-500 text-[11px] mt-0.5 truncate">📍 {d.location}</p>}
                    </div>
                    {session === i && (
                      <span className="text-[10px] font-bold text-forest-700 bg-forest-50 px-2 py-0.5 rounded border border-forest-200">
                        Selected
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-stone-500 italic bg-white p-3 rounded-xl border border-abaca-200">
              Artisan has not scheduled specific public calendar dates yet. Message the artisan below to coordinate an atelier workshop session.
            </p>
          )}

          {/* Attendee Slots Stepper */}
          <QuantityStepper
            value={qty}
            min={1}
            max={product.tutorial_capacity ?? 10}
            onChange={handleQtyChange}
            label="Attendee Seats"
            stockLabel={`Maximum ${product.tutorial_capacity ?? 10} attendees allowed per session`}
          />

          {/* Attendee Details: For Self vs Others */}
          <div className="rounded-xl bg-white p-4 border border-abaca-200 space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal-800 block">
              2. Who is this workshop booking for?
            </label>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <label
                className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                  attendeeFor === 'self'
                    ? 'border-forest-600 bg-forest-50/70 font-bold text-forest-900 ring-1 ring-forest-500'
                    : 'border-abaca-200 text-charcoal-700 hover:bg-stone-50'
                }`}
              >
                <input
                  type="radio"
                  name="attendee_for"
                  className="accent-forest-700"
                  checked={attendeeFor === 'self'}
                  onChange={() => setAttendeeFor('self')}
                />
                <span>👤 For Myself</span>
              </label>

              <label
                className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                  attendeeFor === 'others'
                    ? 'border-forest-600 bg-forest-50/70 font-bold text-forest-900 ring-1 ring-forest-500'
                    : 'border-abaca-200 text-charcoal-700 hover:bg-stone-50'
                }`}
              >
                <input
                  type="radio"
                  name="attendee_for"
                  className="accent-forest-700"
                  checked={attendeeFor === 'others'}
                  onChange={() => setAttendeeFor('others')}
                />
                <span>👥 For Someone Else</span>
              </label>
            </div>

            {attendeeFor === 'others' && (
              <div className="space-y-2.5 pt-2 border-t border-abaca-100">
                <p className="text-[11px] text-stone-500">
                  Please provide attendee names so the artisan and workshop host can issue tickets.
                </p>
                {Array.from({ length: qty }).map((_, idx) => (
                  <div key={idx}>
                    <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                      Attendee {qty > 1 ? `#${idx + 1} ` : ''}Full Name *
                    </label>
                    <input
                      type="text"
                      className="input w-full text-xs"
                      placeholder={`e.g. Maria Santos${qty > 1 ? ` (Attendee ${idx + 1})` : ''}`}
                      value={attendeeNames[idx] || ''}
                      onChange={(e) => updateAttendeeName(idx, e.target.value)}
                      required
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* HIGHLY VISIBLE WORKSHOP BOOKING BUTTON */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              className="btn bg-forest-700 hover:bg-forest-800 text-white flex-1 py-3.5 text-xs font-bold uppercase tracking-wider shadow-md rounded-xl transition flex items-center justify-center gap-2"
              disabled={busy}
              onClick={() => addToCart('workshop')}
            >
              <span>🌿</span>
              <span>
                {product.tutorial_fee_type === 'free'
                  ? `Confirm Free Workshop Registration (${qty} seat${qty > 1 ? 's' : ''})`
                  : `Book Workshop Session — ₱${(workshopPrice * qty).toFixed(2)}`}
              </span>
            </button>
            <button
              type="button"
              className="btn-outline px-4 py-3 text-xs font-semibold rounded-xl"
              disabled={busy}
              onClick={messageArtisan}
            >
              💬 Message
            </button>
          </div>
        </div>
      )}

      {/* PANEL 3: Combined Craft + Workshop Bundle Mode */}
      {mode === 'bundle' && product.has_tutorial && (
        <div className="space-y-5 rounded-2xl border-2 border-amber-300 bg-amber-50/20 p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-amber-200 pb-3">
            <div>
              <p className="text-sm font-bold text-amber-950 flex items-center gap-1.5 font-sculpted">
                <span>✨</span> Complete Cultural Heritage Bundle
              </p>
              <p className="text-xs text-stone-600 mt-0.5">
                Receive the authentic craft item AND attend the masterclass workshop.
              </p>
            </div>
            <span className="badge bg-amber-700 text-white font-bold py-1 px-2.5 text-xs">
              ₱{bundleUnitPrice.toFixed(2)} / bundle
            </span>
          </div>

          {/* 1. Craft Variant Section (if any) */}
          {hasVariations && (
            <div className="rounded-xl bg-white p-4 border border-abaca-200 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal-800 block">
                1. Select Handcrafted Variation:
              </span>
              {Object.entries(grouped).map(([label, opts]) => (
                <div key={label}>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">{label}</label>
                  <div className="flex flex-wrap gap-2">
                    {opts.map((v) => {
                      const isSelected = selectedVariants[label]?.name === v.name;
                      return (
                        <button
                          key={v.name}
                          type="button"
                          onClick={() => toggleVariation(v.typeLabel, v.name, Number(v.price) || 0)}
                          className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                            isSelected
                              ? 'border-amber-700 bg-amber-700 text-white shadow-xs'
                              : 'border-abaca-300 bg-white text-charcoal-800 hover:border-amber-500'
                          }`}
                        >
                          {v.name} {Number(v.price) > 0 ? `(+₱${v.price})` : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. Workshop Session Selection */}
          <div className="rounded-xl bg-white p-4 border border-abaca-200 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-800 block">
              2. Select Scheduled Workshop Session:
            </span>
            {product.tutorial_dates && product.tutorial_dates.length > 0 ? (
              <div className="space-y-2">
                {product.tutorial_dates.map((d, i) => (
                  <label
                    key={i}
                    className={`flex items-start gap-3 rounded-xl border p-2.5 cursor-pointer text-xs transition ${
                      session === i
                        ? 'border-amber-600 bg-amber-50/50 ring-2 ring-amber-500/20 shadow-xs'
                        : 'border-abaca-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="bundle_session"
                      className="mt-1 accent-amber-600"
                      checked={session === i}
                      onChange={() => setSession(i)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-charcoal-900">📅 {d.date}</p>
                      <p className="text-stone-500">🕒 {d.time_start} – {d.time_end}</p>
                      {d.location && <p className="text-stone-500 text-[11px] truncate">📍 {d.location}</p>}
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-500 italic">No scheduled dates yet. Message artisan to arrange.</p>
            )}
          </div>

          {/* 3. Attendee Booking Details */}
          <div className="rounded-xl bg-white p-4 border border-abaca-200 space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal-800 block">
              3. Who is this workshop session for?
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label
                className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                  attendeeFor === 'self'
                    ? 'border-amber-600 bg-amber-50/70 font-bold text-amber-900 ring-1 ring-amber-500'
                    : 'border-abaca-200 text-charcoal-700 hover:bg-stone-50'
                }`}
              >
                <input
                  type="radio"
                  name="bundle_attendee_for"
                  className="accent-amber-600"
                  checked={attendeeFor === 'self'}
                  onChange={() => setAttendeeFor('self')}
                />
                <span>👤 For Myself</span>
              </label>

              <label
                className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                  attendeeFor === 'others'
                    ? 'border-amber-600 bg-amber-50/70 font-bold text-amber-900 ring-1 ring-amber-500'
                    : 'border-abaca-200 text-charcoal-700 hover:bg-stone-50'
                }`}
              >
                <input
                  type="radio"
                  name="bundle_attendee_for"
                  className="accent-amber-600"
                  checked={attendeeFor === 'others'}
                  onChange={() => setAttendeeFor('others')}
                />
                <span>👥 For Someone Else</span>
              </label>
            </div>

            {attendeeFor === 'others' && (
              <div className="space-y-2 pt-2 border-t border-abaca-100">
                <p className="text-[11px] text-stone-500">Enter attendee names for the workshop pass.</p>
                {Array.from({ length: qty }).map((_, idx) => (
                  <div key={idx}>
                    <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                      Attendee {qty > 1 ? `#${idx + 1} ` : ''}Full Name *
                    </label>
                    <input
                      type="text"
                      className="input w-full text-xs"
                      placeholder={`e.g. Maria Santos${qty > 1 ? ` (Attendee ${idx + 1})` : ''}`}
                      value={attendeeNames[idx] || ''}
                      onChange={(e) => updateAttendeeName(idx, e.target.value)}
                      required
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stepper for Bundle Quantity */}
          <QuantityStepper
            value={qty}
            min={1}
            max={Math.min(Math.max(1, product.stock_quantity), product.tutorial_capacity ?? 10)}
            onChange={handleQtyChange}
            label="Bundle Quantity / Seats"
            stockLabel={`Limited to ${Math.min(product.stock_quantity, product.tutorial_capacity ?? 10)} bundles`}
          />

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              className="btn bg-amber-700 hover:bg-amber-800 text-white flex-1 py-3.5 font-bold uppercase tracking-wider text-xs shadow-md rounded-xl transition"
              disabled={busy || product.stock_quantity <= 0}
              onClick={() => addToCart('bundle')}
            >
              ✨ Add Craft & Workshop to Cart — ₱{(bundleUnitPrice * qty).toFixed(2)}
            </button>
            <button
              type="button"
              className="btn-outline px-4 py-3 text-xs font-semibold rounded-xl"
              disabled={busy}
              onClick={messageArtisan}
            >
              💬 Message
            </button>
          </div>
        </div>
      )}

      {!loggedIn && (
        <div className="flex items-center gap-2 text-xs text-stone-600 bg-white p-3.5 rounded-xl border border-abaca-200 shadow-2xs">
          <span>💡</span>
          <span>You will be guided to sign in or register as a customer when booking or adding crafts to your basket.</span>
        </div>
      )}
    </div>
  );
}
