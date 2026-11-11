import Link from 'next/link';
import AuthShell from '@/components/AuthShell';
import AuthCard from '@/components/AuthCard';
import { getResetEmail } from '@/lib/passwordReset';
import ResetPasswordForm from './ResetPasswordForm';

export const dynamic = 'force-dynamic';

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!user || !domain) return email;
  return `${user.slice(0, 2)}${'*'.repeat(Math.max(1, user.length - 2))}@${domain}`;
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const email = token ? await getResetEmail(token) : null;

  return (
    <AuthShell width="md" centered>
      {email && token ? (
        <AuthCard
          title="Set a new password"
          subtitle={`Choose a new password for ${maskEmail(email)}.`}
        >
          <ResetPasswordForm token={token} />
        </AuthCard>
      ) : (
        <AuthCard
          title="Link expired or invalid"
          subtitle="This password reset link is no longer valid. Links expire after 30 minutes and can only be used once."
        >
          <Link
            href="/auth/forgot-password"
            className="btn-primary flex min-h-[48px] w-full items-center justify-center font-bold"
          >
            Request a new link
          </Link>
        </AuthCard>
      )}
    </AuthShell>
  );
}
