'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import DataTable, { Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import FormField, { inputClass } from '@/components/FormField';
import AnimatedSection from '@/components/AnimatedSection';
import { useToast } from '@/components/Toast';
import { getTeams, createTeam, getTeamDetail, updateTeam, deleteTeam, updateEmployee } from '@/lib/api';
import { mockTeams } from '@/lib/mock-data';
import { Plus, Pencil, Trash2, Settings, ChevronLeft, CreditCard, User } from 'lucide-react';

interface Team { id: number; name: string; manager?: string | null; member_count?: number; }
interface Employee { id: number; full_name: string; email: string; team?: string | null; wallet_balance: number; }

type View = 'list' | 'team';

export default function TeamsPage() {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('list');
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Employee[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // create team modal
  const [createOpen, setCreateOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // edit team modal
  const [editTeamOpen, setEditTeamOpen] = useState(false);
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamSubmitting, setEditTeamSubmitting] = useState(false);

  // edit employee modal
  const [editEmpOpen, setEditEmpOpen] = useState(false);
  const [editEmp, setEditEmp] = useState<Employee | null>(null);
  const [editEmpName, setEditEmpName] = useState('');
  const [editEmpTeamId, setEditEmpTeamId] = useState('');
  const [editEmpBalance, setEditEmpBalance] = useState('');
  const [editEmpSubmitting, setEditEmpSubmitting] = useState(false);

  const loadTeams = () => {
    setLoading(true);
    getTeams()
      .then((d) => setTeams(Array.isArray(d) ? d : mockTeams))
      .catch(() => setTeams(mockTeams))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTeams(); }, []);

  const openTeam = async (team: Team) => {
    setActiveTeam(team);
    setView('team');
    setMembersLoading(true);
    try {
      const detail = await getTeamDetail(team.id);
      setMembers(detail.members ?? []);
    } catch {
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setCreateSubmitting(true);
    try {
      const created = await createTeam({ name: newTeamName });
      setTeams((prev) => [...prev, created]);
      toast('Team created', 'success');
      setCreateOpen(false);
      setNewTeamName('');
    } catch {
      toast('Could not create team', 'error');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleEditTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeam) return;
    setEditTeamSubmitting(true);
    try {
      const updated = await updateTeam(activeTeam.id, { name: editTeamName });
      setActiveTeam({ ...activeTeam, name: updated.name });
      setTeams((prev) => prev.map((t) => t.id === activeTeam.id ? { ...t, name: updated.name } : t));
      toast('Team updated', 'success');
      setEditTeamOpen(false);
    } catch {
      toast('Could not update team', 'error');
    } finally {
      setEditTeamSubmitting(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!activeTeam || !window.confirm(`Delete team "${activeTeam.name}"? Members will be unassigned.`)) return;
    try {
      await deleteTeam(activeTeam.id);
      setTeams((prev) => prev.filter((t) => t.id !== activeTeam.id));
      toast('Team deleted', 'success');
      setView('list');
    } catch {
      toast('Could not delete team', 'error');
    }
  };

  const openEditEmp = (emp: Employee) => {
    setEditEmp(emp);
    setEditEmpName(emp.full_name);
    setEditEmpTeamId(activeTeam ? String(activeTeam.id) : '');
    setEditEmpBalance(String(emp.wallet_balance));
    setEditEmpOpen(true);
  };

  const handleEditEmp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmp) return;
    setEditEmpSubmitting(true);
    try {
      const updated = await updateEmployee(editEmp.id, {
        full_name: editEmpName,
        team_id: editEmpTeamId ? Number(editEmpTeamId) : null,
        wallet_balance: Number(editEmpBalance),
      });
      setMembers((prev) => prev.map((m) => m.id === editEmp.id ? { ...m, ...updated } : m));
      // if moved out of this team, remove from list
      if (editEmpTeamId && Number(editEmpTeamId) !== activeTeam?.id) {
        setMembers((prev) => prev.filter((m) => m.id !== editEmp.id));
      }
      toast('Employee updated', 'success');
      setEditEmpOpen(false);
    } catch {
      toast('Could not update employee', 'error');
    } finally {
      setEditEmpSubmitting(false);
    }
  };

  const memberColumns: Column<Employee>[] = [
    {
      key: 'full_name', header: 'Employee',
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#3D5AFE]/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-[#3D5AFE]">{r.full_name[0]}</span>
          </div>
          <div>
            <p className="font-semibold text-[#15161A] text-sm">{r.full_name}</p>
            <p className="text-xs text-[#5B5F6B]">{r.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'wallet_balance', header: 'Credits', align: 'right',
      render: (r) => (
        <div className="text-right">
          <span className="tabular font-semibold text-[#15161A]">{Number(r.wallet_balance).toLocaleString()}</span>
          <span className="text-xs text-[#5B5F6B] ml-1">cr</span>
        </div>
      ),
    },
    {
      key: 'actions', header: '',
      render: (r) => (
        <button
          onClick={() => openEditEmp(r)}
          className="flex items-center gap-1 text-xs text-[#3D5AFE] font-semibold hover:underline"
        >
          <Settings size={12} /> Configure
        </button>
      ),
    },
  ];

  const teamColumns: Column<Team>[] = [
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
    {
      key: 'actions', header: '',
      render: (r) => (
        <button
          onClick={() => openTeam(r)}
          className="flex items-center gap-1 text-xs text-[#3D5AFE] font-semibold hover:underline"
        >
          <Settings size={12} /> Manage
        </button>
      ),
    },
  ];

  // ── Team detail view ──────────────────────────────────────────────────────
  if (view === 'team' && activeTeam) {
    return (
      <AppShell role="employer" pageTitle={activeTeam.name}>
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setView('list')} className="flex items-center gap-1 text-sm text-[#5B5F6B] hover:text-[#15161A] transition-colors">
                <ChevronLeft size={16} /> Teams
              </button>
              <span className="text-[#E7E9EE]">/</span>
              <h2 className="text-base font-semibold text-[#15161A]">{activeTeam.name}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setEditTeamName(activeTeam.name); setEditTeamOpen(true); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-[#E7E9EE] text-sm font-medium text-[#15161A] hover:bg-[#F7F8FA] transition-colors"
              >
                <Pencil size={13} /> Edit team
              </button>
              <button
                onClick={handleDeleteTeam}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-[#fee2e2] text-sm font-medium text-[#D23B3B] hover:bg-[#fff5f5] transition-colors"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-[12px] border border-[#E7E9EE] p-4">
              <div className="flex items-center gap-2 mb-1 text-[#5B5F6B]"><User size={13} /><p className="text-xs font-medium">Members</p></div>
              <p className="text-2xl font-bold text-[#3D5AFE]">{members.length}</p>
            </div>
            <div className="bg-white rounded-[12px] border border-[#E7E9EE] p-4">
              <div className="flex items-center gap-2 mb-1 text-[#5B5F6B]"><CreditCard size={13} /><p className="text-xs font-medium">Total credits</p></div>
              <p className="text-2xl font-bold text-[#3D5AFE]">{members.reduce((s, m) => s + Number(m.wallet_balance), 0).toLocaleString()}</p>
            </div>
          </div>

          {/* Members table */}
          <div className="bg-white rounded-[12px] border border-[#E7E9EE] shadow-[0_1px_2px_rgba(21,22,26,.04)] p-5">
            <p className="text-sm font-semibold text-[#15161A] mb-4">Team members</p>
            <DataTable
              columns={memberColumns}
              rows={members}
              loading={membersLoading}
              keyFn={(r) => r.id}
              emptyTitle="No members yet"
              emptyBody="Add employees to this team from the Employees page."
            />
          </div>
        </div>

        {/* Edit team modal */}
        <Modal open={editTeamOpen} onClose={() => setEditTeamOpen(false)} title="Edit team" size="sm">
          <form onSubmit={handleEditTeam} className="space-y-4">
            <FormField label="Team name" id="edit-team-name" required>
              <input type="text" value={editTeamName} onChange={(e) => setEditTeamName(e.target.value)} required className={inputClass()} />
            </FormField>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditTeamOpen(false)} className="flex-1 px-4 py-2.5 rounded-[8px] border border-[#E7E9EE] text-sm font-medium text-[#5B5F6B] hover:bg-[#F7F8FA]">Cancel</button>
              <button type="submit" disabled={editTeamSubmitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] disabled:opacity-60">
                {editTeamSubmitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Save
              </button>
            </div>
          </form>
        </Modal>

        {/* Edit employee modal */}
        <Modal open={editEmpOpen} onClose={() => setEditEmpOpen(false)} title={`Configure ${editEmp?.full_name ?? 'Employee'}`}>
          <form onSubmit={handleEditEmp} className="space-y-4">
            <FormField label="Full name" id="emp-name" required>
              <input type="text" value={editEmpName} onChange={(e) => setEditEmpName(e.target.value)} required className={inputClass()} />
            </FormField>
            <FormField label="Team / Department" id="emp-team">
              <select value={editEmpTeamId} onChange={(e) => setEditEmpTeamId(e.target.value)} className={inputClass()}>
                <option value="">No team</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </FormField>
            <FormField label="Wallet balance (credits)" id="emp-balance" hint="Sets the employee's credit balance directly">
              <input type="number" min="0" value={editEmpBalance} onChange={(e) => setEditEmpBalance(e.target.value)} className={inputClass()} />
            </FormField>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setEditEmpOpen(false)} className="flex-1 px-4 py-2.5 rounded-[8px] border border-[#E7E9EE] text-sm font-medium text-[#5B5F6B] hover:bg-[#F7F8FA]">Cancel</button>
              <button type="submit" disabled={editEmpSubmitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] disabled:opacity-60">
                {editEmpSubmitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Save changes
              </button>
            </div>
          </form>
        </Modal>
      </AppShell>
    );
  }

  // ── Team list view ────────────────────────────────────────────────────────
  return (
    <AppShell role="employer" pageTitle="Teams">
      <div className="space-y-5">
        <AnimatedSection direction="up" className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#15161A]">{loading ? '…' : `${teams.length} teams`}</h2>
            <p className="text-xs text-[#5B5F6B] mt-0.5">Click a team to manage members and settings</p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] transition-colors active:scale-[0.98]"
          >
            <Plus size={14} /> New team
          </button>
        </AnimatedSection>

        {!loading && teams.length > 0 && (
          <AnimatedSection direction="up" delay={60} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {teams.slice(0, 4).map((t, i) => (
              <button
                key={t.id}
                onClick={() => openTeam(t)}
                className="bg-white rounded-[12px] border border-[#E7E9EE] p-4 shadow-[0_1px_2px_rgba(21,22,26,.04)] text-left hover:border-[#3D5AFE]/40 hover:shadow-[0_1px_2px_rgba(61,90,254,.08),0_4px_16px_rgba(61,90,254,.08)] transition-all animate-fade-up"
                style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
              >
                <div className="w-8 h-8 rounded-[8px] bg-[#3D5AFE]/10 flex items-center justify-center mb-3">
                  <span className="text-sm font-bold text-[#3D5AFE]">{t.name[0]}</span>
                </div>
                <p className="text-xs font-semibold text-[#15161A] truncate">{t.name}</p>
                <p className="text-xl font-bold text-[#3D5AFE] tabular mt-1">{t.member_count ?? 0}</p>
                <p className="text-xs text-[#5B5F6B]">members</p>
              </button>
            ))}
          </AnimatedSection>
        )}

        <AnimatedSection direction="up" delay={120}>
          <DataTable
            columns={teamColumns}
            rows={teams}
            loading={loading}
            keyFn={(r) => r.id}
            emptyTitle="No teams yet"
            emptyBody="Create teams to assign bundles and allocate credits."
          />
        </AnimatedSection>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New team" size="sm">
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label="Team name" id="team-name" required>
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="e.g. Engineering, Marketing"
              required
              className={inputClass()}
            />
          </FormField>
          <div className="flex gap-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="flex-1 px-4 py-2.5 rounded-[8px] border border-[#E7E9EE] text-sm font-medium text-[#5B5F6B] hover:bg-[#F7F8FA]">Cancel</button>
            <button type="submit" disabled={createSubmitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] disabled:opacity-60">
              {createSubmitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
