'use client';

import { useState, type FormEvent } from 'react';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState<{ message: string; devLink?: string } | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.status === 'success') {
        setSent({ message: data.message, devLink: data.dev_link });
      } else {
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg border border-ochre-200 bg-ochre-50 px-3 py-3 text-sm font-medium leading-relaxed text-charcoal-900">
          {sent.message}
        </p>
        <p className="text-xs leading-relaxed text-stone-500">
          The link is valid for 30 minutes. If nothing arrives after a few minutes, check your spam
          folder or try again.
        </p>

        {sent.devLink && (
          <p className="break-all rounded-lg bg-stone-100 px-3 py-2 text-[11px] text-stone-600">
            Dev only:{' '}
            <a className="font-semibold text-crimson-700 underline" href={sent.devLink}>
              open reset link
            </a>
          </p>
        )}

        <button
          type="button"
          className="btn-outline min-h-[46px] w-full"
          onClick={() => {
            setSent(null);
            setEmail('');
          }}
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div>
        <label htmlFor="fp-email" className="mb-1 block text-sm font-medium text-stone-700">
          Email
        </label>
        <input
          id="fp-email"
          className="input min-h-[46px] w-full text-base"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </div>

      <button className="btn-primary min-h-[48px] w-full font-bold" disabled={busy} type="submit">
        {busy ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  );
}
