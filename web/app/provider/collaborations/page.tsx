'use client';

import { useEffect, useRef, useState } from 'react';
import AppShell from '@/components/AppShell';
import Modal from '@/components/Modal';
import FormField, { inputClass } from '@/components/FormField';
import StatusPill from '@/components/StatusPill';
import { useToast } from '@/components/Toast';
import {
  getCollaborations, inviteCollaboration, respondCollaboration,
  deleteCollaborationInvite, updateCollaborationInvite,
  getPackageDeals, createPackageDeal, updatePackageDeal,
  offerPackageDeal, deletePackageDeal, getMe,
  getCollaborationPerks, confirmPackageDeal, getPackageDeal,
} from '@/lib/api';
import { Handshake, Plus, CheckCircle, XCircle, Package, Trash2, Send, ChevronRight, Pencil } from 'lucide-react';

interface Provider { id: number; full_name: string; email: string; company_name?: string; }
interface Collab { id: number; from_provider: Provider; to_provider: Provider; message: string; status: string; created_at: string; package_count: number; }
interface Perk { id: number; name: string; credit_price: number; category_name?: string; provider_name?: string; }
interface PackagePerk { id: number; name: string; credit_price: number; }
interface Package { id: number; collab_id: number; name: string; description: string; perks: PackagePerk[]; total_price: number; discount_percentage: number; discounted_price: number; status: string; target_employer_name?: string; providers: Provider[]; offered_at?: string; from_provider_confirmed: boolean; to_provider_confirmed: boolean; }
interface CollabPerks { from_provider: { id: number; name: string; perks: Perk[] }; to_provider: { id: number; name: string; perks: Perk[] }; }

type View = 'list' | 'package';

