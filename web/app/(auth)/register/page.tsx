'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { register } from '@/lib/api';
import FormField, { inputClass } from '@/components/FormField';

type Role = 'employer' | 'provider';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('employer');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required.';
    if (!email.includes('@')) e.email = 'Enter a valid email.';
    if (password.length < 8) e.password = 'Password must be at least 8 characters.';
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    try {
      const data = await register({ name, email, password, role });
      Cookies.set('role', data.user?.role ?? role, { expires: 7 });
      router.push(role === 'provider' ? '/provider/dashboard' : '/employer/dashboard');
    } catch {
      setErrors({ form: 'Could not create account. Check your details and try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-4">
      <div className="w-full max-w-[440px]">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-[10px] bg-[#3D5AFE] flex items-center justify-center">
              <span className="text-white text-sm font-bold">W</span>
            </div>
            <span className="text-xl font-semibold text-[#15161A]">Welfare</span>
          </Link>
          <h1 className="text-2xl font-semibold text-[#15161A] mb-1.5">Create your account</h1>
          <p className="text-sm text-[#5B5F6B]">Free to start. No credit card required.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="bg-white rounded-[16px] border border-[#E7E9EE] shadow-[0_1px_2px_rgba(21,22,26,.04),0_4px_16px_rgba(21,22,26,.06)] p-6 space-y-4">
          {/* Role selector */}
          <div>
            <p className="text-sm font-medium text-[#15161A] mb-2">I am joining as</p>
            <div className="grid grid-cols-2 gap-2">
              {(['employer', 'provider'] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex flex-col items-center gap-1.5 px-4 py-3.5 rounded-[8px] border text-sm font-medium transition-all duration-[120ms] ${
                    role === r
                      ? 'border-[#3D5AFE] bg-[#3D5AFE]/5 text-[#3D5AFE]'
                      : 'border-[#E7E9EE] text-[#5B5F6B] hover:border-[#15161A]/20 hover:text-[#15161A]'
                  }`}
                >
                  <span className="text-xl">{r === 'employer' ? '🏢' : '🏪'}</span>
                  <span className="capitalize">{r}</span>
                </button>
              ))}
            </div>
          </div>

          <FormField label="Full name" id="name" required error={errors.name}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              className={inputClass(!!errors.name)}
            />
          </FormField>

          <FormField label="Email" id="email" required error={errors.email}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              className={inputClass(!!errors.email)}
            />
          </FormField>

          <FormField label="Password" id="password" required error={errors.password} hint="At least 8 characters">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              className={inputClass(!!errors.password)}
            />
          </FormField>

          {errors.form && (
            <p role="alert" className="text-sm text-[#D23B3B]">{errors.form}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold transition-all duration-[120ms] hover:bg-[#2E45C4] active:scale-[0.98] disabled:opacity-60 mt-2"
          >
            {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-[#5B5F6B] mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-[#3D5AFE] font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
