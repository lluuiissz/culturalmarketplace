'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface CheckoutItem {
  cart_item_id: number;
  name: string;
  price: number;
  quantity: number;
  variant: string | null;
  purchase_type: string;
  product_id: number;
  artisan_id: number;
  attendee_name?: string | null;
  attendee_for?: string | null;
}

export interface SavedAddress {
  id: number;
  label: string;
  full_name: string | null;
  phone: string | null;
  address: string;
  landmark: string | null;
  is_default: boolean;
}

const PHONE_RE = /^(09\d{9}|\+639\d{9})$/;

export default function CheckoutClient({
  items,
  profile,
  addresses,
}: {
  items: CheckoutItem[];
  profile: { name: string; phone: string };
  addresses: SavedAddress[];
}) {
  const router = useRouter();
  const defaultAddress = addresses.find((a) => a.is_default) ?? addresses[0] ?? null;

  // Contact info (required — feeds order records and the J&T shipping label)
  const [fullName, setFullName] = useState(defaultAddress?.full_name || profile.name);
  const [phone, setPhone] = useState(defaultAddress?.phone || profile.phone);

  // Address source: saved address selection or manual entry
  const [selectedId, setSelectedId] = useState<number | 'new' | null>(
    defaultAddress ? defaultAddress.id : 'new'
  );
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
  const hasPhysicalCraft = items.some((i) => i.purchase_type === 'product');

  const effectiveAddress = selected ? selected.address : manualAddress;
  const effectiveRecipientName = selected?.full_name || fullName;
  const effectivePhone = selected?.phone || phone;

  async function placeOrder() {
    setError('');

    // ---- Required customer information gate ----
    if (hasPhysicalCraft) {
      if (!effectiveRecipientName.trim()) {
        setError('Please enter the recipient full name for delivery.');
        return;
      }
      if (!PHONE_RE.test(effectivePhone.trim())) {
        setError(
          'Please enter a valid Philippine mobile number (09xxxxxxxxx) — the courier (J&T Express) needs it to deliver your parcel.'
        );
        return;
      }
      if (!effectiveAddress.trim()) {
        setError('Please select or enter the shipping address where the craft will be sent.');
        return;
      }
    } else {
      // Pure workshop booking: name & phone required for tickets
      if (!effectiveRecipientName.trim()) {
        setError('Please enter your full name for the workshop attendee registration.');
        return;
      }
      if (!PHONE_RE.test(effectivePhone.trim())) {
        setError('Please enter a valid Philippine mobile number (09xxxxxxxxx) for booking updates.');
        return;
      }
    }

    if (total > 0 && hasWorkshop && method !== 'gcash') {
      setError('Paid workshop bookings must be paid via GCash. Please select GCash as your payment method.');
      return;
    }

    setBusy(true);

    // Compose the full shipping address snapshot stored on the order
    const composedAddress = hasPhysicalCraft
      ? [
          effectiveRecipientName.trim(),
          effectivePhone.trim(),
          effectiveAddress.trim(),
          !selected && landmark.trim() ? `Landmark: ${landmark.trim()}` : (selected?.landmark ? `Landmark: ${selected.landmark}` : ''),
        ]
          .filter(Boolean)
          .join('\n')
      : 'Digital Workshop Booking (No Physical Shipping)';

    // Optionally save a manually-entered address into the address book
    if (selectedId === 'new' && saveAddress && manualAddress.trim()) {
      await fetch('/api/customer/account/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          label: addressLabel.trim() || 'Home',
          full_name: fullName.trim(),
          phone: phone.trim(),
          address: manualAddress.trim(),
          landmark: landmark.trim() || null,
          is_default: addresses.length === 0,
        }),
      }).catch(() => null);
    }

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: composedAddress,
        notes,
        payment_method: method,
        phone: effectivePhone.trim(),
        cart_item_ids: items.map((i) => i.cart_item_id),
      }),
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
      <div className="space-y-5">
        {/* ---- Destination / Delivery Address Section ---- */}
        {hasPhysicalCraft ? (
          <div className="card p-5 space-y-4 border-2 border-brand-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">📍</span>
                <h2 className="font-serif text-lg font-bold text-brand-900">
                  Choose Delivery Address
                </h2>
              </div>
              <p className="mt-1 text-xs text-stone-500">
                Select where you want your handcrafted products to be delivered.
              </p>
            </div>

            {/* Saved Address Cards */}
            {addresses.length > 0 && (
              <div className="space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Your Saved Addresses:
                </p>
                {addresses.map((a) => {
                  const isChecked = selectedId === a.id;
                  return (
                    <label
                      key={a.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${
                        isChecked
                          ? 'border-brand-600 bg-brand-50/80 ring-2 ring-brand-500/20 shadow-xs'
                          : 'border-stone-200 bg-white hover:bg-stone-50/60'
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery_address"
                        className="mt-1 accent-brand-600"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedId(a.id);
                          if (a.full_name) setFullName(a.full_name);
                          if (a.phone) setPhone(a.phone);
                        }}
                      />
                      <div className="flex-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900">{a.label}</span>
                          {a.is_default && (
                            <span className="badge bg-brand-200 text-brand-800 text-[10px]">Default</span>
                          )}
                          {isChecked && (
                            <span className="badge bg-leaf-500 text-white text-[10px]">Selected</span>
                          )}
                        </div>
                        <p className="mt-1 font-medium text-stone-800">
                          {a.full_name || fullName} · {a.phone || phone}
                        </p>
                        <p className="mt-0.5 text-stone-600 text-xs leading-relaxed">
                          {a.address}
                        </p>
                        {a.landmark && (
                          <p className="mt-0.5 text-xs text-stone-500">
                            📍 Landmark: {a.landmark}
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}

                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                    selectedId === 'new'
                      ? 'border-brand-600 bg-brand-50/80 ring-2 ring-brand-500/20'
                      : 'border-stone-200 bg-white hover:bg-stone-50/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="delivery_address"
                    className="accent-brand-600"
                    checked={selectedId === 'new'}
                    onChange={() => setSelectedId('new')}
                  />
                  <span className="text-sm font-semibold text-brand-800">
                    + Deliver to a different address
                  </span>
                </label>
              </div>
            )}

            {/* New / Manual Address Form */}
            {selectedId === 'new' && (
              <div className="space-y-3 rounded-xl bg-stone-50/80 p-4 border border-stone-200 text-sm">
                <p className="font-semibold text-stone-800 text-xs uppercase tracking-wider">
                  Enter Destination Address Details:
                </p>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-stone-700">Recipient Full Name *</label>
                    <input
                      className="input mt-1"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Juan Dela Cruz"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700">Recipient Mobile Number *</label>
                    <input
                      className="input mt-1"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09xxxxxxxxx"
                      inputMode="tel"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700">
                    Complete Street Address / Purok / Sitio *
                  </label>
                  <textarea
                    className="input mt-1 h-20"
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    placeholder="e.g. Purok 8, Simulao, Bunawan Brook, Bunawan, Agusan del Sur"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700">
                    Landmark / Delivery Instructions (optional)
                  </label>
                  <input
                    className="input mt-1"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Near the Catholic Chapel, Yellow Gate"
                  />
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-brand-600 rounded"
                      checked={saveAddress}
                      onChange={(e) => setSaveAddress(e.target.checked)}
                    />
                    <span>Save this address to my address book for future orders</span>
                  </label>

                  {saveAddress && (
                    <div className="mt-2 flex items-center gap-2">
                      <label className="text-xs text-stone-500 whitespace-nowrap">Address Label:</label>
                      <input
                        className="input text-xs py-1.5"
                        value={addressLabel}
                        onChange={(e) => setAddressLabel(e.target.value)}
                        placeholder="Home / Work / Shop"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Workshop Only Contact Form */
          <div className="card p-5 space-y-3">
            <h2 className="font-serif text-lg font-bold text-brand-900">
              Workshop Booking Contact
            </h2>
            <p className="text-xs text-stone-500">
              Your official workshop admission ticket and receipt will be issued to this contact.
            </p>
            {items.some((i) => i.attendee_name) && (
              <div className="rounded-lg bg-leaf-50/80 p-3 text-xs text-leaf-900 border border-leaf-200/80 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <span>👥</span> Registered Workshop Attendees:
                </p>
                <div className="space-y-0.5 pl-5">
                  {items.filter((i) => i.attendee_name).map((i) => (
                    <div key={i.cart_item_id} className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-stone-700">{i.name}:</span>{' '}
                      <span className="font-bold text-leaf-950">{i.attendee_name}</span>
                      {i.attendee_for === 'others' && (
                        <span className="rounded-full bg-amber-100 border border-amber-300 px-1.5 py-0.2 text-[10px] font-bold text-amber-900">
                          Guest / Group
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">Buyer / Contact Name *</label>
                <input
                  className="input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Juan Dela Cruz"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">Mobile Number *</label>
                <input
                  className="input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09xxxxxxxxx"
                  inputMode="tel"
                />
              </div>
            </div>
          </div>
        )}

        {/* Note to artisan */}
        <div className="card p-5">
          <h2 className="font-serif text-base font-bold text-brand-900">
            Notes or special instructions (optional)
          </h2>
          <input
            className="input mt-2 text-sm"
            placeholder="e.g. Please pack securely, call upon arrival"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Payment method */}
        <div className="card p-5 space-y-3">
          <h2 className="font-serif text-base font-bold text-brand-900">Payment method</h2>
          {total === 0 ? (
            <div className="rounded-xl border border-leaf-300 bg-leaf-50/70 p-4">
              <p className="font-bold text-leaf-900 flex items-center gap-1.5">
                <span>✨</span> Free Workshop Registration (₱0.00)
              </p>
              <p className="text-xs text-leaf-800 mt-1">
                This cultural crafting session is provided free of charge. No payment or credit card is required.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {!hasWorkshop && (
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                    method === 'cash_on_delivery'
                      ? 'border-brand-600 bg-brand-50/80 ring-2 ring-brand-500/20'
                      : 'border-stone-200 bg-white hover:bg-stone-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="pm"
                    className="accent-brand-600"
                    checked={method === 'cash_on_delivery'}
                    onChange={() => setMethod('cash_on_delivery')}
                  />
                  <div>
                    <p className="font-semibold text-stone-900">💵 Cash on Delivery (COD)</p>
                    <p className="text-xs text-stone-500">Pay when your parcel arrives via courier</p>
                  </div>
                </label>
              )}

              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                  method === 'gcash'
                    ? 'border-brand-600 bg-brand-50/80 ring-2 ring-brand-500/20'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <input
                  type="radio"
                  name="pm"
                  className="accent-brand-600"
                  checked={method === 'gcash'}
                  onChange={() => setMethod('gcash')}
                />
                <div>
                  <p className="font-semibold text-stone-900">📱 GCash E-Wallet</p>
                  <p className="text-xs text-stone-500">Instant simulation / verification</p>
                </div>
              </label>
            </div>
          )}

          {total > 0 && hasWorkshop && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              📌 Workshop session bookings require advance payment via GCash.
            </p>
          )}
        </div>
      </div>

      {/* Right Column: Order Summary & Delivery Snapshot */}
      <div className="space-y-4">
        <div className="card h-fit p-5 space-y-4 border border-stone-200 shadow-sm sticky top-20">
          <h2 className="font-serif text-lg font-bold text-brand-900 border-b border-stone-100 pb-2">
            Order summary ({items.length} item{items.length === 1 ? '' : 's'})
          </h2>

          <div className="space-y-3 text-sm divide-y divide-stone-100">
            {items.map((i) => (
              <div key={i.cart_item_id} className="pt-2 flex justify-between gap-3 first:pt-0">
                <div className="space-y-0.5">
                  <p className="font-semibold text-stone-800">{i.name}</p>
                  <p className="text-xs text-stone-500">
                    {i.purchase_type === 'workshop' ? '🌿 Workshop Booking' : '📦 Handcrafted Item'} × {i.quantity}
                  </p>
                  {i.variant && (
                    <p className="text-xs text-brand-700 font-medium">
                      🎨 {i.variant}
                    </p>
                  )}
                  {i.attendee_name && (
                    <div className="text-xs text-leaf-800 font-medium flex items-center gap-1.5 flex-wrap">
                      <span>👤 Attendee(s): {i.attendee_name}</span>
                      {i.attendee_for === 'others' && (
                        <span className="rounded-full bg-amber-50 border border-amber-200 px-1.5 py-0.2 text-[10px] font-semibold text-amber-800">
                          Guest / Group
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <span className="font-bold text-stone-900 font-mono">
                  ₱{(i.price * i.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Destination Snapshot Box */}
          {hasPhysicalCraft && (
            <div className="rounded-lg bg-brand-50/70 p-3 border border-brand-200/80 text-xs text-stone-700 space-y-1">
              <p className="font-bold text-brand-900 flex items-center gap-1">
                <span>🚚</span> Delivering to:
              </p>
              <p className="font-semibold text-stone-800">
                {effectiveRecipientName || 'Recipient Name'} · {effectivePhone || 'Phone'}
              </p>
              <p className="text-stone-600 line-clamp-2">
                {effectiveAddress || 'Please select or enter delivery address'}
              </p>
            </div>
          )}

          <div className="border-t border-stone-200 pt-3 space-y-1.5">
            <div className="flex justify-between text-xs text-stone-500">
              <span>Items Subtotal:</span>
              <span className="font-mono">₱{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-stone-500">
              <span>Shipping Fee:</span>
              <span className="text-leaf-700 font-medium">Free / Standard Included</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-brand-900 pt-1 border-t border-stone-100">
              <span>Total Amount:</span>
              <span className="font-mono">₱{total.toFixed(2)}</span>
            </div>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button
            className="btn-primary w-full py-3 font-bold text-base shadow-md"
            disabled={busy}
            onClick={placeOrder}
          >
            {busy
              ? 'Placing order…'
              : total === 0
              ? 'Confirm Free Workshop Booking →'
              : method === 'gcash'
              ? 'Place Order & Pay with GCash →'
              : 'Place Order (Cash on Delivery) →'}
          </button>

          <p className="text-center text-xs text-stone-400">
            {total === 0
              ? 'Your workshop ticket and session details will be issued immediately.'
              : method === 'cash_on_delivery'
              ? 'No upfront payment needed. Pay cash when your parcel is delivered.'
              : 'You will authorize your GCash payment in the next step.'}
          </p>
        </div>
      </div>
    </div>
  );
}
