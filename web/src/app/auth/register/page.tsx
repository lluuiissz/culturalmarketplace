import CustomerRegisterForm from './CustomerRegisterForm';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <h1 className="font-serif text-2xl font-bold text-brand-900">Create your account</h1>
          <p className="mt-1 text-sm text-stone-500">Join as a customer to support local artisans</p>
          <CustomerRegisterForm />
          <p className="mt-6 text-center text-sm text-stone-500">
            Already have an account? <Link className="font-semibold text-brand-600 hover:underline" href="/auth/login">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
