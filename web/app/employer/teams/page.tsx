'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import DataTable, { Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import FormField, { inputClass } from '@/components/FormField';
import AnimatedSection from '@/components/AnimatedSection';
import { useToast } from '@/components/Toast';
import { getTeams, createTeam } from '@/lib/api';
import { mockTeams } from '@/lib/mock-data';
import { Plus } from 'lucide-react';

interface Team { id: number; name: string; manager?: string; member_count?: number; }

export default function TeamsPage() {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    getTeams()
      .then((d) => setTeams(Array.isArray(d) ? d : mockTeams))
      .catch(() => setTeams(mockTeams))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    setSubmitting(true);
    try {
      await createTeam({ name: teamName });
    } catch { /* demo */ }
    toast('Team created', 'success');
    setTeams((prev) => [...prev, { id: Date.now(), name: teamName, member_count: 0 }]);
    setModalOpen(false);
    setTeamName('');
    setSubmitting(false);
  };

  const columns: Column<Team>[] = [
    {
      key: 'name', header: 'Team',
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[6px] bg-[#3D5AFE]/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-[#3D5AFE]">{r.name[0]}</span>
          </div>
          <span className="font-semibold text-[#15161A] text-sm">{r.name}</span>
        </div>
      ),
    },
    { key: 'manager', header: 'Manager', render: (r) => <span className="text-sm text-[#5B5F6B]">{r.manager ?? '—'}</span> },
    {
      key: 'member_count', header: 'Members', align: 'right',
      render: (r) => (
        <div className="text-right">
          <span className="tabular font-semibold text-[#15161A]">{r.member_count ?? 0}</span>
          <span className="text-xs text-[#5B5F6B] ml-1">members</span>
        </div>
      ),
    },
  ];

  return (
    <AppShell role="employer" pageTitle="Teams">
      <div className="space-y-5">
        <AnimatedSection direction="up" className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#15161A]">{loading ? '…' : `${teams.length} teams`}</h2>
            <p className="text-xs text-[#5B5F6B] mt-0.5">Assign bundles and allocate credits across groups</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] transition-colors active:scale-[0.98]"
          >
            <Plus size={14} />
            New team
          </button>
        </AnimatedSection>

        {/* Summary tiles */}
        {!loading && teams.length > 0 && (
          <AnimatedSection direction="up" delay={60} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {teams.slice(0, 4).map((t, i) => (
              <div
                key={t.id}
                className="bg-white rounded-[12px] border border-[#E7E9EE] p-4 shadow-[0_1px_2px_rgba(21,22,26,.04)] animate-fade-up"
                style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
              >
                <div className="w-8 h-8 rounded-[8px] bg-[#3D5AFE]/10 flex items-center justify-center mb-3">
                  <span className="text-sm font-bold text-[#3D5AFE]">{t.name[0]}</span>
                </div>
                <p className="text-xs font-semibold text-[#15161A] truncate">{t.name}</p>
                <p className="text-xl font-bold text-[#3D5AFE] tabular mt-1">{t.member_count ?? 0}</p>
                <p className="text-xs text-[#5B5F6B]">members</p>
              </div>
            ))}
          </AnimatedSection>
        )}

        <AnimatedSection direction="up" delay={120}>
          <DataTable
            columns={columns}
            rows={teams}
            loading={loading}
            keyFn={(r) => r.id}
            emptyTitle="No teams yet"
            emptyBody="Create teams to assign bundles and allocate credits."
          />
        </AnimatedSection>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New team" size="sm">
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label="Team name" id="team-name" required>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Engineering, Marketing"
              required
              className={inputClass()}
            />
          </FormField>
          <div className="flex gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-[8px] border border-[#E7E9EE] text-sm font-medium text-[#5B5F6B] hover:bg-[#F7F8FA]">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] disabled:opacity-60">
              {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