export default function CollaborationsPage() {
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [collabs, setCollabs] = useState<Collab[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [collabPerks, setCollabPerks] = useState<CollabPerks | null>(null);
  const [collabPerksLoading, setCollabPerksLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('list');
  const [activePackage, setActivePackage] = useState<Package | null>(null);
  const [confirming, setConfirming] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // edit invite modal
  const [editInviteOpen, setEditInviteOpen] = useState(false);
  const [editInviteId, setEditInviteId] = useState<number | null>(null);
  const [editInviteMessage, setEditInviteMessage] = useState('');
  const [editInviteSubmitting, setEditInviteSubmitting] = useState(false);

  // invite modal
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);

  // new package modal
  const [pkgOpen, setPkgOpen] = useState(false);
  const [pkgCollabId, setPkgCollabId] = useState<number | null>(null);
  const [pkgName, setPkgName] = useState('');
  const [pkgDesc, setPkgDesc] = useState('');
  const [pkgPrice, setPkgPrice] = useState('');
  const [pkgSubmitting, setPkgSubmitting] = useState(false);

  // edit package state (inline in package detail view)
  const [editEmployerEmail, setEditEmployerEmail] = useState('');
  const [editEmployerSaving, setEditEmployerSaving] = useState(false);
  const [selectedPerkIds, setSelectedPerkIds] = useState<number[]>([]);
  const [perkSaving, setPerkSaving] = useState(false);
  const [offering, setOffering] = useState(false);
  const [discount, setDiscount] = useState('');
  const [discountSaving, setDiscountSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [me, c, p] = await Promise.all([getMe(), getCollaborations(), getPackageDeals()]);
      setCurrentUserId(me?.id ?? null);
      setCollabs(Array.isArray(c) ? c : []);
      setPackages(Array.isArray(p) ? p : []);
    } catch { /* noop */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Poll for updates every 4s while viewing a package detail
  useEffect(() => {
    if (view === 'package' && activePackage) {
      const refresh = async () => {
        try {
          const updated = await getPackageDeal(activePackage.id);
          setActivePackage(updated);
          setPackages((prev) => prev.map((p) => p.id === updated.id ? updated : p));
          setDiscount(updated.discount_percentage > 0 ? String(updated.discount_percentage) : '');
          setSelectedPerkIds(updated.perks.map((p: { id: number }) => p.id));
        } catch { /* noop */ }
      };
      pollRef.current = setInterval(refresh, 4000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [view, activePackage?.id]);

  const openPackage = async (pkg: Package) => {
    setActivePackage(pkg);
    setSelectedPerkIds(pkg.perks.map((p) => p.id));
    setEditEmployerEmail('');
    setDiscount(pkg.discount_percentage > 0 ? String(pkg.discount_percentage) : '');
    setCollabPerks(null);
    setView('package');
    if (pkg.collab_id) {
      setCollabPerksLoading(true);
      try {
        const cp = await getCollaborationPerks(pkg.collab_id);
        setCollabPerks(cp);
      } catch { /* noop */ }
      setCollabPerksLoading(false);
    }
  };

  const handleSaveDiscount = async () => {
    if (!activePackage) return;
    setDiscountSaving(true);
    try {
      const updated = await updatePackageDeal(activePackage.id, { discount_percentage: Number(discount) || 0 });
      setActivePackage(updated);
      setPackages((prev) => prev.map((p) => p.id === updated.id ? updated : p));
      toast('Discount saved', 'success');
    } catch {
      toast('Could not save discount', 'error');
    } finally {
      setDiscountSaving(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSubmitting(true);
    try {
      const c = await inviteCollaboration({ email: inviteEmail, message: inviteMessage });
      setCollabs((prev) => [c, ...prev]);
      toast('Collaboration invite sent', 'success');
      setInviteOpen(false);
      setInviteEmail(''); setInviteMessage('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setInviteError(msg || 'Could not send invite.');
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleLeaveCollaboration = async (id: number) => {
    if (!window.confirm('Are you sure you want to leave this collaboration? All packages associated with it will also be deleted.')) return;
    try {
      await deleteCollaborationInvite(id);
      setCollabs((prev) => prev.filter((c) => c.id !== id));
      setPackages((prev) => prev.filter((p) => p.collab_id !== id));
      if (view === 'package' && activePackage?.collab_id === id) setView('list');
      toast('You have left the collaboration', 'success');
    } catch {
      toast('Could not leave collaboration', 'error');
    }
  };

  const handleCancelInvite = async (id: number) => {
    if (!window.confirm('Cancel this collaboration invite?')) return;
    try {
      await deleteCollaborationInvite(id);
      setCollabs((prev) => prev.filter((c) => c.id !== id));
      toast('Invite cancelled', 'success');
    } catch {
      toast('Could not cancel invite', 'error');
    }
  };

  const openEditInvite = (c: Collab) => {
    setEditInviteId(c.id);
    setEditInviteMessage(c.message);
    setEditInviteOpen(true);
  };

  const handleEditInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editInviteId) return;
    setEditInviteSubmitting(true);
    try {
      const updated = await updateCollaborationInvite(editInviteId, { message: editInviteMessage });
      setCollabs((prev) => prev.map((c) => c.id === editInviteId ? { ...c, ...updated } : c));
      toast('Invite updated', 'success');
      setEditInviteOpen(false);
    } catch {
      toast('Could not update invite', 'error');
    } finally {
      setEditInviteSubmitting(false);
    }
  };

  const handleRespond = async (id: number, action: 'accept' | 'decline') => {
    try {
      const updated = await respondCollaboration(id, action);
      setCollabs((prev) => prev.map((c) => c.id === id ? { ...c, ...updated } : c));
      toast(action === 'accept' ? 'Collaboration accepted!' : 'Invite declined', 'success');
    } catch {
      toast('Could not respond', 'error');
    }
  };

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgCollabId || !pkgName) return;
    setPkgSubmitting(true);
    try {
      const pkg = await createPackageDeal({
        collaboration_id: pkgCollabId,
        name: pkgName,
        description: pkgDesc,
        total_price: Number(pkgPrice) || 0,
      });
      setPackages((prev) => [pkg, ...prev]);
      toast('Package created', 'success');
      setPkgOpen(false);
      setPkgName(''); setPkgDesc(''); setPkgPrice(''); setPkgCollabId(null);
      openPackage(pkg);
    } catch {
      toast('Could not create package', 'error');
    } finally {
      setPkgSubmitting(false);
    }
  };

  const handleSavePerks = async () => {
    if (!activePackage) return;
    setPerkSaving(true);
    try {
      const updated = await updatePackageDeal(activePackage.id, { perk_ids: selectedPerkIds });
      setActivePackage(updated);
      setPackages((prev) => prev.map((p) => p.id === updated.id ? updated : p));
      toast('Perks updated', 'success');
    } catch {
      toast('Could not update perks', 'error');
    } finally {
      setPerkSaving(false);
    }
  };

  const handleSetEmployer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePackage || !editEmployerEmail) return;
    setEditEmployerSaving(true);
    try {
      const updated = await updatePackageDeal(activePackage.id, { target_employer_email: editEmployerEmail });
      setActivePackage(updated);
      setPackages((prev) => prev.map((p) => p.id === updated.id ? updated : p));
      toast('Target employer set', 'success');
      setEditEmployerEmail('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast(msg || 'Employer not found', 'error');
    } finally {
      setEditEmployerSaving(false);
    }
  };

  const handleOffer = async () => {
    if (!activePackage) return;
    setOffering(true);
    try {
      const updated = await offerPackageDeal(activePackage.id);
      setActivePackage(updated);
      setPackages((prev) => prev.map((p) => p.id === updated.id ? updated : p));
      toast('Package offered to employer!', 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast(msg || 'Could not offer package', 'error');
    } finally {
      setOffering(false);
    }
  };

  const handleConfirm = async () => {
    if (!activePackage) return;
    setConfirming(true);
    try {
      const updated = await confirmPackageDeal(activePackage.id);
      setActivePackage(updated);
      setPackages((prev) => prev.map((p) => p.id === updated.id ? updated : p));
      toast('Agreement updated', 'success');
    } catch {
      toast('Could not update agreement', 'error');
    } finally {
      setConfirming(false);
    }
  };

  const handleDeletePackage = async (id: number) => {
    if (!window.confirm('Delete this package?')) return;
    try {
      await deletePackageDeal(id);
      setPackages((prev) => prev.filter((p) => p.id !== id));
      if (view === 'package') setView('list');
      toast('Package deleted', 'success');
    } catch {
      toast('Could not delete', 'error');
    }
  };

  const togglePerk = (id: number) => {
    setSelectedPerkIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const pending = collabs.filter((c) => c.status === 'pending');
  const active = collabs.filter((c) => c.status === 'accepted');

  const statusColor: Record<string, string> = {
    draft: 'bg-[#F7F8FA] text-[#5B5F6B]',
    offered: 'bg-blue-50 text-blue-700',
    accepted: 'bg-emerald-50 text-emerald-700',
    rejected: 'bg-red-50 text-red-700',
  };

  // ── Package detail view ─────────────────────────────────────────────────
  if (view === 'package' && activePackage) {
    const isDraft = activePackage.status === 'draft';
    const bothConfirmed = activePackage.from_provider_confirmed && activePackage.to_provider_confirmed;
    const canOffer = isDraft && !!activePackage.target_employer_name && activePackage.perks.length > 0 && bothConfirmed;
    // Determine which provider slot the current user is
    const iAmFromProvider = activePackage.providers[0]?.id === currentUserId;
    const myConfirmed = iAmFromProvider ? activePackage.from_provider_confirmed : activePackage.to_provider_confirmed;
    const partnerConfirmed = iAmFromProvider ? activePackage.to_provider_confirmed : activePackage.from_provider_confirmed;
    const partnerName = iAmFromProvider ? activePackage.providers[1]?.company_name || activePackage.providers[1]?.full_name : activePackage.providers[0]?.company_name || activePackage.providers[0]?.full_name;
    // All perks from both providers for the selector
    const allCollabPerks = collabPerks
      ? [
          ...collabPerks.from_provider.perks.map(p => ({ ...p, _owner: collabPerks.from_provider.name, _ownerId: collabPerks.from_provider.id })),
          ...collabPerks.to_provider.perks.map(p => ({ ...p, _owner: collabPerks.to_provider.name, _ownerId: collabPerks.to_provider.id })),
        ]
      : [];

    return (
      <AppShell role="provider" pageTitle="Package Deal">
        <div className="max-w-2xl space-y-5">
          {/* Back + status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setView('list')} className="flex items-center gap-1 text-sm text-[#5B5F6B] hover:text-[#15161A]">
                <ChevronRight size={14} className="rotate-180" /> Back
              </button>
              <span className="text-[#E7E9EE]">/</span>
              <h2 className="text-base font-semibold text-[#15161A]">{activePackage.name}</h2>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColor[activePackage.status]}`}>
                {activePackage.status}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={async () => { try { const u = await getPackageDeal(activePackage.id); setActivePackage(u); setDiscount(u.discount_percentage > 0 ? String(u.discount_percentage) : ''); setSelectedPerkIds(u.perks.map((p: {id: number}) => p.id)); } catch {} }}
                className="text-xs text-[#5B5F6B] hover:text-[#3D5AFE] font-medium"
                title="Refresh to see partner's latest changes"
              >
                ↻ Refresh
              </button>
              <button onClick={() => handleDeletePackage(activePackage.id)} className="text-[#D23B3B] hover:opacity-70">
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          {/* Providers */}
          <div className="bg-white rounded-[12px] border border-[#E7E9EE] p-4">
            <p className="text-xs font-semibold text-[#5B5F6B] uppercase tracking-wider mb-3">Partner providers</p>
            <div className="flex items-center gap-4">
              {activePackage.providers.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2">
                  {i > 0 && <span className="text-[#E7E9EE] font-bold">+</span>}
                  <div className="w-8 h-8 rounded-full bg-[#3D5AFE]/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[#3D5AFE]">{p.full_name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#15161A]">{p.company_name || p.full_name}</p>
                    <p className="text-xs text-[#5B5F6B]">{p.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Perks selector — both providers' perks */}
          <div className="bg-white rounded-[12px] border border-[#E7E9EE] p-5">
            <p className="text-xs font-semibold text-[#5B5F6B] uppercase tracking-wider mb-3">Select perks from both providers</p>
            {collabPerksLoading ? (
              <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-10 shimmer rounded" />)}</div>
            ) : allCollabPerks.length === 0 ? (
              <p className="text-sm text-[#5B5F6B]">No active perks found for this collaboration.</p>
            ) : (
              <>
                {collabPerks && [collabPerks.from_provider, collabPerks.to_provider].map((group) => (
                  group.perks.length > 0 && (
                    <div key={group.id} className="mb-4">
                      <p className="text-xs font-semibold text-[#3D5AFE] mb-2">{group.name}</p>
                      <div className="space-y-2">
                        {group.perks.map((perk) => {
                          const selected = selectedPerkIds.includes(perk.id);
                          return (
                            <button
                              key={perk.id}
                              type="button"
                              onClick={() => isDraft && togglePerk(perk.id)}
                              disabled={!isDraft}
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[8px] border text-left transition-colors ${selected ? 'border-[#3D5AFE] bg-[#3D5AFE]/5' : 'border-[#E7E9EE] hover:border-[#3D5AFE]/40'} ${!isDraft ? 'opacity-60 cursor-default' : ''}`}
                            >
                              <div>
                                <p className="text-sm font-semibold text-[#15161A]">{perk.name}</p>
                                <p className="text-xs text-[#5B5F6B]">{perk.category_name}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-[#3D5AFE] tabular">{perk.credit_price} cr</span>
                                {selected && <CheckCircle size={15} className="text-[#3D5AFE]" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )
                ))}
              </>
            )}
            {isDraft && (
              <button
                onClick={handleSavePerks}
                disabled={perkSaving}
                className="mt-3 flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] disabled:opacity-60"
              >
                {perkSaving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Save perks
              </button>
            )}
          </div>

          {/* Agreement section */}
          {isDraft && (
            <div className="bg-white rounded-[12px] border border-[#E7E9EE] p-5">
              <p className="text-xs font-semibold text-[#5B5F6B] uppercase tracking-wider mb-3">Both providers must agree</p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#15161A] font-medium">You</span>
                  {myConfirmed
                    ? <span className="flex items-center gap-1 text-emerald-600 font-semibold text-xs"><CheckCircle size={13} /> Agreed</span>
                    : <span className="text-xs text-[#5B5F6B]">Not agreed yet</span>}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#15161A] font-medium">{partnerName || 'Partner'}</span>
                  {partnerConfirmed
                    ? <span className="flex items-center gap-1 text-emerald-600 font-semibold text-xs"><CheckCircle size={13} /> Agreed</span>
                    : <span className="text-xs text-[#5B5F6B]">Waiting…</span>}
                </div>
              </div>
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] text-sm font-semibold transition-colors ${myConfirmed ? 'bg-[#F7F8FA] text-[#5B5F6B] border border-[#E7E9EE] hover:bg-red-50 hover:text-[#D23B3B] hover:border-red-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'} disabled:opacity-60`}
              >
                {confirming && <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />}
                {myConfirmed ? 'Withdraw my agreement' : 'Agree to this package'}
              </button>
            </div>
          )}

          {/* Target employer */}
          <div className="bg-white rounded-[12px] border border-[#E7E9EE] p-5">
            <p className="text-xs font-semibold text-[#5B5F6B] uppercase tracking-wider mb-3">Target employer</p>
            {activePackage.target_employer_name ? (
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={14} className="text-[#1F9D6B]" />
                <span className="text-sm font-semibold text-[#15161A]">{activePackage.target_employer_name}</span>
              </div>
            ) : (
              <p className="text-sm text-[#5B5F6B] mb-3">No employer set yet.</p>
            )}
            {isDraft && (
              <form onSubmit={handleSetEmployer} className="flex gap-2">
                <input
                  type="email"
                  value={editEmployerEmail}
                  onChange={(e) => setEditEmployerEmail(e.target.value)}
                  placeholder="employer@company.com"
                  className="flex-1 px-3 py-2 text-sm border border-[#E7E9EE] rounded-[8px] focus:border-[#3D5AFE] focus:ring-1 focus:ring-[#3D5AFE] outline-none"
                />
                <button
                  type="submit"
                  disabled={!editEmployerEmail || editEmployerSaving}
                  className="px-4 py-2 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold disabled:opacity-60 hover:bg-[#2E45C4]"
                >
                  {editEmployerSaving ? '…' : 'Set'}
                </button>
              </form>
            )}
          </div>

          {/* Summary + offer */}
          <div className="bg-white rounded-[12px] border border-[#E7E9EE] p-5">
            <p className="text-xs font-semibold text-[#5B5F6B] uppercase tracking-wider mb-3">Summary</p>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[#5B5F6B]">Perks included</span>
              <span className="font-semibold text-[#15161A]">{activePackage.perks.length}</span>
            </div>
            {(() => {
              const original = activePackage.perks.reduce((s, p) => s + Number(p.credit_price), 0);
              const discounted = activePackage.discounted_price ?? original;
              const hasDiscount = activePackage.discount_percentage > 0;
              return (
                <>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#5B5F6B]">Original price</span>
                    <span className={`tabular ${hasDiscount ? 'line-through text-[#9ca3af]' : 'font-bold text-[#3D5AFE]'}`}>{original} cr</span>
                  </div>
                  {hasDiscount && (
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-emerald-600 font-semibold">Discount ({activePackage.discount_percentage}% off)</span>
                      <span className="font-bold text-emerald-600 tabular">−{(original - discounted).toFixed(0)} cr</span>
                    </div>
                  )}
                  {hasDiscount && (
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-bold text-[#15161A]">Final price</span>
                      <span className="font-bold text-[#3D5AFE] tabular">{discounted} cr</span>
                    </div>
                  )}
                </>
              );
            })()}

            {/* Discount setter */}
            {isDraft && (
              <div className="mt-3 mb-4 pt-3 border-t border-[#F7F8FA]">
                <p className="text-xs font-semibold text-[#5B5F6B] mb-2">Bundle discount (%)</p>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="e.g. 15"
                    className="w-24 px-3 py-2 text-sm border border-[#E7E9EE] rounded-[8px] focus:border-[#3D5AFE] focus:ring-1 focus:ring-[#3D5AFE] outline-none"
                  />
                  <span className="text-sm text-[#5B5F6B]">% off the total</span>
                  <button
                    onClick={handleSaveDiscount}
                    disabled={discountSaving}
                    className="ml-auto px-3 py-2 rounded-[8px] bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {discountSaving ? '…' : 'Apply'}
                  </button>
                </div>
              </div>
            )}

            {isDraft ? (
              <button
                onClick={handleOffer}
                disabled={!canOffer || offering}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-[10px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] disabled:opacity-50 transition-colors"
                title={!bothConfirmed ? 'Both providers must agree before offering' : !canOffer ? 'Add perks and set an employer first' : ''}
              >
                {offering ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={14} />}
                {offering ? 'Offering…' : 'Offer to Employer'}
              </button>
            ) : (
              <div className={`text-center py-2 rounded-[8px] text-sm font-semibold ${statusColor[activePackage.status]}`}>
                {activePackage.status === 'offered' ? 'Waiting for employer response…' : activePackage.status === 'accepted' ? '✓ Accepted by employer' : '✗ Rejected by employer'}
              </div>
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Main list view ──────────────────────────────────────────────────────
  return (
    <AppShell role="provider" pageTitle="Collaborations">
      <div className="max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#15161A]">Provider Collaborations</h2>
            <p className="text-xs text-[#5B5F6B] mt-0.5">Team up with another provider to create joint package deals for employers</p>
          </div>
          <button
            onClick={() => { setInviteError(''); setInviteOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] transition-colors active:scale-[0.98]"
          >
            <Handshake size={14} /> Invite Provider
          </button>
        </div>

        {/* Pending invites */}
        {!loading && pending.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-[12px] p-4 space-y-3">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pending invites</p>
            {pending.map((c) => {
              const isSender = c.from_provider.id === currentUserId;
              const isRecipient = c.to_provider.id === currentUserId;
              return (
                <div key={c.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#15161A]">
                      {isSender
                        ? <>Sent to <span className="text-[#3D5AFE]">{c.to_provider.company_name || c.to_provider.full_name}</span></>
                        : <>{c.from_provider.company_name || c.from_provider.full_name}</>}
                    </p>
                    {c.message && <p className="text-xs text-[#5B5F6B] mt-0.5">"{c.message}"</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {isRecipient && (
                      <>
                        <button onClick={() => handleRespond(c.id, 'accept')} className="flex items-center gap-1 px-3 py-1.5 rounded-[6px] bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700">
                          <CheckCircle size={12} /> Accept
                        </button>
                        <button onClick={() => handleRespond(c.id, 'decline')} className="flex items-center gap-1 px-3 py-1.5 rounded-[6px] border border-[#E7E9EE] text-xs font-medium text-[#5B5F6B] hover:bg-white">
                          <XCircle size={12} /> Decline
                        </button>
                      </>
                    )}
                    {isSender && (
                      <>
                        <button onClick={() => openEditInvite(c)} className="flex items-center gap-1 px-3 py-1.5 rounded-[6px] border border-[#E7E9EE] text-xs font-medium text-[#5B5F6B] hover:bg-white">
                          <Pencil size={12} /> Edit
                        </button>
                        <button onClick={() => handleCancelInvite(c.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-[6px] border border-red-200 text-xs font-medium text-[#D23B3B] hover:bg-red-50">
                          <XCircle size={12} /> Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Active collaborations */}
        <div className="bg-white rounded-[12px] border border-[#E7E9EE] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F7F8FA] flex items-center justify-between">
            <p className="text-sm font-semibold text-[#15161A]">Active collaborations</p>
            <span className="text-xs text-[#5B5F6B]">{active.length}</span>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-12 shimmer rounded" />)}</div>
          ) : active.length === 0 ? (
            <div className="p-8 text-center">
              <Handshake size={28} className="text-[#E7E9EE] mx-auto mb-2" />
              <p className="text-sm text-[#5B5F6B]">No active collaborations yet.</p>
              <p className="text-xs text-[#5B5F6B] mt-1">Invite a provider to get started.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#F7F8FA]">
              {active.map((c) => (
                <li key={c.id} className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#15161A]">
                      {c.from_provider.company_name || c.from_provider.full_name}
                      <span className="mx-1.5 text-[#E7E9EE] font-bold">×</span>
                      {c.to_provider.company_name || c.to_provider.full_name}
                    </p>
                    <p className="text-xs text-[#5B5F6B] mt-0.5">{c.package_count} package{c.package_count !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setPkgCollabId(c.id); setPkgOpen(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#3D5AFE] text-white text-xs font-semibold hover:bg-[#2E45C4]"
                    >
                      <Plus size={12} /> New Package
                    </button>
                    <button
                      onClick={() => handleLeaveCollaboration(c.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-red-200 text-xs font-medium text-[#D23B3B] hover:bg-red-50"
                      title="Leave this collaboration"
                    >
                      <XCircle size={12} /> Leave
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Package deals */}
        {packages.length > 0 && (
          <div className="bg-white rounded-[12px] border border-[#E7E9EE] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F7F8FA]">
              <p className="text-sm font-semibold text-[#15161A]">Package deals</p>
            </div>
            <ul className="divide-y divide-[#F7F8FA]">
              {packages.map((pkg) => (
                <li key={pkg.id} className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <Package size={16} className="text-[#3D5AFE] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#15161A] truncate">{pkg.name}</p>
                      <p className="text-xs text-[#5B5F6B]">
                        {pkg.perks.length} perks · {pkg.target_employer_name ? `→ ${pkg.target_employer_name}` : 'No employer set'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                      pkg.status === 'draft' ? 'bg-[#F7F8FA] text-[#5B5F6B]' :
                      pkg.status === 'offered' ? 'bg-blue-50 text-blue-700' :
                      pkg.status === 'accepted' ? 'bg-emerald-50 text-emerald-700' :
                      'bg-red-50 text-red-700'
                    }`}>{pkg.status}</span>
                    <button onClick={() => openPackage(pkg)} className="text-xs text-[#3D5AFE] font-semibold hover:underline">
                      Open
                    </button>
                    <button onClick={() => handleDeletePackage(pkg.id)} className="text-[#D23B3B] hover:opacity-70 ml-1">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Invite modal */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite a Provider" size="sm">
        <form onSubmit={handleInvite} className="space-y-4">
          <FormField label="Provider email" id="inv-email" required>
            <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="partner@provider.com" required className={inputClass()} />
          </FormField>
          <FormField label="Message (optional)" id="inv-msg">
            <textarea value={inviteMessage} onChange={(e) => setInviteMessage(e.target.value)} placeholder="Let's collaborate on a wellness package!" rows={3} className={inputClass()} style={{ resize: 'none' }} />
          </FormField>
          {inviteError && <p className="text-sm text-[#D23B3B]">{inviteError}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setInviteOpen(false)} className="flex-1 px-4 py-2.5 rounded-[8px] border border-[#E7E9EE] text-sm font-medium text-[#5B5F6B] hover:bg-[#F7F8FA]">Cancel</button>
            <button type="submit" disabled={inviteSubmitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] disabled:opacity-60">
              {inviteSubmitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Send invite
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit invite modal */}
      <Modal open={editInviteOpen} onClose={() => setEditInviteOpen(false)} title="Edit Invite" size="sm">
        <form onSubmit={handleEditInvite} className="space-y-4">
          <FormField label="Message" id="edit-inv-msg">
            <textarea value={editInviteMessage} onChange={(e) => setEditInviteMessage(e.target.value)} rows={3} className={inputClass()} style={{ resize: 'none' }} />
          </FormField>
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditInviteOpen(false)} className="flex-1 px-4 py-2.5 rounded-[8px] border border-[#E7E9EE] text-sm font-medium text-[#5B5F6B] hover:bg-[#F7F8FA]">Cancel</button>
            <button type="submit" disabled={editInviteSubmitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] disabled:opacity-60">
              {editInviteSubmitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </Modal>

      {/* New package modal */}
      <Modal open={pkgOpen} onClose={() => setPkgOpen(false)} title="New Package Deal" size="sm">
        <form onSubmit={handleCreatePackage} className="space-y-4">
          <FormField label="Package name" id="pkg-name" required>
            <input type="text" value={pkgName} onChange={(e) => setPkgName(e.target.value)} placeholder="e.g. Ultimate Wellness Bundle" required className={inputClass()} />
          </FormField>
          <FormField label="Description" id="pkg-desc">
            <textarea value={pkgDesc} onChange={(e) => setPkgDesc(e.target.value)} rows={2} placeholder="What makes this package special?" className={inputClass()} style={{ resize: 'none' }} />
          </FormField>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPkgOpen(false)} className="flex-1 px-4 py-2.5 rounded-[8px] border border-[#E7E9EE] text-sm font-medium text-[#5B5F6B] hover:bg-[#F7F8FA]">Cancel</button>
            <button type="submit" disabled={pkgSubmitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] disabled:opacity-60">
              {pkgSubmitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
