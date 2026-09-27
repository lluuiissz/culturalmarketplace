'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GcashClient({ orderId, total }: { orderId: number; total: number }) {
  const router = useRouter();
  const [step, setStep] = useState<'pay' | 'otp' | 'done'>('pay');
  const [mobile, setMobile] = useState('09');
  const [otp, setOtp] = useState('');
  const [ref, setRef] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function pay() {
    if (!/^09\d{9}$/.test(mobile)) { setError('Enter a valid 11-digit GCash mobile number.'); return; }
    setError('');
    setStep('otp');
  }

  async function confirmOtp() {
    setBusy(true);
    setError('');
    const res = await fetch(`/api/payment/gcash/${orderId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.status === 'success') {
      setRef(data.reference);
      setStep('done');
    } else {
      setError(data.message || 'Payment failed.');
    }
  }

  if (step === 'done') {
    return (
      <div className="mt-6 text-center">
        <div className="text-5xl">✅</div>
        <p className="mt-3 font-semibold text-sky-800">Payment successful</p>
        <p className="mt-1 text-sm text-stone-500">Reference: {ref}</p>
        <button className="btn-primary mt-6 w-full" onClick={() => router.push(`/order/success/${orderId}`)}>
          Continue to order
        </button>
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <div className="mt-6 space-y-4">
        <p className="text-sm text-stone-600">A 6-digit authorization code was sent to <b>{mobile}</b>. (Simulation: enter any 6 digits.)</p>
        <input className="input tracking-[0.4em]" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••••" />
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button className="btn-primary w-full" disabled={busy} onClick={confirmOtp}>{busy ? 'Processing…' : `Authorize ₱${total.toFixed(2)}`}</button>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <label className="block text-sm font-medium text-stone-700">GCash mobile number</label>
      <input className="input" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="09XXXXXXXXX" />
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button className="btn-primary w-full" disabled={busy} onClick={pay}>Next</button>
      <p className="text-center text-xs text-stone-400">This is a simulation for development. PayMongo integration uses PAYMENTS_MODE.</p>
    </div>
  );
}
