import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect(session.role === 'admin' ? '/admin/dashboard' : session.role === 'artisan' ? '/artisan/dashboard' : '/customer/account/dashboard');
  }
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <h1 className="font-serif text-2xl font-bold text-brand-900">Welcome back</h1>
          <p className="mt-1 text-sm text-stone-500">Sign in to the Cultural Marketplace</p>
          <LoginForm />
          <p className="mt-6 text-center text-sm text-stone-500">
            New customer? <Link className="font-semibold text-brand-600 hover:underline" href="/auth/register">Create an account</Link>
            {' · '}
            <Link className="font-semibold text-brand-600 hover:underline" href="/auth/register-artisan">Sell as an artisan</Link>
          </p>
          <div className="mt-6 rounded-lg bg-brand-50 p-3 text-xs text-stone-600">
            <p className="font-semibold text-brand-900">Demo accounts (password: demo1234)</p>
            <p className="mt-1 font-mono">customer@demo.local · artisan@demo.local · admin@demo.local</p>
          </div>
        </div>
      </div>
    </main>
  );
}
