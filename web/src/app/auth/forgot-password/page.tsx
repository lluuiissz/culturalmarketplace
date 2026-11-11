import AuthShell from '@/components/AuthShell';
import AuthCard from '@/components/AuthCard';
import ForgotPasswordForm from './ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <AuthShell width="md" centered>
      <AuthCard
        title="Forgot your password?"
        subtitle="Enter the email you registered with and we will send you a link to set a new password."
      >
        <ForgotPasswordForm />
      </AuthCard>
    </AuthShell>
  );
}
