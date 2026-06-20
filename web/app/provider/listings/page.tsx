'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import Modal from '@/components/Modal';
import FormField, { inputClass } from '@/components/FormField';
import AnimatedSection from '@/components/AnimatedSection';
import { useToast } from '@/components/Toast';
import { getMyPerks, updatePerk, deletePerk, uploadPerkImage, deletePerkImage } from '@/lib/api';
import { mockMyPerks } from '@/lib/mock-data';
import { Plus, ToggleLeft, ToggleRight, Trash2, Pencil, Upload, X, ImageIcon } from 'lucide-react';

const CATEGORIES = ['Wellness', 'Food', 'Travel', 'Learning', 'Connectivity', 'Lifestyle'];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface PerkImage { id: number; image: string; order: number; }
interface Perk {
  id: number;
  name: string;
  category: string;
  category_name?: string;
  credit_price: number;
  description?: string;
  is_active: boolean;
  tags?: string[];
  images?: PerkImage[];
}

const categoryColor: Record<string, string> = {
  wellness:     'bg-emerald-50 text-emerald-700',
  learning:     'bg-blue-50 text-blue-700',
  food:         'bg-orange-50 text-orange-700',
  lifestyle:    'bg-purple-50 text-purple-700',
  travel:       'bg-sky-50 text-sky-700',
  connectivity: 'bg-indigo-50 text-indigo-700',
};

function imageUrl(src: string) {
  if (!src) return '';
  if (src.startsWith('http') || src.startsWith('data:')) return src;
  return `${API_URL}${src}`;
}

