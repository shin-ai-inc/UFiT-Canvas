/**
 * Register Page
 *
 * Philosophy-Driven Design - Unified Worldview
 * Technical Debt: ZERO
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RegisterForm from '../../components/auth/RegisterForm';
import { useAuthStore } from '../../stores/auth.store';

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 flex items-center justify-center p-8 relative overflow-hidden">
      {/* Ambient Depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100/40 via-transparent to-transparent pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <RegisterForm />
      </div>
    </main>
  );
}
