'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!terms) {
      setError('Please agree to the Terms & Conditions and Privacy Policy to continue.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.status === 'success') {
        router.push(data.redirect);
        router.refresh();
      } else {
        setError(data.message || 'Login failed.');
        setBusy(false);
      }
    } catch {
      setError('Unable to connect. Please try again.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-600">Email</label>
        <input
          className="input !rounded-lg !py-1.5"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-600">Password</label>
        <input
          className="input !rounded-lg !py-1.5"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </div>

      {/* Terms and Conditions + Forgot password, level on one line */}
      <div className="flex items-center justify-between gap-4">
        <label className="flex min-w-0 items-center gap-3 text-xs leading-relaxed text-stone-600 sm:text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 shrink-0 accent-[#8B0000]"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            required
          />

          <span className="min-w-0">
            I agree to the Terms &amp; Conditions and Privacy Policy
          </span>
        </label>

        <Link
          href="/auth/forgot-password"
          className="shrink-0 whitespace-nowrap text-xs font-semibold text-crimson-700 hover:underline sm:text-sm"
        >
          Forgot password?
        </Link>
      </div>

      <button
        className="btn-primary w-full !rounded-md !bg-[#9E0000] !py-1.5 text-sm font-bold hover:!bg-[#8B0000] disabled:opacity-60"
        disabled={busy}
        type="submit"
      >
        {busy ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  );
}
