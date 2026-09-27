'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Registration with inline validation: fields turn green as they become valid,
// soft red the moment they're wrong — never wait for Submit to reveal errors.
// Microcopy states requirements *before* typing, not after failure.

type FieldState = 'empty' | 'valid' | 'invalid';

function mark(v: string, ok: boolean): FieldState {
  return v.trim() === '' ? 'empty' : ok ? 'valid' : 'invalid';
}

const RING: Record<FieldState, string> = {
  empty: '',
  valid: 'border-leaf-500 focus:border-leaf-500 focus:ring-leaf-500',
  invalid: 'border-red-400 focus:border-red-500 focus:ring-red-500',
};
const HINT: Record<FieldState, string> = {
  empty: 'text-stone-500',
  valid: 'text-leaf-700',
  invalid: 'text-red-600',
};
const ICON: Record<FieldState, string> = { empty: '', valid: ' ✓', invalid: ' ✕' };

export default function CustomerRegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '', password_confirmation: '', terms: false });
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [otpDelivered, setOtpDelivered] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // Live validation mirrors the server's rules exactly.
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const phoneOk = /^09\d{9}$/.test(form.phone.trim());
  const passOk = form.password.length >= 8;
  const matchOk = form.password_confirmation !== '' && form.password_confirmation === form.password;
  const formValid = form.first_name.trim() && form.last_name.trim() && emailOk && phoneOk && passOk && matchOk && form.terms;

  const emailState = mark(form.email, emailOk);
  const phoneState = mark(form.phone.trim(), phoneOk);
  const passState = mark(form.password, passOk);
  const matchState = mark(form.password_confirmation, matchOk);

  async function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!formValid) {
      setError('Please fix the highlighted fields before continuing.');
      return;
    }
    setBusy(true);
    setError('');
    const res = await fetch('/api/auth/register-customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (data.status === 'success') {
      setDevOtp(data.dev_otp ?? '');
      setOtpDelivered(!data.dev_otp);
      setStep(2);
    } else {
      setError(data.message || 'Registration failed.');
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email, otp }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.status === 'success') {
      router.push(data.redirect);
      router.refresh();
    } else {
      setError(data.message || 'Verification failed.');
    }
  }

  async function resend() {
    setInfo('');
    const res = await fetch('/api/auth/register-customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.status === 'success') {
      setDevOtp(data.dev_otp ?? '');
      setOtpDelivered(!data.dev_otp);
      setInfo(data.message);
    } else {
      setError(data.message || 'Could not resend the code.');
    }
  }

  if (step === 2) {
    return (
      <form onSubmit={verifyOtp} className="mt-6 space-y-4">
        {/* Honest status: email sent vs. code shown — no jargon, no false promises */}
        {otpDelivered && !devOtp && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            📧 We emailed a 6-digit code to <b>{form.email}</b>. It may take a minute to arrive.
          </p>
        )}
        {devOtp && (
          <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Email delivery isn&apos;t available right now, so here is your code directly:
            <b className="ml-1 text-base tracking-widest">{devOtp}</b>
          </div>
        )}
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {info && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</p>}
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">6-digit code</label>
          <input
            className="input tracking-[0.4em]"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="••••••"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
          />
          <p className="mt-1 text-xs text-stone-500">The code expires in 10 minutes.</p>
        </div>
        <button className="btn-primary w-full" disabled={busy} type="submit">{busy ? 'Verifying…' : 'Verify & create account'}</button>
        <button type="button" className="btn-outline w-full" onClick={resend} disabled={busy}>Resend code</button>
      </form>
    );
  }

  return (
    <form onSubmit={submitDetails} className="mt-6 space-y-4" noValidate>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">First name</label>
          <input className="input" value={form.first_name} onChange={(e) => set('first_name', e.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Last name</label>
          <input className="input" value={form.last_name} onChange={(e) => set('last_name', e.target.value)} required />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Email</label>
        <input className={`input ${RING[emailState]}`} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
        {emailState !== 'empty' && (
          <p className={`mt-1 text-xs ${HINT[emailState]}`}>{emailOk ? 'Looks good ✓' : 'Please use a full address, e.g. you@example.com'}</p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Mobile number</label>
        <input className={`input ${RING[phoneState]}`} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="09123456789" inputMode="numeric" required />
        <p className={`mt-1 text-xs ${HINT[phoneState]}`}>
          {phoneOk ? 'Looks good ✓' : '11 digits starting with 09 — we use this for delivery coordination'}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Password</label>
          <input className={`input ${RING[passState]}`} type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required />
          {/* Requirements shown BEFORE typing — anxiety point addressed up front */}
          <p className={`mt-1 text-xs ${HINT[passState]}`}>
            {passOk ? 'Looks good ✓' : 'Must be 8+ characters'}
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Confirm password</label>
          <input className={`input ${RING[matchState]}`} type="password" value={form.password_confirmation} onChange={(e) => set('password_confirmation', e.target.value)} required />
          <p className={`mt-1 text-xs ${HINT[matchState]}`}>
            {matchOk ? 'Passwords match ✓' : form.password_confirmation ? "Passwords don't match yet" : 'Re-enter your password'}
          </p>
        </div>
      </div>
      <label className="flex items-start gap-2 text-sm text-stone-600">
        <input type="checkbox" className="mt-0.5" checked={form.terms} onChange={(e) => set('terms', e.target.checked)} />
        <span>I agree to the Terms &amp; Conditions and Privacy Policy</span>
      </label>
      {/* Dominant single CTA; busy state speaks in human language */}
      <button className="btn-primary w-full" disabled={busy} type="submit">{busy ? 'Creating your account…' : 'Continue'}</button>
      <p className="text-center text-xs text-stone-500">Free to join — you&apos;ll only be charged when you buy something.</p>
    </form>
  );
}
