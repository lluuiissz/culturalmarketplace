'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type FieldState = 'empty' | 'valid' | 'invalid';

function mark(v: string, ok: boolean): FieldState {
  return v.trim() === '' ? 'empty' : ok ? 'valid' : 'invalid';
}

const RING: Record<FieldState, string> = {
  empty: '',
  valid: 'border-ochre-500 focus:border-ochre-500 focus:ring-ochre-500',
  invalid: 'border-crimson-400 focus:border-crimson-500 focus:ring-crimson-500',
};

const HINT: Record<FieldState, string> = {
  empty: 'text-stone-500',
  valid: 'text-ochre-800 font-semibold',
  invalid: 'text-crimson-600 font-medium',
};

export default function CustomerRegisterForm() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    terms: false,
  });

  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [otpDelivered, setOtpDelivered] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  function set<K extends keyof typeof form>(
    k: K,
    v: (typeof form)[K]
  ) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // Live validation
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const phoneOk = /^09\d{9}$/.test(form.phone.trim());
  const passOk = form.password.length >= 8;

  const matchOk =
    form.password_confirmation !== '' &&
    form.password_confirmation === form.password;

  const formValid = Boolean(
    form.first_name.trim() &&
    form.last_name.trim() &&
    emailOk &&
    phoneOk &&
    passOk &&
    matchOk &&
    form.terms
  );

  const emailState = mark(form.email, emailOk);
  const phoneState = mark(form.phone.trim(), phoneOk);
  const passState = mark(form.password, passOk);
  const matchState = mark(form.password_confirmation, matchOk);

  // Submit registration details
  async function submitDetails(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!formValid) {
      setError('Please fix the highlighted fields before continuing.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.status === 'success') {
        setDevOtp(data.dev_otp ?? '');
        setOtpDelivered(!data.dev_otp);
        setStep(2);
      } else {
        setError(data.message || 'Registration failed.');
      }
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  // Verify OTP
  async function verifyOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setBusy(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, otp }),
      });

      const data = await res.json();

      if (data.status === 'success') {
        router.push(data.redirect);
        router.refresh();
      } else {
        setError(data.message || 'Verification failed.');
      }
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  // Resend OTP
  async function resend() {
    setInfo('');
    setError('');
    setBusy(true);

    try {
      const res = await fetch('/api/auth/register-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.status === 'success') {
        setDevOtp(data.dev_otp ?? '');
        setOtpDelivered(!data.dev_otp);
        setInfo(data.message || 'A new verification code has been sent.');
      } else {
        setError(data.message || 'Could not resend the code.');
      }
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  // STEP 2: OTP Verification
  if (step === 2) {
    return (
      <form
        onSubmit={verifyOtp}
        className="mx-auto mt-4 w-full min-w-0 space-y-5 sm:mt-6"
      >
        {otpDelivered && !devOtp && (
          <p className="break-words rounded-lg border border-ochre-200 bg-ochre-50 px-3 py-3 text-sm font-medium text-charcoal-900">
            📧 We emailed a 6-digit code to <b>{form.email}</b>. It may take a minute to arrive.
          </p>
        )}

        {devOtp && (
          <div className="break-words rounded-lg border border-ochre-300 bg-ochre-50 px-3 py-3 text-sm text-ochre-900">
            Email delivery isn&apos;t available right now, so here is your code directly:
            <b className="ml-1 text-base tracking-widest">{devOtp}</b>
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {info && (
          <p className="rounded-lg border border-ochre-200 bg-ochre-50 px-3 py-2 text-sm font-medium text-ochre-900">
            {info}
          </p>
        )}

        <div className="min-w-0">
          <label className="mb-1 block text-sm font-medium text-stone-700">
            6-digit code
          </label>

          <input
            className="input min-h-[48px] w-full min-w-0 text-center text-base tracking-[0.4em]"
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
            }
            placeholder="••••••"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
          />

          <p className="mt-1 text-xs text-stone-500">
            The code expires in 10 minutes.
          </p>
        </div>

        <button
          className="btn-primary min-h-[48px] w-full"
          disabled={busy}
          type="submit"
        >
          {busy ? 'Verifying…' : 'Verify & create account'}
        </button>

        <button
          type="button"
          className="btn-outline min-h-[48px] w-full"
          onClick={resend}
          disabled={busy}
        >
          Resend code
        </button>
      </form>
    );
  }

  // STEP 1: Registration Form
  return (
    <form
      onSubmit={submitDetails}
      className="mx-auto mt-4 w-full min-w-0 space-y-5 sm:mt-6 sm:space-y-5"
      noValidate
    >
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* First and Last Name */}
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
        <div className="min-w-0">
          <label className="mb-1 block text-sm font-medium text-stone-700">
            First name
          </label>

          <input
            className="input min-h-[46px] w-full min-w-0 text-base"
            value={form.first_name}
            onChange={(e) => set('first_name', e.target.value)}
            autoComplete="given-name"
            required
          />
        </div>

        <div className="min-w-0">
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Last name
          </label>

          <input
            className="input min-h-[46px] w-full min-w-0 text-base"
            value={form.last_name}
            onChange={(e) => set('last_name', e.target.value)}
            autoComplete="family-name"
            required
          />
        </div>
      </div>

      {/* Email */}
      <div className="min-w-0">
        <label className="mb-1 block text-sm font-medium text-stone-700">
          Email
        </label>

        <input
          className={`input min-h-[46px] w-full min-w-0 text-base ${RING[emailState]}`}
          type="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          autoComplete="email"
          required
        />

        {emailState !== 'empty' && (
          <p className={`mt-1 text-xs ${HINT[emailState]}`}>
            {emailOk
              ? 'Looks good ✓'
              : 'Please use a full address, e.g. you@example.com'}
          </p>
        )}
      </div>

      {/* Mobile Number */}
      <div className="min-w-0">
        <label className="mb-1 block text-sm font-medium text-stone-700">
          Mobile number
        </label>

        <input
          className={`input min-h-[46px] w-full min-w-0 text-base ${RING[phoneState]}`}
          type="tel"
          value={form.phone}
          onChange={(e) => set('phone', e.target.value)}
          placeholder="09123456789"
          inputMode="numeric"
          autoComplete="tel"
          maxLength={11}
          required
        />

        <p className={`mt-1 text-xs leading-relaxed ${HINT[phoneState]}`}>
          {phoneOk
            ? 'Looks good ✓'
            : '11 digits starting with 09 — we use this for delivery coordination'}
        </p>
      </div>

      {/* Password and Confirmation */}
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
        <div className="min-w-0">
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Password
          </label>

          <input
            className={`input min-h-[46px] w-full min-w-0 text-base ${RING[passState]}`}
            type="password"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            autoComplete="new-password"
            required
          />

          <p className={`mt-1 text-xs ${HINT[passState]}`}>
            {passOk ? 'Looks good ✓' : 'Must be 8+ characters'}
          </p>
        </div>

        <div className="min-w-0">
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Confirm password
          </label>

          <input
            className={`input min-h-[46px] w-full min-w-0 text-base ${RING[matchState]}`}
            type="password"
            value={form.password_confirmation}
            onChange={(e) =>
              set('password_confirmation', e.target.value)
            }
            autoComplete="new-password"
            required
          />

          <p className={`mt-1 text-xs ${HINT[matchState]}`}>
            {matchOk
              ? 'Passwords match ✓'
              : form.password_confirmation
                ? "Passwords don't match yet"
                : 'Re-enter your password'}
          </p>
        </div>
      </div>

      {/* Terms and Conditions */}
      <label className="flex min-w-0 items-start gap-3 text-xs leading-relaxed text-stone-600 sm:text-sm">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#8B0000]"
          checked={form.terms}
          onChange={(e) => set('terms', e.target.checked)}
          required
        />

        <span className="min-w-0">
          I agree to the Terms &amp; Conditions and Privacy Policy
        </span>
      </label>

      {/* Submit */}
      <button
        className="btn-primary min-h-[48px] w-full text-sm font-bold"
        disabled={busy}
        type="submit"
      >
        {busy ? 'Creating your account…' : 'Continue'}
      </button>

      
    </form>
  );
}
