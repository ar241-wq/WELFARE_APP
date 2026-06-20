'use client';

import { useEffect, useRef, useState } from 'react';
import AppShell from '@/components/AppShell';
import FormField, { inputClass } from '@/components/FormField';
import AnimatedSection from '@/components/AnimatedSection';
import { useToast } from '@/components/Toast';
import { getCompanySettings, updateCompanySettings, uploadLogo, getMe } from '@/lib/api';
import { mockSettings } from '@/lib/mock-data';
import { Save, Info, Upload } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
function resolveUrl(src?: string | null) {
  if (!src) return null;
  if (src.startsWith('http') || src.startsWith('data:')) return src;
  return `${API_URL}${src}`;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const logoRef = useRef<HTMLInputElement>(null);
  const [budget, setBudget] = useState('');
  const [rollover, setRollover] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    Promise.all([getCompanySettings(), getMe()])
      .then(([d, me]) => {
        setBudget(String(d.monthly_budget_per_employee ?? mockSettings.monthly_budget_per_employee));
        setRollover(d.credits_rollover ?? mockSettings.credits_rollover);
        setLogoUrl(resolveUrl(me.avatar));
      })
      .catch(() => {
        setBudget(String(mockSettings.monthly_budget_per_employee));
        setRollover(mockSettings.credits_rollover);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setLogoUploading(true);
    try {
      const data = await uploadLogo(e.target.files[0]);
      setLogoUrl(resolveUrl(data.avatar));
      toast('Logo updated', 'success');
    } catch {
      toast('Could not upload logo', 'error');
    } finally {
      setLogoUploading(false);
      if (logoRef.current) logoRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateCompanySettings({ monthly_budget_per_employee: Number(budget), credits_rollover: rollover });
    } catch { /* demo */ }
    toast('Settings saved', 'success');
    setSaving(false);
  };

  const monthlyTotal = Number(budget) * 47; // approximate headcount from mock

  return (
    <AppShell role="employer" pageTitle="Settings">
      <div className="max-w-2xl space-y-6">
        <AnimatedSection direction="up">
          <h2 className="text-base font-semibold text-[#15161A]">Company settings</h2>
          <p className="text-xs text-[#5B5F6B] mt-0.5">Configure budget allocations and credit behaviour for your organisation</p>
        </AnimatedSection>

        {/* Logo upload */}
        <AnimatedSection direction="up" delay={40}>
          <div className="bg-white rounded-[16px] border border-[#E7E9EE] p-6 flex items-center gap-5">
            <div className="relative shrink-0">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="logo" className="w-16 h-16 rounded-full object-cover border-2 border-[#E7E9EE]" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#3D5AFE]/10 flex items-center justify-center border-2 border-dashed border-[#3D5AFE]/30">
                  <span className="text-2xl font-bold text-[#3D5AFE]">E</span>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#15161A] mb-0.5">Company logo</p>
              <p className="text-xs text-[#5B5F6B] mb-3">Shows in the sidebar and on your profile</p>
              <button
                type="button"
                onClick={() => logoRef.current?.click()}
                disabled={logoUploading}
                className="flex items-center gap-2 px-3 py-2 rounded-[8px] border border-[#E7E9EE] text-sm font-medium text-[#5B5F6B] hover:border-[#3D5AFE] hover:text-[#3D5AFE] transition-colors disabled:opacity-50"
              >
                {logoUploading
                  ? <span className="w-4 h-4 border-2 border-[#3D5AFE]/30 border-t-[#3D5AFE] rounded-full animate-spin" />
                  : <Upload size={14} />}
                {logoUploading ? 'Uploading…' : 'Upload logo'}
              </button>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection direction="up" delay={60}>
          <form onSubmit={handleSave} className="bg-white rounded-[16px] border border-[#E7E9EE] shadow-[0_1px_2px_rgba(21,22,26,.04),0_4px_16px_rgba(21,22,26,.06)] divide-y divide-[#F7F8FA]">

            {/* Budget section */}
            <div className="p-6">
              <p className="text-xs font-semibold text-[#5B5F6B] uppercase tracking-wider mb-4">Monthly budget</p>
              {loading ? (
                <div className="space-y-3">
                  <div className="h-4 shimmer rounded w-1/3" />
                  <div className="h-10 shimmer rounded" />
                </div>
              ) : (
                <div className="space-y-4">
                  <FormField
                    label="Credits per employee per month"
                    id="budget"
                    required
                    hint="Allocated at the start of every calendar month"
                  >
                    <div className="relative">
                      <input
                        type="number"
                        id="budget"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        placeholder="500"
                        min="0"
                        step="50"
                        required
                        className={`${inputClass()} pr-12 tabular`}
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#5B5F6B] font-medium">cr</span>
                    </div>
                  </FormField>

                  {/* Live estimate */}
                  {Number(budget) > 0 && (
                    <div className="flex items-start gap-2.5 px-3.5 py-3 bg-[#3D5AFE]/5 rounded-[8px] border border-[#3D5AFE]/10">
                      <Info size={14} className="text-[#3D5AFE] mt-0.5 shrink-0" />
                      <p className="text-xs text-[#3D5AFE]">
                        At <span className="font-semibold tabular">{Number(budget).toLocaleString()} cr</span>/employee, your organisation of ~47 people will cost approximately{' '}
                        <span className="font-semibold tabular">{monthlyTotal.toLocaleString()} cr</span>/month.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Rollover section */}
            <div className="p-6">
              <p className="text-xs font-semibold text-[#5B5F6B] uppercase tracking-wider mb-4">Credit behaviour</p>
              {loading ? (
                <div className="h-4 shimmer rounded w-1/2" />
              ) : (
                <button
                  type="button"
                  role="switch"
                  aria-checked={rollover}
                  onClick={() => setRollover((v) => !v)}
                  className="flex items-start gap-4 w-full text-left group"
                >
                  <div
                    className="relative mt-0.5 w-10 shrink-0 rounded-full transition-colors duration-[150ms]"
                    style={{ height: '22px', background: rollover ? '#3D5AFE' : '#E7E9EE' }}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-[150ms] ${rollover ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#15161A]">Roll over unused credits</p>
                    <p className="text-xs text-[#5B5F6B] mt-0.5">
                      {rollover
                        ? 'Unused credits carry into the next month — employees never lose what they haven\'t spent.'
                        : 'Unused credits expire at month end. This encourages regular engagement with perks.'}
                    </p>
                  </div>
                </button>
              )}
            </div>

            {/* Save */}
            <div className="p-6 flex items-center justify-between">
              <p className="text-xs text-[#5B5F6B]">Changes take effect from the next monthly allocation</p>
              <button
                type="submit"
                disabled={saving || loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] transition-colors disabled:opacity-60 active:scale-[0.98]"
              >
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                {saving ? 'Saving…' : 'Save settings'}
              </button>
            </div>
          </form>
        </AnimatedSection>
      </div>
    </AppShell>
  );
}
