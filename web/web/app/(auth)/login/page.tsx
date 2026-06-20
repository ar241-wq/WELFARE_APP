'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { login } from '@/lib/api';
import FormField, { inputClass } from '@/components/FormField';
import { useToast } from '@/components/Toast';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      Cookies.set('role', data.user?.role ?? data.role ?? '', { expires: 7 });
      const role = data.user?.role ?? data.role;
      router.push(role === 'provider' ? '/provider/dashboard' : '/employer/dashboard');
    } catch {
      setError('Email or password is incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        {/* Brand */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-[10px] bg-[#3D5AFE] flex items-center justify-center">
              <span className="text-white text-sm font-bold">W</span>
            </div>
            <span className="text-xl font-semibold text-[#15161A]">Welfare</span>
          </Link>
          <h1 className="text-2xl font-semibold text-[#15161A] mb-1.5">Welcome back</h1>
          <p className="text-sm text-[#5B5F6B]">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="bg-white rounded-[16px] border border-[#E7E9EE] shadow-[0_1px_2px_rgba(21,22,26,.04),0_4px_16px_rgba(21,22,26,.06)] p-6 space-y-4">
          <FormField label="Email" id="email" required>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              required
              className={inputClass()}
            />
          </FormField>

          <FormField label="Password" id="password" required>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className={inputClass()}
            />
          </FormField>

          {error && (
            <p role="alert" className="text-sm text-[#D23B3B]">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold transition-all duration-[120ms] hover:bg-[#2E45C4] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-[#5B5F6B] mt-5">
          No account?{' '}
          <Link href="/register" className="text-[#3D5AFE] font-medium hover:underline">
            Get started
          </Link>
        </p>
      </div>
    </div>
  );
}
