'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import DataTable, { Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import FormField, { inputClass } from '@/components/FormField';
import AnimatedSection from '@/components/AnimatedSection';
import { useToast } from '@/components/Toast';
import {
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  getDepartmentDetail, updateDepartmentMembers, allocateDepartmentCredits,
  getEmployees, updateEmployee,
} from '@/lib/api';
import { Plus, Pencil, Trash2, ChevronLeft, Send, UserPlus, Building2, Users, CreditCard } from 'lucide-react';

interface Department { id: number; name: string; monthly_credits: number; member_count: number; }
interface Employee { id: number; full_name: string; email: string; wallet_balance: number; department?: string | null; }

type View = 'list' | 'detail';

export default function DepartmentsPage() {
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('list');
  const [activeDept, setActiveDept] = useState<Department | null>(null);
  const [members, setMembers] = useState<Employee[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);

  // create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCredits, setNewCredits] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCredits, setEditCredits] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // send credits modal
  const [sendOpen, setSendOpen] = useState(false);
  const [creditAmounts, setCreditAmounts] = useState<Record<number, string>>({});
  const [sendSubmitting, setSendSubmitting] = useState(false);

  // edit member credits modal
  const [editMemberOpen, setEditMemberOpen] = useState(false);
  const [editMember, setEditMember] = useState<Employee | null>(null);
  const [editMemberAmount, setEditMemberAmount] = useState('');
  const [editMemberSubmitting, setEditMemberSubmitting] = useState(false);

  // add members modal
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [selectedEmpIds, setSelectedEmpIds] = useState<number[]>([]);
  const [addMembersSubmitting, setAddMembersSubmitting] = useState(false);

  const loadDepartments = () => {
    setLoading(true);
    getDepartments()
      .then(setDepartments)
      .catch(() => setDepartments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDepartments(); }, []);

  const openDept = async (dept: Department) => {
    setActiveDept(dept);
    setView('detail');
    setMembersLoading(true);
    try {
      const detail = await getDepartmentDetail(dept.id);
      setMembers(detail.members ?? []);
    } catch {
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  const openAddMembers = async () => {
    try {
      const all = await getEmployees();
      const memberIds = new Set(members.map((m) => m.id));
      setAllEmployees((all as Employee[]).filter((e) => !memberIds.has(e.id)));
      setSelectedEmpIds([]);
      setAddMembersOpen(true);
    } catch {
      toast('Could not load employees', 'error');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreateSubmitting(true);
    try {
      const created = await createDepartment({ name: newName, monthly_credits: Number(newCredits) || 0 });
      setDepartments((prev) => [...prev, created]);
      toast('Department created', 'success');
      setCreateOpen(false);
      setNewName('');
      setNewCredits('');
    } catch {
      toast('Could not create department', 'error');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDept) return;
    setEditSubmitting(true);
    try {
      const updated = await updateDepartment(activeDept.id, {
        name: editName,
        monthly_credits: Number(editCredits),
      });
      const merged = { ...activeDept, ...updated };
      setActiveDept(merged);
      setDepartments((prev) => prev.map((d) => d.id === activeDept.id ? merged : d));
      toast('Department updated', 'success');
      setEditOpen(false);
    } catch {
      toast('Could not update department', 'error');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!activeDept || !window.confirm(`Delete "${activeDept.name}"? Members will be unassigned.`)) return;
    try {
      await deleteDepartment(activeDept.id);
      setDepartments((prev) => prev.filter((d) => d.id !== activeDept.id));
      toast('Department deleted', 'success');
      setView('list');
    } catch {
      toast('Could not delete department', 'error');
    }
  };

  const openSendCredits = () => {
    // Pre-fill each member with the department's base monthly_credits
    const defaults: Record<number, string> = {};
    members.forEach((m) => { defaults[m.id] = String(activeDept?.monthly_credits ?? ''); });
    setCreditAmounts(defaults);
    setSendOpen(true);
  };

  const handleSendCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDept) return;
    const per_employee = members
      .map((m) => ({ employee_id: m.id, amount: Number(creditAmounts[m.id] ?? 0) }))
      .filter((e) => e.amount > 0);
    if (!per_employee.length) { toast('Enter at least one credit amount', 'error'); return; }
    setSendSubmitting(true);
    try {
      const result = await allocateDepartmentCredits(activeDept.id, { per_employee });
      toast(`Sent credits to ${result.allocated_to?.length ?? 0} employees`, 'success');
      setSendOpen(false);
      const detail = await getDepartmentDetail(activeDept.id);
      setMembers(detail.members ?? []);
    } catch {
      toast('Could not send credits', 'error');
    } finally {
      setSendSubmitting(false);
    }
  };

  const handleAddMembers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDept || !selectedEmpIds.length) return;
    setAddMembersSubmitting(true);
    try {
      await updateDepartmentMembers(activeDept.id, 'add', selectedEmpIds);
      toast('Members added', 'success');
      setAddMembersOpen(false);
      const detail = await getDepartmentDetail(activeDept.id);
      setMembers(detail.members ?? []);
      setActiveDept((d) => d ? { ...d, member_count: detail.members?.length ?? d.member_count } : d);
      setDepartments((prev) => prev.map((d) => d.id === activeDept.id ? { ...d, member_count: detail.members?.length ?? d.member_count } : d));
    } catch {
      toast('Could not add members', 'error');
    } finally {
      setAddMembersSubmitting(false);
    }
  };

  const handleRemoveMember = async (emp: Employee) => {
    if (!activeDept || !window.confirm(`Remove ${emp.full_name} from this department?`)) return;
    try {
      await updateDepartmentMembers(activeDept.id, 'remove', [emp.id]);
      setMembers((prev) => prev.filter((m) => m.id !== emp.id));
      setActiveDept((d) => d ? { ...d, member_count: d.member_count - 1 } : d);
      setDepartments((prev) => prev.map((d) => d.id === activeDept.id ? { ...d, member_count: d.member_count - 1 } : d));
      toast('Member removed', 'success');
    } catch {
      toast('Could not remove member', 'error');
    }
  };

  const openEditMember = (emp: Employee) => {
    setEditMember(emp);
    setEditMemberAmount(String(emp.wallet_balance));
    setEditMemberOpen(true);
  };

  const handleEditMemberCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMember) return;
    const newBalance = Number(editMemberAmount);
    if (isNaN(newBalance) || newBalance < 0) { toast('Enter a valid amount', 'error'); return; }
    setEditMemberSubmitting(true);
    try {
      await updateEmployee(editMember.id, { wallet_balance: newBalance });
      setMembers((prev) => prev.map((m) =>
        m.id === editMember.id ? { ...m, wallet_balance: newBalance } : m
      ));
      toast(`Balance updated to ${newBalance.toLocaleString()} cr`, 'success');
      setEditMemberOpen(false);
    } catch {
      toast('Could not update balance', 'error');
    } finally {
      setEditMemberSubmitting(false);
    }
  };

  const toggleEmpSelect = (id: number) => {
    setSelectedEmpIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
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
      key: 'wallet_balance', header: 'Balance', align: 'right',
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
        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={() => openEditMember(r)}
            className="flex items-center gap-1 text-xs text-[#3D5AFE] font-medium hover:underline"
          >
            <Pencil size={11} /> Edit credits
          </button>
          <button
            onClick={() => handleRemoveMember(r)}
            className="flex items-center gap-1 text-xs text-[#D23B3B] font-medium hover:underline"
          >
            <Trash2 size={11} /> Remove
          </button>
        </div>
      ),
    },
  ];

  const deptColumns: Column<Department>[] = [
    {
      key: 'name', header: 'Department',
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[6px] bg-[#3D5AFE]/10 flex items-center justify-center shrink-0">
            <Building2 size={13} className="text-[#3D5AFE]" />
          </div>
          <span className="font-semibold text-[#15161A] text-sm">{r.name}</span>
        </div>
      ),
    },
    {
      key: 'monthly_credits', header: 'Monthly credits / employee', align: 'right',
      render: (r) => (
        <div className="text-right">
          <span className="tabular font-semibold text-[#15161A]">{Number(r.monthly_credits).toLocaleString()}</span>
          <span className="text-xs text-[#5B5F6B] ml-1">cr</span>
        </div>
      ),
    },
    {
      key: 'member_count', header: 'Members', align: 'right',
      render: (r) => (
        <div className="text-right">
          <span className="tabular font-semibold text-[#15161A]">{r.member_count ?? 0}</span>
          <span className="text-xs text-[#5B5F6B] ml-1">employees</span>
        </div>
      ),
    },
    {
      key: 'actions', header: '',
      render: (r) => (
        <button
          onClick={() => openDept(r)}
          className="flex items-center gap-1 text-xs text-[#3D5AFE] font-semibold hover:underline"
        >
          Manage
        </button>
      ),
    },
  ];

  // ── Department detail ─────────────────────────────────────────────────────
  if (view === 'detail' && activeDept) {
    return (
      <AppShell role="employer" pageTitle={activeDept.name}>
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setView('list')} className="flex items-center gap-1 text-sm text-[#5B5F6B] hover:text-[#15161A] transition-colors">
                <ChevronLeft size={16} /> Departments
              </button>
              <span className="text-[#E7E9EE]">/</span>
              <h2 className="text-base font-semibold text-[#15161A]">{activeDept.name}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openAddMembers}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-[#E7E9EE] text-sm font-medium text-[#15161A] hover:bg-[#F7F8FA] transition-colors"
              >
                <UserPlus size={13} /> Add members
              </button>
              <button
                onClick={openSendCredits}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] transition-colors"
              >
                <Send size={13} /> Send credits
              </button>
              <button
                onClick={() => { setEditName(activeDept.name); setEditCredits(String(activeDept.monthly_credits)); setEditOpen(true); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-[#E7E9EE] text-sm font-medium text-[#15161A] hover:bg-[#F7F8FA] transition-colors"
              >
                <Pencil size={13} /> Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-[#fee2e2] text-sm font-medium text-[#D23B3B] hover:bg-[#fff5f5] transition-colors"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-[12px] border border-[#E7E9EE] p-4">
              <div className="flex items-center gap-2 mb-1 text-[#5B5F6B]"><Users size={13} /><p className="text-xs font-medium">Members</p></div>
              <p className="text-2xl font-bold text-[#3D5AFE]">{members.length}</p>
            </div>
            <div className="bg-white rounded-[12px] border border-[#E7E9EE] p-4">
              <div className="flex items-center gap-2 mb-1 text-[#5B5F6B]"><CreditCard size={13} /><p className="text-xs font-medium">Base credits / month</p></div>
              <p className="text-2xl font-bold text-[#3D5AFE]">{Number(activeDept.monthly_credits).toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-[12px] border border-[#E7E9EE] p-4">
              <div className="flex items-center gap-2 mb-1 text-[#5B5F6B]"><CreditCard size={13} /><p className="text-xs font-medium">Total monthly cost</p></div>
              <p className="text-2xl font-bold text-[#3D5AFE]">{(Number(activeDept.monthly_credits) * members.length).toLocaleString()}</p>
            </div>
          </div>

          {/* Members table */}
          <div className="bg-white rounded-[12px] border border-[#E7E9EE] shadow-[0_1px_2px_rgba(21,22,26,.04)] p-5">
            <p className="text-sm font-semibold text-[#15161A] mb-4">Members</p>
            <DataTable
              columns={memberColumns}
              rows={members}
              loading={membersLoading}
              keyFn={(r) => r.id}
              emptyTitle="No members yet"
              emptyBody="Add employees to this department using the button above."
            />
          </div>
        </div>

        {/* Edit modal */}
        <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit department" size="sm">
          <form onSubmit={handleEdit} className="space-y-4">
            <FormField label="Department name" id="edit-name" required>
              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required className={inputClass()} />
            </FormField>
            <FormField label="Base credits per employee / month" id="edit-credits" hint="Each employee in this department receives this many credits when you send monthly credits">
              <input type="number" min="0" value={editCredits} onChange={(e) => setEditCredits(e.target.value)} className={inputClass()} />
            </FormField>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditOpen(false)} className="flex-1 px-4 py-2.5 rounded-[8px] border border-[#E7E9EE] text-sm font-medium text-[#5B5F6B] hover:bg-[#F7F8FA]">Cancel</button>
              <button type="submit" disabled={editSubmitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] disabled:opacity-60">
                {editSubmitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Save
              </button>
            </div>
          </form>
        </Modal>

        {/* Send credits modal */}
        <Modal open={sendOpen} onClose={() => setSendOpen(false)} title={`Send credits — ${activeDept.name}`}>
          <form onSubmit={handleSendCredits} className="space-y-4">
            <p className="text-sm text-[#5B5F6B]">Set how many credits each employee receives this month. Pre-filled with the department base ({Number(activeDept.monthly_credits).toLocaleString()} cr).</p>

            <div className="border border-[#E7E9EE] rounded-[10px] overflow-hidden">
              {/* header */}
              <div className="grid grid-cols-[1fr_140px] gap-3 px-4 py-2 bg-[#F7F8FA] border-b border-[#E7E9EE]">
                <span className="text-xs font-semibold text-[#5B5F6B] uppercase tracking-wide">Employee</span>
                <span className="text-xs font-semibold text-[#5B5F6B] uppercase tracking-wide text-right">Credits</span>
              </div>
              {/* rows */}
              <div className="divide-y divide-[#E7E9EE] max-h-72 overflow-y-auto">
                {members.map((m) => (
                  <div key={m.id} className="grid grid-cols-[1fr_140px] gap-3 items-center px-4 py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[#3D5AFE]/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-[#3D5AFE]">{m.full_name[0]}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#15161A] truncate">{m.full_name}</p>
                        <p className="text-xs text-[#5B5F6B] truncate">{m.email}</p>
                      </div>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={creditAmounts[m.id] ?? ''}
                      onChange={(e) => setCreditAmounts((prev) => ({ ...prev, [m.id]: e.target.value }))}
                      placeholder="0"
                      className={inputClass() + ' text-right'}
                    />
                  </div>
                ))}
              </div>
              {/* total */}
              <div className="grid grid-cols-[1fr_140px] gap-3 px-4 py-2.5 bg-[#F7F8FA] border-t border-[#E7E9EE]">
                <span className="text-xs font-semibold text-[#15161A]">Total</span>
                <span className="text-sm font-bold text-[#3D5AFE] text-right tabular">
                  {Object.values(creditAmounts).reduce((s, v) => s + (Number(v) || 0), 0).toLocaleString()} cr
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setSendOpen(false)} className="flex-1 px-4 py-2.5 rounded-[8px] border border-[#E7E9EE] text-sm font-medium text-[#5B5F6B] hover:bg-[#F7F8FA]">Cancel</button>
              <button type="submit" disabled={sendSubmitting || members.length === 0} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] disabled:opacity-60">
                {sendSubmitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                <Send size={13} /> Send
              </button>
            </div>
          </form>
        </Modal>

        {/* Edit member credits modal */}
        <Modal open={editMemberOpen} onClose={() => setEditMemberOpen(false)} title={`Edit credits — ${editMember?.full_name ?? ''}`} size="sm">
          <form onSubmit={handleEditMemberCredits} className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-[10px] bg-[#F7F8FA] border border-[#E7E9EE]">
              <div className="w-9 h-9 rounded-full bg-[#3D5AFE]/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-[#3D5AFE]">{editMember?.full_name[0]}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#15161A]">{editMember?.full_name}</p>
                <p className="text-xs text-[#5B5F6B]">Current balance: <strong className="text-[#15161A]">{Number(editMember?.wallet_balance ?? 0).toLocaleString()} cr</strong></p>
              </div>
            </div>
            <FormField label="New balance" id="edit-member-amount" hint="This replaces the current balance — e.g. change 500 to 120">
              <input
                type="number"
                min="0"
                value={editMemberAmount}
                onChange={(e) => setEditMemberAmount(e.target.value)}
                required
                autoFocus
                className={inputClass()}
              />
            </FormField>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditMemberOpen(false)} className="flex-1 px-4 py-2.5 rounded-[8px] border border-[#E7E9EE] text-sm font-medium text-[#5B5F6B] hover:bg-[#F7F8FA]">Cancel</button>
              <button type="submit" disabled={editMemberSubmitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] disabled:opacity-60">
                {editMemberSubmitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Save
              </button>
            </div>
          </form>
        </Modal>

        {/* Add members modal */}
        <Modal open={addMembersOpen} onClose={() => setAddMembersOpen(false)} title="Add members">
          <form onSubmit={handleAddMembers} className="space-y-4">
            {allEmployees.length === 0 ? (
              <p className="text-sm text-[#5B5F6B] py-4 text-center">All employees are already in this department.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-1 border border-[#E7E9EE] rounded-[8px] p-2">
                {allEmployees.map((emp) => (
                  <label key={emp.id} className="flex items-center gap-3 px-2 py-2 rounded-[6px] hover:bg-[#F7F8FA] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedEmpIds.includes(emp.id)}
                      onChange={() => toggleEmpSelect(emp.id)}
                      className="accent-[#3D5AFE]"
                    />
                    <div className="w-6 h-6 rounded-full bg-[#3D5AFE]/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-[#3D5AFE]">{emp.full_name[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#15161A]">{emp.full_name}</p>
                      <p className="text-xs text-[#5B5F6B]">{emp.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => setAddMembersOpen(false)} className="flex-1 px-4 py-2.5 rounded-[8px] border border-[#E7E9EE] text-sm font-medium text-[#5B5F6B] hover:bg-[#F7F8FA]">Cancel</button>
              <button type="submit" disabled={addMembersSubmitting || selectedEmpIds.length === 0} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] disabled:opacity-60">
                {addMembersSubmitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Add {selectedEmpIds.length > 0 ? `(${selectedEmpIds.length})` : ''}
              </button>
            </div>
          </form>
        </Modal>
      </AppShell>
    );
  }

  // ── Department list ───────────────────────────────────────────────────────
  return (
    <AppShell role="employer" pageTitle="Departments">
      <div className="space-y-5">
        <AnimatedSection direction="up" className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#15161A]">{loading ? '…' : `${departments.length} departments`}</h2>
            <p className="text-xs text-[#5B5F6B] mt-0.5">Set base monthly credits per department and send them to all members</p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] transition-colors active:scale-[0.98]"
          >
            <Plus size={14} /> New department
          </button>
        </AnimatedSection>

        {!loading && departments.length > 0 && (
          <AnimatedSection direction="up" delay={60} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {departments.slice(0, 4).map((d, i) => (
              <button
                key={d.id}
                onClick={() => openDept(d)}
                className="bg-white rounded-[12px] border border-[#E7E9EE] p-4 shadow-[0_1px_2px_rgba(21,22,26,.04)] text-left hover:border-[#3D5AFE]/40 hover:shadow-[0_1px_2px_rgba(61,90,254,.08),0_4px_16px_rgba(61,90,254,.08)] transition-all"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="w-8 h-8 rounded-[8px] bg-[#3D5AFE]/10 flex items-center justify-center mb-3">
                  <Building2 size={15} className="text-[#3D5AFE]" />
                </div>
                <p className="text-xs font-semibold text-[#15161A] truncate">{d.name}</p>
                <p className="text-xl font-bold text-[#3D5AFE] tabular mt-1">{Number(d.monthly_credits).toLocaleString()}</p>
                <p className="text-xs text-[#5B5F6B]">cr / employee</p>
              </button>
            ))}
          </AnimatedSection>
        )}

        <AnimatedSection direction="up" delay={120}>
          <DataTable
            columns={deptColumns}
            rows={departments}
            loading={loading}
            keyFn={(r) => r.id}
            emptyTitle="No departments yet"
            emptyBody="Create departments and set a monthly credit budget per employee."
          />
        </AnimatedSection>
      </div>

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New department" size="sm">
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label="Department name" id="dept-name" required>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Engineering, Sales, HR"
              required
              className={inputClass()}
            />
          </FormField>
          <FormField label="Base credits per employee / month" id="dept-credits" hint="How many credits each employee in this department gets per month">
            <input
              type="number"
              min="0"
              value={newCredits}
              onChange={(e) => setNewCredits(e.target.value)}
              placeholder="e.g. 500"
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
