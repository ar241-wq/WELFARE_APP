'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import FormField, { inputClass } from '@/components/FormField';
import { useToast } from '@/components/Toast';
import { createPerk } from '@/lib/api';
import { ArrowLeft, X } from 'lucide-react';

const CATEGORIES = ['Wellness', 'Food', 'Travel', 'Learning', 'Connectivity', 'Lifestyle'];

export default function NewListingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required.';
    if (!category) e.category = 'Select a category.';
    if (!price || Number(price) <= 0) e.price = 'Enter a valid credit price.';
    return e;
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    try {
      await createPerk({ name, category: category.toLowerCase(), credit_price: Number(price), description, tags });
      toast('Perk listed successfully', 'success');
      router.push('/provider/listings');
    } catch {
      toast('Could not create perk. Try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell role="provider" pageTitle="New Perk">
      <div className="max-w-xl">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-[#5B5F6B] hover:text-[#15161A] mb-5 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to listings
        </button>

        <form onSubmit={handleSubmit} noValidate className="bg-white rounded-[12px] border border-[#E7E9EE] shadow-[0_1px_2px_rgba(21,22,26,.04),0_4px_16px_rgba(21,22,26,.06)] p-6 space-y-5">
          <h2 className="text-base font-semibold text-[#15161A]">List a new perk</h2>

          <FormField label="Perk name" id="perk-name" required error={errors.name}>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Monthly Gym Membership" className={inputClass(!!errors.name)} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Category" id="category" required error={errors.category}>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass(!!errors.category)}>
                <option value="">Select…</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>

            <FormField label="Credit price" id="price" required error={errors.price}>
              <div className="relative">
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="100"
                  min="1"
                  className={`${inputClass(!!errors.price)} pr-10 tabular`}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#5B5F6B]">cr</span>
              </div>
            </FormField>
          </div>

          <FormField label="Description" id="description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this perk include? Who is it for?"
              rows={3}
              className={inputClass()}
              style={{ resize: 'vertical' }}
            />
          </FormField>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-[#15161A] block mb-1.5">Tags</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Type and press Enter"
                className={`${inputClass()} flex-1`}
              />
              <button type="button" onClick={addTag} className="px-3 py-2 rounded-[8px] border border-[#E7E9EE] text-sm text-[#5B5F6B] hover:bg-[#F7F8FA]">Add</button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F7F8FA] border border-[#E7E9EE] text-xs font-medium text-[#5B5F6B]">
                    {t}
                    <button type="button" onClick={() => setTags((prev) => prev.filter((x) => x !== t))} className="hover:text-[#D23B3B]">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-[#E7E9EE] flex gap-2">
            <button type="button" onClick={() => router.back()} className="px-4 py-2.5 rounded-[8px] border border-[#E7E9EE] text-sm font-medium text-[#5B5F6B] hover:bg-[#F7F8FA]">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] disabled:opacity-60">
              {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {submitting ? 'Listing…' : 'List perk'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
