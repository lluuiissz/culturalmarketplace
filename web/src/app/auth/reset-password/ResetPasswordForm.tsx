'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';

export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const passOk = password.length >= 8;
  const matchOk = confirm !== '' && confirm === password;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!passOk || !matchOk) {
      setError('Please use at least 8 characters and make sure both passwords match.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (data.status === 'success') {
        setDone(true);
      } else {
        setError(data.message || 'Could not reset password.');
      }
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg border border-ochre-200 bg-ochre-50 px-3 py-3 text-sm font-medium leading-relaxed text-charcoal-900">
          Your password has been updated. You can now sign in with your new password.
        </p>
        <Link
          href="/auth/login"
          className="btn-primary flex min-h-[48px] w-full items-center justify-center font-bold"
        >
          Go to Sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}{' '}
          {error.toLowerCase().includes('expired') && (
            <Link href="/auth/forgot-password" className="font-semibold underline">
              Request a new link
            </Link>
          )}
        </p>
      )}

      <div>
        <label htmlFor="rp-password" className="mb-1 block text-sm font-medium text-stone-700">
          New password
        </label>
        <input
          id="rp-password"
          className="input min-h-[46px] w-full text-base"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
        <p className={`mt-1 text-xs ${passOk ? 'font-semibold text-ochre-800' : 'text-stone-500'}`}>
          {passOk ? 'Looks good ✓' : 'Must be 8+ characters'}
        </p>
      </div>

      <div>
        <label htmlFor="rp-confirm" className="mb-1 block text-sm font-medium text-stone-700">
          Confirm new password
        </label>
        <input
          id="rp-confirm"
          className="input min-h-[46px] w-full text-base"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
        />
        <p
          className={`mt-1 text-xs ${
            matchOk ? 'font-semibold text-ochre-800' : confirm ? 'font-medium text-crimson-600' : 'text-stone-500'
          }`}
        >
          {matchOk ? 'Passwords match ✓' : confirm ? "Passwords don't match yet" : 'Re-enter your new password'}
        </p>
      </div>

      <button className="btn-primary min-h-[48px] w-full font-bold" disabled={busy} type="submit">
        {busy ? 'Saving…' : 'Reset password'}
      </button>
    </form>
  );
}