export default function ListingsPage() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [perks, setPerks] = useState<Perk[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Edit modal
  const [editPerk, setEditPerk] = useState<Perk | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const [deletingImg, setDeletingImg] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    getMyPerks()
      .then((d) => setPerks(Array.isArray(d) ? d : mockMyPerks))
      .catch(() => setPerks(mockMyPerks))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openEdit = (perk: Perk) => {
    setEditPerk(perk);
    setEditName(perk.name);
    setEditCategory(perk.category_name || perk.category || '');
    setEditPrice(String(perk.credit_price));
    setEditDesc(perk.description || '');
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPerk) return;
    setEditSaving(true);
    try {
      const updated = await updatePerk(editPerk.id, {
        name: editName,
        category: editCategory,
        credit_price: Number(editPrice),
        description: editDesc,
      });
      setPerks((prev) => prev.map((p) => p.id === editPerk.id ? { ...p, ...updated } : p));
      setEditPerk((prev) => prev ? { ...prev, ...updated } : null);
      toast('Perk updated', 'success');
    } catch {
      toast('Could not update perk', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editPerk || !e.target.files?.[0]) return;
    setImgUploading(true);
    try {
      const img = await uploadPerkImage(editPerk.id, e.target.files[0]);
      setEditPerk((prev) => prev ? { ...prev, images: [...(prev.images || []), img] } : null);
      setPerks((prev) => prev.map((p) =>
        p.id === editPerk.id ? { ...p, images: [...(p.images || []), img] } : p
      ));
      toast('Image uploaded', 'success');
    } catch {
      toast('Could not upload image', 'error');
    } finally {
      setImgUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDeleteImage = async (imgId: number) => {
    if (!editPerk) return;
    setDeletingImg(imgId);
    try {
      await deletePerkImage(editPerk.id, imgId);
      setEditPerk((prev) => prev ? { ...prev, images: prev.images?.filter((i) => i.id !== imgId) } : null);
      setPerks((prev) => prev.map((p) =>
        p.id === editPerk.id ? { ...p, images: p.images?.filter((i) => i.id !== imgId) } : p
      ));
      toast('Image deleted', 'success');
    } catch {
      toast('Could not delete image', 'error');
    } finally {
      setDeletingImg(null);
    }
  };

  const handleToggle = async (id: number, active: boolean) => {
    try { await updatePerk(id, { is_active: active }); } catch { /* demo */ }
    setPerks((prev) => prev.map((p) => p.id === id ? { ...p, is_active: active } : p));
    toast(active ? 'Listing activated' : 'Listing deactivated', 'success');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await deletePerk(deleteTarget); } catch { /* demo */ }
    setPerks((prev) => prev.filter((p) => p.id !== deleteTarget));
    toast('Listing deleted', 'success');
    setDeleteTarget(null);
    setDeleting(false);
  };

  const activeCount   = perks.filter((p) => p.is_active).length;
  const inactiveCount = perks.length - activeCount;

  return (
    <AppShell role="provider" pageTitle="Listings">
      <div className="space-y-5">
        <AnimatedSection direction="up" className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#15161A]">
              {loading ? '…' : `${perks.length} perks listed`}
            </h2>
            {!loading && perks.length > 0 && (
              <p className="text-xs text-[#5B5F6B] mt-0.5">
                {activeCount} active · {inactiveCount} inactive
              </p>
            )}
          </div>
          <Link
            href="/provider/listings/new"
            className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] transition-colors active:scale-[0.98]"
          >
            <Plus size={14} />
            New perk
          </Link>
        </AnimatedSection>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-[12px] border border-[#E7E9EE] overflow-hidden">
                <div className="h-44 shimmer" />
                <div className="p-4 space-y-2">
                  <div className="h-4 shimmer rounded w-3/4" />
                  <div className="h-3 shimmer rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : !perks.length ? (
          <AnimatedSection direction="up">
            <div className="text-center py-20 bg-white rounded-[16px] border border-dashed border-[#E7E9EE]">
              <div className="w-12 h-12 rounded-full bg-[#3D5AFE]/10 flex items-center justify-center mx-auto mb-4">
                <Plus size={20} className="text-[#3D5AFE]" />
              </div>
              <p className="font-semibold text-[#15161A] mb-1">No perks listed yet</p>
              <p className="text-sm text-[#5B5F6B] mb-5">Add your first perk to start reaching employer-funded employees.</p>
              <Link href="/provider/listings/new" className="px-5 py-2.5 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] transition-colors">
                Add first perk
              </Link>
            </div>
          </AnimatedSection>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {perks.map((perk, i) => (
              <AnimatedSection key={perk.id} direction="up" delay={i * 50}>
                <div className={`group bg-white rounded-[12px] border shadow-[0_1px_2px_rgba(21,22,26,.04),0_4px_16px_rgba(21,22,26,.06)] overflow-hidden transition-all duration-[220ms] hover:shadow-[0_8px_32px_rgba(21,22,26,.10)] ${perk.is_active ? 'border-[#E7E9EE]' : 'border-[#E7E9EE] opacity-70'}`}>
                  {/* Image */}
                  <div className="relative h-44 bg-[#F7F8FA] overflow-hidden">
                    {perk.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl(perk.images[0].image)}
                        alt={perk.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[400ms]"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-3xl">🎁</div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${perk.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-[#F7F8FA] text-[#5B5F6B] border-[#E7E9EE]'}`}>
                        {perk.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-[#15161A] text-sm leading-snug">{perk.name}</p>
                      <span className="tabular text-sm font-bold text-[#3D5AFE] shrink-0">{perk.credit_price} cr</span>
                    </div>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize mb-2 ${categoryColor[(perk.category_name || perk.category || '').toLowerCase()] ?? 'bg-[#F7F8FA] text-[#5B5F6B]'}`}>
                      {perk.category_name || perk.category}
                    </span>
                    {perk.description && (
                      <p className="text-xs text-[#5B5F6B] line-clamp-2">{perk.description}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="px-4 pb-4 flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(perk.id, !perk.is_active)}
                      className="flex items-center gap-1.5 flex-1 px-3 py-1.5 rounded-[6px] border border-[#E7E9EE] text-xs font-medium text-[#5B5F6B] hover:border-[#3D5AFE] hover:text-[#3D5AFE] transition-colors"
                    >
                      {perk.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      {perk.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => openEdit(perk)}
                      aria-label="Edit perk"
                      className="p-1.5 rounded-[6px] border border-[#E7E9EE] text-[#5B5F6B] hover:border-[#3D5AFE] hover:text-[#3D5AFE] transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(perk.id)}
                      aria-label="Delete perk"
                      className="p-1.5 rounded-[6px] border border-[#E7E9EE] text-[#5B5F6B] hover:border-[#D23B3B] hover:text-[#D23B3B] transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        )}
      </div>

      {/* ── Edit Modal ── */}
      <Modal open={!!editPerk} onClose={() => setEditPerk(null)} title="Edit Perk" size="md">
        {editPerk && (
          <div className="space-y-5">
            {/* Images */}
            <div>
              <p className="text-xs font-semibold text-[#5B5F6B] uppercase tracking-wider mb-2">Images</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {(editPerk.images || []).map((img) => (
                  <div key={img.id} className="relative w-20 h-20 rounded-[8px] overflow-hidden border border-[#E7E9EE] group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl(img.image)} alt="perk" className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleDeleteImage(img.id)}
                      disabled={deletingImg === img.id}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      {deletingImg === img.id
                        ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <X size={16} className="text-white" />}
                    </button>
                  </div>
                ))}

                {/* Upload button */}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={imgUploading}
                  className="w-20 h-20 rounded-[8px] border-2 border-dashed border-[#E7E9EE] flex flex-col items-center justify-center gap-1 text-[#5B5F6B] hover:border-[#3D5AFE] hover:text-[#3D5AFE] transition-colors disabled:opacity-50"
                >
                  {imgUploading
                    ? <span className="w-4 h-4 border-2 border-[#3D5AFE]/30 border-t-[#3D5AFE] rounded-full animate-spin" />
                    : <><Upload size={16} /><span className="text-[10px] font-medium">Upload</span></>}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>
              {(editPerk.images || []).length === 0 && (
                <p className="text-xs text-[#9ca3af] flex items-center gap-1"><ImageIcon size={12} /> No images yet — upload one to make your perk stand out</p>
              )}
            </div>

            {/* Fields */}
            <form onSubmit={handleEditSave} className="space-y-4">
              <FormField label="Perk name" id="edit-name" required>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={inputClass()} required />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Category" id="edit-cat" required>
                  <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className={inputClass()}>
                    <option value="">Select…</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </FormField>
                <FormField label="Credit price" id="edit-price" required>
                  <div className="relative">
                    <input
                      type="number" min="1" value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className={`${inputClass()} pr-10 tabular`}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#5B5F6B]">cr</span>
                  </div>
                </FormField>
              </div>

              <FormField label="Description" id="edit-desc">
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className={inputClass()}
                  style={{ resize: 'vertical' }}
                />
              </FormField>

              <div className="flex gap-2 pt-2 border-t border-[#E7E9EE]">
                <button type="button" onClick={() => setEditPerk(null)} className="flex-1 px-4 py-2.5 rounded-[8px] border border-[#E7E9EE] text-sm font-medium text-[#5B5F6B] hover:bg-[#F7F8FA]">
                  Cancel
                </button>
                <button type="submit" disabled={editSaving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] disabled:opacity-60">
                  {editSaving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Save changes
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* ── Delete Modal ── */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete listing" size="sm">
        <p className="text-sm text-[#5B5F6B] mb-5">This will permanently remove the listing. Employees won&apos;t be able to see or redeem it.</p>
        <div className="flex gap-2">
          <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 rounded-[8px] border border-[#E7E9EE] text-sm font-medium text-[#5B5F6B] hover:bg-[#F7F8FA]">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={deleting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#D23B3B] text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60">
            {deleting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Delete
          </button>
        </div>
      </Modal>
    </AppShell>
  );
}
