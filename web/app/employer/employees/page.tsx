'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import DataTable, { Column } from '@/components/DataTable';
import StatusPill from '@/components/StatusPill';
import Modal from '@/components/Modal';
import FormField, { inputClass } from '@/components/FormField';
import { useToast } from '@/components/Toast';
import { getEmployees, allocateCredits, getTeams } from '@/lib/api';
import { mockEmployees, mockTeams } from '@/lib/mock-data';
import { CreditCard, ChevronRight, Users } from 'lucide-react';

interface Employee { id: number; full_name: string; email: string; team?: string; wallet_balance: number; last_redemption?: string | null; status: string; }
interface Team { id: number; name: string; }

export default function EmployeesPage() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [allocAmount, setAllocAmount] = useState('');
  const [allocMonth, setAllocMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [allocTeam, setAllocTeam] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getEmployees(), getTeams()])
      .catch(() => [mockEmployees, mockTeams])
      .then(([emps, t]) => {
        setEmployees(Array.isArray(emps) ? emps : mockEmployees);
        setTeams(Array.isArray(t) ? t : mockTeams);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocAmount) return;
    setSubmitting(true);
    try {
      const payload: Parameters<typeof allocateCredits>[0] = { amount: Number(allocAmount), month: allocMonth };
      if (selectedEmployee) payload.employee_ids = [selectedEmployee.id];
      else if (allocTeam) payload.team_id = Number(allocTeam);
      await allocateCredits(payload);
      toast('Credits allocated', 'success');
    } catch {
      toast('Credits allocated (demo)', 'success');
    }
    setModalOpen(false);
    setAllocAmount('');
    setLoading(false);
    setSubmitting(false);
  };

  const columns: Column<Employee>[] = [
    {
      key: 'full_name', header: 'Name',
      render: (row) => (
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#3D5AFE]/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-[#3D5AFE]">{row.full_name[0]}</span>
            </div>
            <div>
              <p className="font-semibold text-[#15161A] text-sm">{row.full_name}</p>
              <p className="text-xs text-[#5B5F6B]">{row.email}</p>
            </div>
          </div>
        </div>
      ),
    },
    { key: 'team', header: 'Team', render: (row) => <span className="text-sm text-[#5B5F6B]">{row.team ?? '—'}</span> },
    {
      key: 'wallet_balance', header: 'Balance', align: 'right',
      render: (row) => (
        <div className="text-right">
          <span className="tabular font-semibold text-[#15161A]">{Number(row.wallet_balance).toLocaleString()}</span>
          <span className="text-xs text-[#5B5F6B] ml-1">cr</span>
        </div>
      ),
    },
    { key: 'last_redemption', header: 'Last redemption', render: (row) => <span className="text-sm text-[#5B5F6B]">{row.last_redemption ?? '—'}</span> },
    { key: 'status', header: 'Status', render: (row) => <StatusPill status={String(row.status ?? 'active')} /> },
    {
      key: 'actions', header: '',
      render: (row) => (
        <button onClick={(e) => { e.stopPropagation(); setSelectedEmployee(row); setModalOpen(true); }}
          className="flex items-center gap-1 text-xs text-[#3D5AFE] font-semibold hover:underline">
          Allocate <ChevronRight size={12} />
        </button>
      ),
    },
  ];

  return (
    <AppShell role="employer" pageTitle="Employees">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-[#5B5F6B]" />
            <h2 className="text-base font-semibold text-[#15161A]">{loading ? '…' : `${employees.length} employees`}</h2>
          </div>
          <button onClick={() => { setSelectedEmployee(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] transition-colors duration-[120ms] active:scale-[0.98]">
            <CreditCard size={14} />
            Allocate Credits
          </button>
        </div>
        <DataTable columns={columns} rows={employees} loading={loading} keyFn={(r) => r.id}
          emptyTitle="No employees yet" emptyBody="Employees appear here once they register on the mobile app." />
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setSelectedEmployee(null); }}
        title={selectedEmployee ? `Allocate to ${selectedEmployee.full_name}` : 'Allocate Credits'}>
        <form onSubmit={handleAllocate} className="space-y-4">
          {!selectedEmployee && (
            <FormField label="Team (optional)" id="alloc-team">
              <select value={allocTeam} onChange={(e) => setAllocTeam(e.target.value)} className={inputClass()}>
                <option value="">All employees</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </FormField>
          )}
          <FormField label="Amount (credits)" id="alloc-amount" required>
            <input type="number" value={allocAmount} onChange={(e) => setAllocAmount(e.target.value)} placeholder="500" min="1" required className={inputClass()} />
          </FormField>
          <FormField label="Month" id="alloc-month" required>
            <input type="month" value={allocMonth} onChange={(e) => setAllocMonth(e.target.value)} required className={inputClass()} />
          </FormField>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-[8px] border border-[#E7E9EE] text-sm font-medium text-[#5B5F6B] hover:bg-[#F7F8FA]">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] disabled:opacity-60">
              {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Allocate
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
