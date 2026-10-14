'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import type { Product } from '@/lib/types';

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

  return (
    <div className="mt-6 space-y-5">
      {msg && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</p>}

      {/* Choice Selector: Order Product vs Book Cultural Experience vs Bundle */}
      {product.has_tutorial && (
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Choose what you would like to do:
          </label>
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-stone-100 rounded-xl border border-stone-200 text-xs">
            {/* Option 1: Product Only */}
            <button
              type="button"
              onClick={() => setMode('product')}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-lg font-semibold transition text-center ${
                mode === 'product'
                  ? 'bg-white text-brand-900 shadow-sm border border-stone-300 ring-2 ring-brand-500/30'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50/50'
              }`}
            >
              <div className="flex items-center gap-1">
                <span>📦</span>
                <span>Order Craft</span>
              </div>
              <span className="text-[11px] font-normal text-stone-500">
                ₱{productPrice.toFixed(2)}
              </span>
            </button>

            {/* Option 2: Workshop Only */}
            <button
              type="button"
              onClick={() => setMode('workshop')}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-lg font-semibold transition text-center ${
                mode === 'workshop'
                  ? 'bg-white text-leaf-900 shadow-sm border border-stone-300 ring-2 ring-leaf-500/30'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50/50'
              }`}
            >
              <div className="flex items-center gap-1">
                <span>🌿</span>
                <span>Workshop</span>
              </div>
              <span className="text-[11px] font-normal text-stone-500">
                {product.tutorial_fee_type === 'free' ? 'Free' : `₱${workshopPrice.toFixed(2)}`}
              </span>
            </button>

            {/* Option 3: Craft + Workshop Bundle */}
            <button
              type="button"
              onClick={() => setMode('bundle')}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-lg font-semibold transition text-center ${
                mode === 'bundle'
                  ? 'bg-white text-amber-900 shadow-sm border border-amber-300 ring-2 ring-amber-500/30'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50/50'
              }`}
            >
              <div className="flex items-center gap-1">
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

      {/* Panel 1: Order Handcrafted Product Mode */}
      {mode === 'product' && (
        <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <span className="text-sm font-semibold text-stone-800">Product Customization</span>
            <span className="text-xs text-stone-400">
              {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
            </span>
          </div>

          {Object.entries(grouped).map(([label, opts]) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-stone-700">{label}</label>
                {selectedVariants[label] && (
                  <span className="text-[11px] text-brand-700 font-medium">Selected: {selectedVariants[label].name}</span>
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
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                        isSelected
                          ? 'border-brand-600 bg-brand-600 text-white shadow-xs'
                          : 'border-stone-300 bg-white text-stone-700 hover:border-brand-400'
                      }`}
                    >
                      {v.name} {Number(v.price) > 0 ? `(+₱${v.price})` : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex items-center gap-3 pt-1">
            <label className="text-xs font-medium text-stone-700">Quantity:</label>
            <input
              type="number"
              min={1}
              max={Math.max(1, product.stock_quantity)}
              value={qty}
              onChange={(e) => handleQtyChange(Number(e.target.value))}
              className="input w-20 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              className="btn-primary flex-1 py-2.5 font-bold shadow-sm"
              disabled={busy || product.stock_quantity <= 0}
              onClick={() => addToCart('product')}
            >
              🛒 Add Product to Cart — ₱{(productPrice * qty).toFixed(2)}
            </button>
            <button className="btn-outline" disabled={busy} onClick={messageArtisan} title="Chat with artisan">
              💬 Message
            </button>
          </div>
        </div>
      )}

      {/* Panel 2: Book Cultural Experience Mode */}
      {mode === 'workshop' && product.has_tutorial && (
        <div className="space-y-4 rounded-xl border border-leaf-300 bg-leaf-50/20 p-4">
          <div className="flex items-center justify-between border-b border-leaf-200 pb-2">
            <div>
              <p className="text-sm font-bold text-leaf-900">
                {product.tutorial_title || 'Cultural Workshop Booking'}
              </p>
              <p className="text-xs text-stone-500">Live, in-person crafting session in Agusan del Sur</p>
            </div>
            <span className="badge bg-leaf-600 text-white font-bold">
              {product.tutorial_fee_type === 'free' ? 'FREE' : `₱${workshopPrice.toFixed(2)}`}
            </span>
          </div>

          {product.tutorial_dates && product.tutorial_dates.length > 0 ? (
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-700">
                Select Your Session Date & Time:
              </label>
              <div className="space-y-2">
                {product.tutorial_dates.map((d, i) => (
                  <label
                    key={i}
                    className={`flex items-start gap-2.5 rounded-lg border p-2.5 cursor-pointer text-xs transition ${
                      session === i
                        ? 'border-leaf-600 bg-white ring-2 ring-leaf-500/20 shadow-xs'
                        : 'border-stone-200 bg-white/60 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="session"
                      className="mt-0.5 accent-leaf-600"
                      checked={session === i}
                      onChange={() => setSession(i)}
                    />
                    <div className="flex-1">
                      <p className="font-bold text-stone-800">📅 {d.date}</p>
                      <p className="text-stone-500">🕒 {d.time_start} – {d.time_end}</p>
                      {d.location && <p className="text-stone-500 mt-0.5">📍 {d.location}</p>}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-stone-500 italic">
              Artisan has not scheduled specific dates yet. Please message the artisan below to coordinate.
            </p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <label className="text-xs font-medium text-stone-700">Attendee Slots:</label>
            <input
              type="number"
              min={1}
              max={product.tutorial_capacity ?? 10}
              value={qty}
              onChange={(e) => handleQtyChange(Number(e.target.value))}
              className="input w-20 text-sm"
            />
            {product.tutorial_capacity && (
              <span className="text-xs text-stone-400">max {product.tutorial_capacity} slots</span>
            )}
          </div>

          {/* Attendee Booking Details (Self vs Others) */}
          <div className="rounded-lg bg-white p-3 border border-stone-200 space-y-2">
            <label className="text-xs font-bold uppercase text-stone-700 block">
              Who is this workshop booking for?
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label
                className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
                  attendeeFor === 'self'
                    ? 'border-leaf-600 bg-leaf-50/70 font-bold text-leaf-900 ring-1 ring-leaf-500'
                    : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <input
                  type="radio"
                  name="attendee_for"
                  className="accent-leaf-600"
                  checked={attendeeFor === 'self'}
                  onChange={() => setAttendeeFor('self')}
                />
                <span>👤 For Myself</span>
              </label>

              <label
                className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
                  attendeeFor === 'others'
                    ? 'border-leaf-600 bg-leaf-50/70 font-bold text-leaf-900 ring-1 ring-leaf-500'
                    : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <input
                  type="radio"
                  name="attendee_for"
                  className="accent-leaf-600"
                  checked={attendeeFor === 'others'}
                  onChange={() => setAttendeeFor('others')}
                />
                <span>👥 For Someone Else</span>
              </label>
            </div>

            {attendeeFor === 'others' && (
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <p className="text-[11px] text-stone-500">
                  Enter attendee name{qty > 1 ? 's' : ''}. The booking is registered under your account.
                </p>
                {Array.from({ length: qty }).map((_, idx) => (
                  <div key={idx}>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
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

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              className="btn bg-leaf-600 text-white hover:bg-leaf-700 flex-1 py-2.5 font-bold shadow-sm"
              disabled={busy}
              onClick={() => addToCart('workshop')}
            >
              🌿 Book Workshop Session — {product.tutorial_fee_type === 'free' ? 'FREE' : `₱${(workshopPrice * qty).toFixed(2)}`}
            </button>
            <button className="btn-outline" disabled={busy} onClick={messageArtisan}>
              💬 Message
            </button>
          </div>
        </div>
      )}

      {/* Panel 3: Combined Craft + Workshop Bundle Mode */}
      {mode === 'bundle' && product.has_tutorial && (
        <div className="space-y-4 rounded-xl border-2 border-amber-300 bg-amber-50/20 p-4">
          <div className="flex items-center justify-between border-b border-amber-200 pb-2">
            <div>
              <p className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
                <span>✨</span> Complete Cultural Experience Bundle
              </p>
              <p className="text-xs text-stone-600">
                Receive the authentic handcrafted craft AND attend the live artisan workshop.
              </p>
            </div>
            <span className="badge bg-amber-600 text-white font-bold">
              ₱{bundleUnitPrice.toFixed(2)}
            </span>
          </div>

          {/* 1. Craft Variant Section */}
          <div className="rounded-lg bg-white p-3 border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-stone-700">
                1. Choose Handcrafted Variation:
              </span>
              <span className="text-[11px] text-stone-400">
                {product.stock_quantity > 0 ? `${product.stock_quantity} craft pieces available` : 'Out of stock'}
              </span>
            </div>

            {Object.entries(grouped).map(([label, opts]) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700">{label}</label>
                  {selectedVariants[label] && (
                    <span className="text-[11px] text-amber-700 font-medium">Selected: {selectedVariants[label].name}</span>
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
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                          isSelected
                            ? 'border-amber-600 bg-amber-600 text-white shadow-xs'
                            : 'border-stone-300 bg-white text-stone-700 hover:border-amber-400'
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

          {/* 2. Workshop Session Picker */}
          <div className="rounded-lg bg-white p-3 border border-stone-200 space-y-2">
            <span className="text-xs font-bold uppercase text-stone-700">
              2. Select Workshop Session:
            </span>

            {product.tutorial_dates && product.tutorial_dates.length > 0 ? (
              <div className="space-y-2 pt-1">
                {product.tutorial_dates.map((d, i) => (
                  <label
                    key={i}
                    className={`flex items-start gap-2.5 rounded-lg border p-2 cursor-pointer text-xs transition ${
                      session === i
                        ? 'border-amber-600 bg-amber-50/50 ring-2 ring-amber-500/20 shadow-xs'
                        : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="bundle_session"
                      className="mt-0.5 accent-amber-600"
                      checked={session === i}
                      onChange={() => setSession(i)}
                    />
                    <div className="flex-1">
                      <p className="font-bold text-stone-800">📅 {d.date}</p>
                      <p className="text-stone-500">🕒 {d.time_start} – {d.time_end}</p>
                      {d.location && <p className="text-stone-500 mt-0.5">📍 {d.location}</p>}
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-500 italic">No scheduled dates yet. Message artisan to arrange.</p>
            )}
          </div>

          {/* 3. Attendee Booking Details (Self vs Others) */}
          <div className="rounded-lg bg-white p-3 border border-stone-200 space-y-2">
            <label className="text-xs font-bold uppercase text-stone-700 block">
              3. Who is this workshop session for?
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label
                className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
                  attendeeFor === 'self'
                    ? 'border-amber-600 bg-amber-50/70 font-bold text-amber-900 ring-1 ring-amber-500'
                    : 'border-stone-200 text-stone-700 hover:bg-stone-50'
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
                className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
                  attendeeFor === 'others'
                    ? 'border-amber-600 bg-amber-50/70 font-bold text-amber-900 ring-1 ring-amber-500'
                    : 'border-stone-200 text-stone-700 hover:bg-stone-50'
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
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <p className="text-[11px] text-stone-500">
                  Enter attendee name{qty > 1 ? 's' : ''}. The booking is registered under your account.
                </p>
                {Array.from({ length: qty }).map((_, idx) => (
                  <div key={idx}>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
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

          <div className="flex items-center gap-3 pt-1">
            <label className="text-xs font-medium text-stone-700">Quantity / Seats:</label>
            <input
              type="number"
              min={1}
              max={Math.min(Math.max(1, product.stock_quantity), product.tutorial_capacity ?? 10)}
              value={qty}
              onChange={(e) => handleQtyChange(Number(e.target.value))}
              className="input w-20 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              className="btn bg-amber-600 text-white hover:bg-amber-700 flex-1 py-3 font-bold shadow-md text-sm"
              disabled={busy || product.stock_quantity <= 0}
              onClick={() => addToCart('bundle')}
            >
              ✨ Add Craft & Workshop to Cart — ₱{(bundleUnitPrice * qty).toFixed(2)}
            </button>
            <button className="btn-outline" disabled={busy} onClick={messageArtisan}>
              💬 Message
            </button>
          </div>
        </div>
      )}

      {!loggedIn && (
        <p className="text-xs text-stone-500 text-center bg-stone-50 p-2.5 rounded-lg border border-stone-200">
          💡 You will be guided to sign in or join as a customer when booking or adding to cart.
        </p>
      )}
    </div>
  );
}
