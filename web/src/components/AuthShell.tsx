import type { ReactNode } from 'react';
import AuthBackdrop from '@/components/AuthBackdrop';
import CraftShowcase from '@/components/CraftShowcase';

/**
 * AuthShell
 * Page wrapper that adds the woven background and the craft columns
 * around any auth-style page. Put the page content inside it.
 *
 *   width="xl"  -> content column is max-w-xl (576px)  [default]
 *   width="md"  -> content column is max-w-md (448px)
 *   centered    -> vertically centers the content (good for short pages)
 */
export default function AuthShell({
  children,
  width = 'xl',
  centered = false,
}: {
  children: ReactNode;
  width?: 'md' | 'xl';
  centered?: boolean;
}) {
  const maxW = width === 'md' ? 'max-w-md' : 'max-w-xl';
  const half = width === 'md' ? 224 : 288;

  return (
    <main
      className={`relative min-h-screen overflow-hidden bg-canvas px-4 py-10 ${
        centered ? 'flex items-center justify-center' : ''
      }`}
    >
      <AuthBackdrop />
      <CraftShowcase side="left" cardHalfWidth={half} />
      <CraftShowcase side="right" cardHalfWidth={half} />

      <div className={`relative mx-auto w-full ${maxW}`}>{children}</div>
    </main>
  );
}
