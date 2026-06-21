'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { useToast } from '@/components/Toast';
import { getEmployerPackageOffers, respondPackageOffer } from '@/lib/api';
import {
  Package, CheckCircle, XCircle, ChevronDown, ChevronUp,
  Tag, Sparkles, Users, Clock,
} from 'lucide-react';

interface Perk { id: number; name: string; credit_price: number; category_name?: string; }
interface Provider { id: number; full_name: string; email: string; company_name?: string; }
interface PackageOffer {
  id: number;
  name: string;
  description: string;
  perks: Perk[];
  total_price: number;
  discount_percentage?: number;
  discounted_price?: number;
  status: string;
  providers: Provider[];
  offered_at?: string;
}

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string; label: string }> = {
  offered:  { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    label: 'Pending Review' },
  accepted: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Accepted' },
  rejected: { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     label: 'Declined' },
  draft:    { bg: 'bg-[#F7F8FA]',  text: 'text-[#5B5F6B]',  border: 'border-[#E7E9EE]',   label: 'Draft' },
};

function ProviderBadge({ provider }: { provider: Provider }) {
  const name = provider.company_name || provider.full_name;
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F0F2FF] border border-[#3D5AFE]/20 text-xs font-semibold text-[#3D5AFE]">
      <span className="w-4 h-4 rounded-full bg-[#3D5AFE] text-white flex items-center justify-center text-[9px] font-bold shrink-0">
        {initials}
      </span>
      {name}
    </span>
  );
}

