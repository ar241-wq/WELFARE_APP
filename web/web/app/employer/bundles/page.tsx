'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import Modal from '@/components/Modal';
import FormField, { inputClass } from '@/components/FormField';
import AnimatedSection from '@/components/AnimatedSection';
import { useToast } from '@/components/Toast';
import { getBundles, createBundle, assignBundle, getTeams, getMyPerks } from '@/lib/api';
import { mockBundles, mockTeams, mockMyPerks } from '@/lib/mock-data';
import { Package, Plus, Users, ChevronRight } from 'lucide-react';

interface Bundle { id: number; name: string; perks: { id: number; name: string; credit_price: number; is_active: boolean; category: string }[]; }
interface Team { id: number; name: string; }

const categoryColor: Record<string, string> = {
  wellness:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  learning:     'bg-blue-50 text-blue-700 border-blue-200',
  food:         'bg-orange-50 text-orange-700 border-orange-200',
  lifestyle:    'bg-purple-50 text-purple-700 border-purple-200',
  travel:       'bg-sky-50 text-sky-700 border-sky-200',
  connectivity: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

export default function BundlesPage() {
  const { toast } = useToast();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [perks, setPerks] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState<Bundle | null>(null);
  const [bundleName, setBundleName] = useState('');
  const [selectedPerks, setSelectedPerks] = useState<number[]>([]);
  const [assignTeam, setAssignTeam] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getBundles(), getTeams()])
      .catch(() => [mockBundles, mockTeams])
      .then(([b, t]) => {
        setBundles(Array.isArray(b) ? b : mockBundles);
        setTeams(Array.isArray(t) ? t : mockTeams);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    getMyPerks()
      .then((p) => setPerks(Array.isArray(p) ? p : mockMyPerks))
      .catch(() => setPerks(mockMyPerks));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bundleName || !selectedPerks.length) return;
    setSubmitting(true);
    try {
      await createBundle({ name: bundleName, perk_ids: selectedPerks });
      toast('Bundle created', 'success');
    } catch {
      toast('Bundle created (demo)', 'success');
    }
    setCreateOpen(false);
    setBundleName('');
    setSelectedPerks([]);
    setSubmitting(false);
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignOpen || !assignTeam) return;
    setSubmitting(true);
    try {
      await assignBundle(assignOpen.id, { team_id: Number(assignTeam) });
    } catch { /* demo */ }
    toast(`Bundle assigned to team`, 'success');
    setAssignOpen(null);
    setAssignTeam('');
    setSubmitting(false);
  };

  const togglePerk = (id: number) =>
    setSelectedPerks((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const totalCredits = (bundle: Bundle) =>
    bundle.perks?.reduce((s, p) => s + (p.credit_price ?? 0), 0) ?? 0;

  return (
    <AppShell role="employer" pageTitle="Bundles">
      <div className="space-y-5">
        <AnimatedSection direction="up" className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#15161A]">Perk bundles</h2>
            <p className="text-xs text-[#5B5F6B] mt-0.5">Pre-configured packs you can assign to teams in one click</p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] transition-colors duration-[120ms] active:scale-[0.98]"
          >
            <Plus size={14} />
            New bundle
          </button>
        </AnimatedSection>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-[12px] border border-[#E7E9EE] p-5 space-y-3">
                <div className="h-4 shimmer rounded w-3/4" />
                <div className="h-3 shimmer rounded w-1/2" />
                <div className="flex gap-1">
                  {[...Array(3)].map((_, j) => <div key={j} className="h-6 w-20 shimmer rounded-full" />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bundles.map((bundle, i) => (
              <AnimatedSection key={bundle.id} direction="up" delay={i * 60}>
                <div className="group bg-white rounded-[12px] border border-[#E7E9EE] shadow-[0_1px_2px_rgba(21,22,26,.04),0_4px_16px_rgba(21,22,26,.06)] p-5 hover:shadow-[0_8px_32px_rgba(21,22,26,.10)] transition-shadow duration-[220ms] flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-[8px] bg-[#3D5AFE]/10 flex items-center justify-center shrink-0">
                          <Package size={13} className="text-[#3D5AFE]" />
                        </div>
                        <p className="text-sm font-semibold text-[#15161A]">{bundle.name}</p>
                      </div>
                      <p className="text-xs text-[#5B5F6B] pl-9">{bundle.perks?.length ?? 0} perks · {totalCredits(bundle).toLocaleString()} cr total</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {bundle.perks?.map((p) => (
                      <span key={p.id} className={`px-2 py-0.5 rounded-full border text-xs font-medium ${categoryColor[p.category] ?? 'bg-[#F7F8FA] text-[#5B5F6B] border-[#E7E9EE]'}`}>
                        {p.name}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => setAssignOpen(bundle)}
                    className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-[8px] border border-[#E7E9EE] text-sm text-[#5B5F6B] font-medium hover:border-[#3D5AFE] hover:text-[#3D5AFE] hover:bg-[#3D5AFE]/5 transition-all duration-[120ms] group-hover:border-[#3D5AFE]/40"
                  >
                    <Users size={13} />
                    Assign to team
                    <ChevronRight size={12} className="ml-auto opacity-50" />
                  </button>
                </div>
              </AnimatedSection>
            ))}

            {/* New bundle CTA card */}
            <AnimatedSection direction="up" delay={bundles.length * 60}>
              <button
                onClick={() => setCreateOpen(true)}
                className="w-full h-full min-h-[140px] rounded-[12px] border-2 border-dashed border-[#E7E9EE] flex flex-col items-center justify-center gap-2 text-[#5B5F6B] hover:border-[#3D5AFE] hover:text-[#3D5AFE] hover:bg-[#3D5AFE]/5 transition-all duration-[200ms]"
              >
                <div className="w-8 h-8 rounded-full bg-[#F7F8FA] flex items-center justify-center">
                  <Plus size={16} />
                </div>
                <span className="text-sm font-medium">Create bundle</span>
              </button>
            </AnimatedSection>
          </div>
        )}
      </div>

      {/* Create bundle modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New bundle" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label="Bundle name" id="bundle-name" required>
            <input
              type="text"
              value={bundleName}
              onChange={(e) => setBundleName(e.target.value)}
              placeholder='e.g. "Remote Worker Pack"'
              className={inputClass()}
            />
          </FormField>
          <div>
            <p className="text-sm font-medium text-[#15161A] mb-2">Select perks</p>
            {perks.length === 0 ? (
              <p className="text-sm text-[#5B5F6B]">No perks available.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                {perks.map((p) => (
                  <label key={p.id} className={`flex items-center gap-2 px-3 py-2.5 rounded-[8px] border cursor-pointer transition-colors ${
                    selectedPerks.includes(p.id) ? 'border-[#3D5AFE] bg-[#3D5AFE]/5' : 'border-[#E7E9EE] hover:border-[#15161A]/20'
                  }`}>
                    <input type="checkbox" checked={selectedPerks.includes(p.id)} onChange={() => togglePerk(p.id)} className="rounded border-[#E7E9EE] text-[#3D5AFE]" />
                    <span className="text-sm text-[#15161A]">{p.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="flex-1 px-4 py-2.5 rounded-[8px] border border-[#E7E9EE] text-sm font-medium text-[#5B5F6B] hover:bg-[#F7F8FA]">Cancel</button>
            <button type="submit" disabled={submitting || !bundleName || !selectedPerks.length} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] disabled:opacity-60">
              {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Create bundle
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign modal */}
      <Modal open={!!assignOpen} onClose={() => setAssignOpen(null)} title={`Assign "${assignOpen?.name}"`} size="sm">
        <form onSubmit={handleAssign} className="space-y-4">
          <FormField label="Team" id="assign-team" required>
            <select value={assignTeam} onChange={(e) => setAssignTeam(e.target.value)} required className={inputClass()}>
              <option value="">Select a team</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </FormField>
          <div className="flex gap-2">
            <button type="button" onClick={() => setAssignOpen(null)} className="flex-1 px-4 py-2.5 rounded-[8px] border border-[#E7E9EE] text-sm font-medium text-[#5B5F6B] hover:bg-[#F7F8FA]">Cancel</button>
            <button type="submit" disabled={submitting || !assignTeam} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] disabled:opacity-60">
              {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Assign
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
