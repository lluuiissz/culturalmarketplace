'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface CheckoutItem {
  cart_item_id: number; name: string; price: number; quantity: number;
  variant: string | null; purchase_type: string; product_id: number; artisan_id: number;
}

export interface SavedAddress {
  id: number; label: string; full_name: string | null; phone: string | null;
  address: string; landmark: string | null; is_default: boolean;
}

const PHONE_RE = /^(09\d{9}|\+639\d{9})$/;

export default function CheckoutClient({
  items, profile, addresses,
}: {
  items: CheckoutItem[];
  profile: { name: string; phone: string };
  addresses: SavedAddress[];
}) {
  const router = useRouter();
  const defaultAddress = addresses.find((a) => a.is_default) ?? addresses[0] ?? null;

  // Contact info (required — feeds order records and the J&T shipping label)
  const [fullName, setFullName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  // Address source: saved address selection or manual entry
  const [selectedId, setSelectedId] = useState<number | 'new' | null>(defaultAddress ? defaultAddress.id : 'new');
  const [manualAddress, setManualAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [saveAddress, setSaveAddress] = useState(true);
  const [addressLabel, setAddressLabel] = useState('Home');
  const [notes, setNotes] = useState('');
  const [method, setMethod] = useState<'cash_on_delivery' | 'gcash'>('cash_on_delivery');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const selected = addresses.find((a) => a.id === selectedId) ?? null;
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const hasWorkshop = items.some((i) => i.purchase_type !== 'product');

  const effectiveAddress = selected ? selected.address : manualAddress;
  const effectivePhone = selected?.phone || phone;

  async function placeOrder() {
    setError('');
    // ---- Required customer information gate ----
    if (!fullName.trim()) { setError('Please enter your full name.'); return; }
    if (!PHONE_RE.test(effectivePhone.trim())) {
      setError('Please enter a valid Philippine mobile number (09xxxxxxxxx) — the courier needs it to deliver your parcel.');
      return;
    }
    if (!effectiveAddress.trim()) { setError('Please enter your shipping address.'); return; }
    if (hasWorkshop && method !== 'gcash') {
      setError('Tutorial bookings must be paid via GCash. Please select GCash as your payment method.');
      return;
    }

    setBusy(true);
    // Compose the full shipping address snapshot stored on the order
    const composedAddress = [
      fullName.trim(),
      effectivePhone.trim(),
      effectiveAddress.trim(),
      !selected && landmark.trim() ? `Landmark: ${landmark.trim()}` : '',
    ].filter(Boolean).join('\n');

    // Optionally save a manually-entered address into the address book
    if (!selected && saveAddress) {
      await fetch('/api/customer/account/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          label: addressLabel.trim() || 'Home',
          full_name: fullName.trim(),
          phone: effectivePhone.trim(),
          address: effectiveAddress.trim(),
          landmark: landmark.trim() || null,
          is_default: addresses.length === 0,
        }),
      }).catch(() => null);
    }

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: composedAddress, notes, payment_method: method, phone: effectivePhone.trim() }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.status === 'success') {
      router.push(data.redirect);
    } else {
      setError(data.message || 'Could not place the order.');
    }
  }

  if (items.length === 0) {
    return <p className="mt-8 text-stone-600">Your cart is empty — add something from the marketplace first.</p>;
  }

  return (
    <div className="mt-8 grid gap-8 md:grid-cols-2">
      <div className="space-y-4">
        {/* ---- Customer information (required) ---- */}
        <div className="card p-5">
          <h2 className="font-serif text-lg font-bold text-brand-900">Your information</h2>
          <p className="mt-1 text-xs text-stone-400">Needed for delivery and order updates.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Full name *</label>
              <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Juan Dela Cruz" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Mobile number *</label>
              <input className="input" value={selected?.phone ?? phone} disabled={Boolean(selected?.phone)}
                onChange={(e) => setPhone(e.target.value)} placeholder="09xxxxxxxxx" inputMode="tel" />
            </div>
          </div>
          {selected?.phone && <p className="mt-1 text-xs text-stone-400">Using the phone saved with this address.</p>}
        </div>

        {/* ---- Shipping address: saved book or new ---- */}
        <div className="card p-5">
          <h2 className="font-serif text-lg font-bold text-brand-900">Shipping address</h2>
          {addresses.length > 0 && (
            <div className="mt-3 space-y-2">
              {addresses.map((a) => (
                <label key={a.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${selectedId === a.id ? 'border-brand-600 bg-brand-50' : 'border-stone-200'}`}>
                  <input type="radio" name="addr" className="mt-1" checked={selectedId === a.id} onChange={() => setSelectedId(a.id)} />
                  <span className="text-sm">
                    <span className="font-semibold text-stone-800">{a.label}{a.is_default ? ' · default' : ''}</span>
                    <span className="block text-stone-500">{a.address}{a.landmark ? ` (${a.landmark})` : ''}</span>
                  </span>
                </label>
              ))}
              <label className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${selectedId === 'new' ? 'border-brand-600 bg-brand-50' : 'border-stone-200'}`}>
                <input type="radio" name="addr" checked={selectedId === 'new'} onChange={() => setSelectedId('new')} />
                <span className="text-sm font-semibold text-stone-800">+ Use a new address</span>
              </label>
            </div>
          )}

          {selectedId === 'new' && (
            <div className="mt-3 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Complete address *</label>
                <textarea className="input h-20" value={manualAddress} onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="Street, Barangay, Municipality, Province" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Landmark (optional)</label>
                <input className="input" value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="e.g. beside the barangay hall" />
              </div>
              <label className="flex items-center gap-2 text-sm text-stone-600">
                <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                Save this address to my address book
              </label>
              {saveAddress && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">Address label</label>
                  <input className="input" value={addressLabel} onChange={(e) => setAddressLabel(e.target.value)} placeholder="Home / Office" />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-serif text-lg font-bold text-brand-900">Notes to the artisan (optional)</h2>
          <input className="input mt-3" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="card p-5">
          <h2 className="font-serif text-lg font-bold text-brand-900">Payment method</h2>
          <div className="mt-3 space-y-2">
            <label className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${method === 'cash_on_delivery' ? 'border-brand-600 bg-brand-50' : 'border-stone-200'}`}>
              <input type="radio" name="pm" checked={method === 'cash_on_delivery'} onChange={() => setMethod('cash_on_delivery')} />
              <span>💵 Cash on Delivery</span>
            </label>
            <label className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${method === 'gcash' ? 'border-brand-600 bg-brand-50' : 'border-stone-200'}`}>
              <input type="radio" name="pm" checked={method === 'gcash'} onChange={() => setMethod('gcash')} />
              <span>📱 GCash {hasWorkshop ? '(required for workshop bookings)' : ''}</span>
            </label>
          </div>
          {hasWorkshop && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Your cart includes a tutorial booking — GCash payment is required and confirmed after admin verification.
            </p>
          )}
        </div>
      </div>

      <div className="card h-fit p-5">
        <h2 className="font-serif text-lg font-bold text-brand-900">Order summary</h2>
        <div className="mt-3 space-y-2 text-sm">
          {items.map((i) => (
            <div key={i.cart_item_id} className="flex justify-between gap-3">
              <span className="text-stone-600">{i.name}{i.variant ? ` (${i.variant})` : ''} × {i.quantity}</span>
              <span className="font-semibold">₱{(i.price * i.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-stone-100 pt-3">
          <div className="flex justify-between text-lg font-bold text-brand-700">
            <span>Total</span><span>₱{total.toFixed(2)}</span>
          </div>
        </div>
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button className="btn-primary mt-4 w-full" disabled={busy} onClick={placeOrder}>
          {busy ? 'Placing order…' : method === 'gcash' ? 'Place order & pay with GCash' : 'Place order'}
        </button>
        <p className="mt-2 text-center text-xs text-stone-400">
          {method === 'cash_on_delivery'
            ? 'Nothing is charged now — you pay cash when your parcel arrives.'
            : 'You\u2019ll confirm the payment in the next step — no charge happens on this page.'}
        </p>
      </div>
    </div>
  );
}