export default function PackageOffersPage() {
  const { toast } = useToast();
  const [offers, setOffers] = useState<PackageOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [responding, setResponding] = useState<number | null>(null);

  useEffect(() => {
    getEmployerPackageOffers()
      .then((d) => setOffers(Array.isArray(d) ? d : []))
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRespond = async (id: number, action: 'accept' | 'reject') => {
    setResponding(id);
    try {
      const updated = await respondPackageOffer(id, action);
      setOffers((prev) => prev.map((o) => o.id === id ? { ...o, ...updated } : o));
      toast(action === 'accept' ? 'Package accepted!' : 'Package declined', 'success');
    } catch {
      toast('Could not respond', 'error');
    } finally {
      setResponding(null);
    }
  };

  const pending   = offers.filter((o) => o.status === 'offered').length;
  const accepted  = offers.filter((o) => o.status === 'accepted').length;
  const savedTotal = offers
    .filter((o) => o.status === 'accepted' && o.discount_percentage && o.discounted_price)
    .reduce((sum, o) => {
      const base = o.perks.reduce((s, p) => s + Number(p.credit_price), 0);
      return sum + (base - (o.discounted_price ?? base));
    }, 0);

  return (
    <AppShell role="employer" pageTitle="Package Offers">
      <div className="max-w-2xl space-y-6">

        {/* Header */}
        <div>
          <h2 className="text-base font-semibold text-[#15161A]">Provider Package Offers</h2>
          <p className="text-xs text-[#5B5F6B] mt-0.5">
            Joint deals created by two or more providers, offered exclusively to your company
          </p>
        </div>

        {/* Stats bar */}
        {!loading && offers.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Pending Review', value: pending,  icon: Clock,    color: 'text-blue-600',    bg: 'bg-blue-50'    },
              { label: 'Accepted',       value: accepted, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Credits Saved',  value: savedTotal > 0 ? `${savedTotal} cr` : '—', icon: Tag, color: 'text-violet-600', bg: 'bg-violet-50' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white border border-[#E7E9EE] rounded-[12px] px-4 py-3 flex items-center gap-3 shadow-[0_1px_2px_rgba(21,22,26,.04)]">
                <div className={`w-8 h-8 rounded-[8px] ${bg} flex items-center justify-center shrink-0`}>
                  <Icon size={15} className={color} />
                </div>
                <div>
                  <p className="text-base font-bold text-[#15161A] leading-tight">{value}</p>
                  <p className="text-[10px] text-[#5B5F6B] leading-tight">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 shimmer rounded-[12px]" />)}
          </div>
        ) : offers.length === 0 ? (
          <div className="bg-white rounded-[16px] border border-dashed border-[#E7E9EE] py-16 text-center">
            <Package size={28} className="text-[#D4D7E0] mx-auto mb-3" />
            <p className="font-semibold text-[#15161A] text-sm mb-1">No package offers yet</p>
            <p className="text-xs text-[#5B5F6B]">Providers can create collaboration packages and offer them directly to you.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {offers.map((offer) => {
              const s = STATUS_STYLE[offer.status] ?? STATUS_STYLE.draft;
              const baseCredits = offer.perks.reduce((sum, p) => sum + Number(p.credit_price), 0);
              const hasDiscount = offer.discount_percentage && Number(offer.discount_percentage) > 0;
              const finalPrice = hasDiscount ? (offer.discounted_price ?? baseCredits) : baseCredits;
              const isExpanded = expanded === offer.id;

              return (
                <div
                  key={offer.id}
                  className={`bg-white rounded-[14px] border shadow-[0_1px_3px_rgba(21,22,26,.06)] overflow-hidden transition-shadow hover:shadow-[0_2px_8px_rgba(21,22,26,.08)] ${
                    offer.status === 'offered' ? 'border-[#3D5AFE]/25' : 'border-[#E7E9EE]'
                  }`}
                >
                  {/* Discount banner */}
                  {hasDiscount && (
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-1.5 flex items-center gap-2">
                      <Sparkles size={12} className="text-white" />
                      <span className="text-xs font-bold text-white">
                        {Number(offer.discount_percentage)}% Bundle Discount — save {baseCredits - finalPrice} credits
                      </span>
                    </div>
                  )}

                  {/* Card header */}
                  <button
                    className="w-full px-5 py-4 flex items-start justify-between text-left gap-3"
                    onClick={() => setExpanded(isExpanded ? null : offer.id)}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-[10px] bg-[#F0F2FF] flex items-center justify-center shrink-0 mt-0.5">
                        <Package size={16} className="text-[#3D5AFE]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-[#15161A]">{offer.name}</p>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${s.bg} ${s.text} ${s.border}`}>
                            {s.label}
                          </span>
                        </div>
                        {/* Provider badges */}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <Users size={11} className="text-[#9CA3AF]" />
                          {offer.providers.map((p) => (
                            <ProviderBadge key={p.id} provider={p} />
                          ))}
                        </div>
                        {/* Price preview */}
                        <div className="flex items-baseline gap-1.5 mt-2">
                          {hasDiscount ? (
                            <>
                              <span className="text-base font-bold text-[#15161A]">{finalPrice} cr</span>
                              <span className="text-xs text-[#9CA3AF] line-through">{baseCredits} cr</span>
                            </>
                          ) : (
                            <span className="text-base font-bold text-[#15161A]">{finalPrice} cr</span>
                          )}
                          <span className="text-xs text-[#5B5F6B]">· {offer.perks.length} perk{offer.perks.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 mt-1">
                      {isExpanded
                        ? <ChevronUp size={15} className="text-[#9CA3AF]" />
                        : <ChevronDown size={15} className="text-[#9CA3AF]" />}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-[#F0F2FF] space-y-4 pt-4">
                      {offer.description && (
                        <p className="text-sm text-[#5B5F6B] leading-relaxed">{offer.description}</p>
                      )}

                      {/* Perks */}
                      <div>
                        <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">Included Perks</p>
                        <div className="space-y-1.5">
                          {offer.perks.map((perk) => (
                            <div key={perk.id} className="flex items-center justify-between px-3 py-2.5 bg-[#F7F8FA] rounded-[8px]">
                              <div>
                                <p className="text-sm font-medium text-[#15161A]">{perk.name}</p>
                                {perk.category_name && (
                                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">{perk.category_name}</p>
                                )}
                              </div>
                              <span className="text-sm font-bold text-[#5B5F6B] tabular-nums">{perk.credit_price} cr</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Price summary */}
                      <div className="rounded-[10px] border border-[#E7E9EE] overflow-hidden">
                        <div className="flex justify-between items-center px-4 py-2.5 bg-[#F7F8FA]">
                          <span className="text-xs text-[#5B5F6B]">Original price</span>
                          <span className="text-sm font-semibold text-[#5B5F6B] tabular-nums">{baseCredits} cr</span>
                        </div>
                        {hasDiscount && (
                          <div className="flex justify-between items-center px-4 py-2.5 border-t border-[#E7E9EE] bg-emerald-50">
                            <span className="text-xs text-emerald-700 font-medium">Discount ({Number(offer.discount_percentage)}%)</span>
                            <span className="text-sm font-semibold text-emerald-700 tabular-nums">−{baseCredits - finalPrice} cr</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center px-4 py-3 border-t border-[#E7E9EE] bg-white">
                          <span className="text-sm font-bold text-[#15161A]">You pay</span>
                          <span className="text-lg font-black text-[#3D5AFE] tabular-nums">{finalPrice} cr</span>
                        </div>
                      </div>

                      {/* Offered date */}
                      {offer.offered_at && (
                        <p className="text-xs text-[#9CA3AF] flex items-center gap-1.5">
                          <Clock size={11} />
                          Offered {new Date(offer.offered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}

                      {/* Actions */}
                      {offer.status === 'offered' ? (
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleRespond(offer.id, 'reject')}
                            disabled={responding === offer.id}
                            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[8px] border border-[#E7E9EE] text-sm font-medium text-[#D23B3B] hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            <XCircle size={14} /> Decline
                          </button>
                          <button
                            onClick={() => handleRespond(offer.id, 'accept')}
                            disabled={responding === offer.id}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] transition-colors disabled:opacity-50"
                          >
                            {responding === offer.id
                              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              : <CheckCircle size={14} />}
                            Accept Package
                          </button>
                        </div>
                      ) : (
                        <div className={`flex items-center justify-center gap-2 py-2.5 rounded-[8px] text-sm font-semibold border ${s.bg} ${s.text} ${s.border}`}>
                          {offer.status === 'accepted'
                            ? <><CheckCircle size={14} /> Package accepted</>
                            : <><XCircle size={14} /> Package declined</>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
