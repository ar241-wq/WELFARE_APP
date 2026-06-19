'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import DataTable, { Column } from '@/components/DataTable';
import StatusPill from '@/components/StatusPill';
import Modal from '@/components/Modal';
import FormField, { inputClass } from '@/components/FormField';
import { useToast } from '@/components/Toast';
import { getEmployees, allocateCredits, getTeams, createEmployee, updateEmployee } from '@/lib/api';
import { mockEmployees, mockTeams } from '@/lib/mock-data';
import { CreditCard, ChevronRight, Users, UserPlus, Settings } from 'lucide-react';

interface Employee { id: number; full_name: string; email: string; team?: string | null; wallet_balance: number; last_redemption?: string | null; status: string; }
interface Team { id: number; name: string; }

export default function EmployeesPage() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // allocate modal
  const [allocOpen, setAllocOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [allocAmount, setAllocAmount] = useState('');
  const [allocMonth, setAllocMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [allocTeam, setAllocTeam] = useState('');
  const [allocSubmitting, setAllocSubmitting] = useState(false);

  // add employee modal
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newTeam, setNewTeam] = useState('');
  const [addError, setAddError] = useState('');
  const [addSubmitting, setAddSubmitting] = useState(false);

  // configure employee modal
  const [configOpen, setConfigOpen] = useState(false);
  const [configEmp, setConfigEmp] = useState<Employee | null>(null);
  const [configName, setConfigName] = useState('');
  const [configTeam, setConfigTeam] = useState('');
  const [configBalance, setConfigBalance] = useState('');
  const [configSubmitting, setConfigSubmitting] = useState(false);

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

  const openConfig = (emp: Employee) => {
    setConfigEmp(emp);
    setConfigName(emp.full_name);
    const matchedTeam = teams.find((t) => t.name === emp.team);
    setConfigTeam(matchedTeam ? String(matchedTeam.id) : '');
    setConfigBalance(String(emp.wallet_balance));
    setConfigOpen(true);
  };

  const handleConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configEmp) return;
    setConfigSubmitting(true);
    try {
      const updated = await updateEmployee(configEmp.id, {
        full_name: configName,
        team_id: configTeam ? Number(configTeam) : null,
        wallet_balance: Number(configBalance),
      });
      setEmployees((prev) => prev.map((emp) => emp.id === configEmp.id ? { ...emp, ...updated } : emp));
      toast('Employee updated', 'success');
      setConfigOpen(false);
    } catch {
      toast('Could not update employee', 'error');
    } finally {
      setConfigSubmitting(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setAddSubmitting(true);
    try {
      await createEmployee({ full_name: newName, email: newEmail, password: newPassword, team_id: newTeam ? Number(newTeam) : undefined });
      toast('Employee created', 'success');
      setAddOpen(false);
      setNewName(''); setNewEmail(''); setNewPassword(''); setNewTeam('');
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setAddError(msg || 'Could not create employee.');
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocAmount) return;
    setAllocSubmitting(true);
    try {
      const payload: Parameters<typeof allocateCredits>[0] = { amount: Number(allocAmount), month: allocMonth };
      if (selectedEmployee) payload.employee_ids = [selectedEmployee.id];
      else if (allocTeam) payload.team_id = Number(allocTeam);
      await allocateCredits(payload);
      toast('Credits allocated', 'success');
      load();
    } catch {
      toast('Could not allocate credits', 'error');
    }
    setAllocOpen(false);
    setAllocAmount('');
    setAllocSubmitting(false);
  };

  const columns: Column<Employee>[] = [
    {
      key: 'full_name', header: 'Name',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#3D5AFE]/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-[#3D5AFE]">{row.full_name[0]}</span>
          </div>
          <div>
            <p className="font-semibold text-[#15161A] text-sm">{row.full_name}</p>
            <p className="text-xs text-[#5B5F6B]">{row.email}</p>
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
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); openConfig(row); }}
            className="flex items-center gap-1 text-xs text-[#5B5F6B] font-semibold hover:text-[#15161A]"
          >
            <Settings size={12} /> Configure
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedEmployee(row); setAllocOpen(true); }}
            className="flex items-center gap-1 text-xs text-[#3D5AFE] font-semibold hover:underline"
          >
            Allocate <ChevronRight size={12} />
          </button>
        </div>
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSelectedEmployee(null); setAllocOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-[8px] border border-[#E7E9EE] text-sm font-semibold text-[#15161A] hover:bg-[#F7F8FA] transition-colors duration-[120ms] active:scale-[0.98]"
            >
              <CreditCard size={14} /> Allocate Credits
            </button>
            <button
              onClick={() => { setAddError(''); setAddOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] transition-colors duration-[120ms] active:scale-[0.98]"
            >
              <UserPlus size={14} /> Add Employee
            </button>
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={employees}
          loading={loading}
          keyFn={(r) => r.id}
          emptyTitle="No employees yet"
          emptyBody="Add employees using the button above or have them register on the mobile app."
        />
      </div>

      {/* Configure employee modal */}
      <Modal open={configOpen} onClose={() => setConfigOpen(false)} title={`Configure ${configEmp?.full_name ?? 'Employee'}`}>
        <form onSubmit={handleConfig} className="space-y-4">
          <FormField label="Full name" id="cfg-name" required>
            <input type="text" value={configName} onChange={(e) => setConfigName(e.target.value)} required className={inputClass()} />
          </FormField>
          <FormField label="Team / Department" id="cfg-team">
            <select value={configTeam} onChange={(e) => setConfigTeam(e.target.value)} className={inputClass()}>
              <option value="">No team</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </FormField>
          <FormField label="Wallet balance (credits)" id="cfg-balance" hint="Sets the credit balance directly">
            <input type="number" min="0" value={configBalance} onChange={(e) => setConfigBalance(e.target.value)} className={inputClass()} />
          </FormField>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setConfigOpen(false)} className="flex-1 px-4 py-2.5 rounded-[8px] border border-[#E7E9EE] text-sm font-medium text-[#5B5F6B] hover:bg-[#F7F8FA]">Cancel</button>
            <button type="submit" disabled={configSubmitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] disabled:opacity-60">
              {configSubmitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Save changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Add employee modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Employee">
        <form onSubmit={handleAdd} className="space-y-4">
          <FormField label="Full name" id="new-name" required>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Jane Smith" required className={inputClass()} />
          </FormField>
          <FormField label="Email" id="new-email" required>
            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="jane@company.com" required className={inputClass()} />
          </FormField>
          <FormField label="Password" id="new-password" required hint="Minimum 8 characters">
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" minLength={8} required className={inputClass()} />
          </FormField>
          <FormField label="Team / Department" id="new-team">
            <select value={newTeam} onChange={(e) => setNewTeam(e.target.value)} className={inputClass()}>
              <option value="">No team</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </FormField>
          {addError && <p className="text-sm text-[#D23B3B]">{addError}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setAddOpen(false)} className="flex-1 px-4 py-2.5 rounded-[8px] border border-[#E7E9EE] text-sm font-medium text-[#5B5F6B] hover:bg-[#F7F8FA]">Cancel</button>
            <button type="submit" disabled={addSubmitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] disabled:opacity-60">
              {addSubmitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Create Employee
            </button>
          </div>
        </form>
      </Modal>

      {/* Allocate credits modal */}
      <Modal open={allocOpen} onClose={() => { setAllocOpen(false); setSelectedEmployee(null); }}
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
            <button type="button" onClick={() => setAllocOpen(false)} className="flex-1 px-4 py-2.5 rounded-[8px] border border-[#E7E9EE] text-sm font-medium text-[#5B5F6B] hover:bg-[#F7F8FA]">Cancel</button>
            <button type="submit" disabled={allocSubmitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] disabled:opacity-60">
              {allocSubmitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Allocate
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
