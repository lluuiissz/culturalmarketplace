'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Shipment } from '@/lib/types';

// J&T-style 4-step booking wizard: sender → recipient → package → complete.
// Recipient details are displayed read-only (they belong to the customer).

interface Props {
  orderItemId: number;
  item: { name: string; quantity: number; variant: string | null; unitPrice: number };
  shippingAddress: string;
  customerName: string;
  declaredValue: number;
  prefill: { senderName: string; senderPhone: string; senderAddress: string };
  existingTracking: string | null;
}

const STEPS = ['Sender', 'Recipient', 'Package', 'Complete'];
const PHONE_RE = /^(09\d{9}|\+639\d{9})$/;

export default function ShipWizard({ orderItemId, item, shippingAddress, customerName, declaredValue, prefill, existingTracking }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [shipment, setShipment] = useState<Shipment | null>(null);

  // Step 1 — sender
  const [senderName, setSenderName] = useState(prefill.senderName);
  const [senderPhone, setSenderPhone] = useState(prefill.senderPhone);
  const [senderAddress, setSenderAddress] = useState(prefill.senderAddress);
  // Step 3 — package
  const [weight, setWeight] = useState('');
  const [len, setLen] = useState('');
  const [wid, setWid] = useState('');
  const [hei, setHei] = useState('');
  const [notes, setNotes] = useState('');

  function validateStep(s: number): string {
    if (s === 0) {
      if (!senderName.trim()) return 'Sender name is required.';
      if (!PHONE_RE.test(senderPhone.trim())) return 'Enter a valid PH mobile number (09xxxxxxxxx).';
      if (!senderAddress.trim()) return 'Pickup address is required.';
    }
    if (s === 2) {
      const w = Number(weight);
      if (!Number.isFinite(w) || w <= 0 || w > 50) return 'Weight must be between 0.01 and 50 kg.';
      for (const d of [len, wid, hei]) {
        if (d.trim() === '') continue;
        const n = Number(d);
        if (!Number.isFinite(n) || n <= 0 || n > 150) return 'Each dimension must be between 1 and 150 cm.';
      }
    }
    return '';
  }

  function next() {
    const v = validateStep(step);
    if (v) { setError(v); return; }
    setError('');
    setStep((x) => Math.min(3, x + 1));
  }

  async function confirm() {
    setBusy(true);
    setError('');
    const res = await fetch('/api/artisan/shipments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderItemId,
        sender_name: senderName.trim(),
        sender_phone: senderPhone.trim(),
        sender_address: senderAddress.trim(),
        weight_kg: Number(weight),
        length_cm: len ? Number(len) : null,
        width_cm: wid ? Number(wid) : null,
        height_cm: hei ? Number(hei) : null,
        notes: notes.trim() || null,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.status === 'success') {
      setShipment(data.shipment as Shipment);
      setStep(3);
      router.refresh();
    } else {
      setError(data.message ?? 'Booking failed.');
    }
  }

  // Already shipped: show the existing booking instead of the wizard
  if (existingTracking && !shipment) {
    return (
      <div className="card mt-6 p-6 text-center">
        <p className="text-4xl">📦</p>
        <p className="mt-2 font-semibold text-stone-800">This item is already booked for shipping.</p>
        <p className="mt-1 text-stone-500">Tracking: <span className="font-mono font-semibold text-brand-700">{existingTracking}</span></p>
        <a className="btn-outline mt-4 inline-block" href="/artisan/shipments">Manage shipments</a>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Progress indicator */}
      <ol className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${i < step ? 'bg-leaf-500 text-white' : i === step ? 'bg-brand-600 text-white' : 'bg-stone-200 text-stone-500'}`}>
              {i < step ? '✓' : i + 1}
            </span>
            <span className={`hidden text-sm sm:block ${i === step ? 'font-semibold text-brand-700' : 'text-stone-400'}`}>{label}</span>
            {i < 3 && <span className={`h-0.5 flex-1 ${i < step ? 'bg-leaf-500' : 'bg-stone-200'}`} />}
          </li>
        ))}
      </ol>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {/* Step 1: sender */}
      {step === 0 && (
        <section className="card mt-6 space-y-4 p-6">
          <h2 className="font-serif text-lg font-bold text-brand-900">Sender information</h2>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Name / Business name</label>
            <input className="input" value={senderName} onChange={(e) => setSenderName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Phone</label>
            <input className="input" placeholder="09xxxxxxxxx" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Pickup address</label>
            <textarea className="input h-20" value={senderAddress} onChange={(e) => setSenderAddress(e.target.value)} />
          </div>
        </section>
      )}

      {/* Step 2: recipient (read-only) */}
      {step === 1 && (
        <section className="card mt-6 space-y-3 p-6">
          <h2 className="font-serif text-lg font-bold text-brand-900">Recipient information</h2>
          <p className="rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500">From the customer's order — if something looks wrong, message the customer instead of editing.</p>
          <div className="rounded-xl border border-stone-200 p-4">
            <p className="font-semibold text-stone-800">{customerName}</p>
            <p className="mt-1 whitespace-pre-line text-sm text-stone-600">{shippingAddress}</p>
          </div>
        </section>
      )}

      {/* Step 3: package */}
      {step === 2 && (
        <section className="card mt-6 space-y-4 p-6">
          <h2 className="font-serif text-lg font-bold text-brand-900">Package information</h2>
          <div className="rounded-xl bg-stone-50 p-3 text-sm text-stone-600">
            <p className="font-semibold text-stone-800">{item.name} × {item.quantity}{item.variant ? ` (${item.variant})` : ''}</p>
            <p className="mt-1">Declared value: <b>₱{declaredValue.toFixed(2)}</b> (auto-computed from the order)</p>
            {declaredValue > 10000 && <p className="mt-1 text-amber-600">⚠ High-value item — J&T recommends purchasing insurance for items above ₱10,000.</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Weight (kg) *</label>
              <input className="input" type="number" step="0.01" min="0.01" max="50" placeholder="e.g. 0.85" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
            <div />
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Length (cm)</label>
              <input className="input" type="number" min="1" max="150" value={len} onChange={(e) => setLen(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Width (cm)</label>
              <input className="input" type="number" min="1" max="150" value={wid} onChange={(e) => setWid(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Height (cm)</label>
              <input className="input" type="number" min="1" max="150" value={hei} onChange={(e) => setHei(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Notes for the courier (optional)</label>
            <input className="input" placeholder="e.g. fragile — handmade woven item" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </section>
      )}

      {/* Step 4: complete */}
      {step === 3 && shipment && (
        <section className="card mt-6 p-6 text-center">
          <p className="text-5xl">✅</p>
          <h2 className="mt-2 font-serif text-xl font-bold text-brand-900">Order complete!</h2>
          <p className="mt-1 text-sm text-stone-500">The customer has been notified. Drop the parcel at any J&T Express branch with this tracking number:</p>
          <p className="mt-4 rounded-xl bg-brand-50 py-4 font-mono text-2xl font-bold tracking-wider text-brand-800">{shipment.tracking_number}</p>
          <dl className="mx-auto mt-4 max-w-md space-y-1 text-left text-sm text-stone-600">
            <div className="flex justify-between"><dt>From</dt><dd className="text-right">{shipment.sender_name}</dd></div>
            <div className="flex justify-between"><dt>To</dt><dd className="text-right">{shipment.recipient_name}</dd></div>
            <div className="flex justify-between"><dt>Weight</dt><dd>{shipment.weight_kg} kg</dd></div>
            <div className="flex justify-between"><dt>Declared value</dt><dd>₱{shipment.declared_value.toFixed(2)}</dd></div>
          </dl>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a className="btn-outline" href={`/artisan/orders/${orderItemId}/waybill`}>🖨 Print waybill</a>
            <a className="btn-primary" href="/artisan/shipments">Manage shipments</a>
          </div>
        </section>
      )}

      {/* Navigation */}
      {step < 3 && (
        <div className="mt-6 flex justify-between">
          <button className="btn-outline" disabled={step === 0} onClick={() => { setError(''); setStep((x) => x - 1); }}>← Back</button>
          {step < 2 ? (
            <button className="btn-primary" onClick={next}>Continue →</button>
          ) : (
            <button className="btn-primary" disabled={busy} onClick={confirm}>{busy ? 'Booking…' : 'Confirm & book shipment'}</button>
          )}
        </div>
      )}
    </div>
  );
}
