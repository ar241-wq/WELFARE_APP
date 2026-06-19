'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { useToast } from '@/components/Toast';
import { getEmployerPackageOffers, respondPackageOffer } from '@/lib/api';
import { Package, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface Perk { id: number; name: string; credit_price: number; category_name?: string; }
interface Provider { id: number; full_name: string; email: string; company_name?: string; }
interface PackageOffer {
  id: number; name: string; description: string; perks: Perk[];
  total_price: number; status: string; providers: Provider[];
  offered_at?: string;
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
      toast(action === 'accept' ? 'Package accepted!' : 'Package rejected', 'success');
    } catch {
      toast('Could not respond', 'error');
    } finally {
      setResponding(null);
    }
  };

  const statusColor: Record<string, string> = {
    offered: 'bg-blue-50 text-blue-700 border-blue-200',
    accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    draft: 'bg-[#F7F8FA] text-[#5B5F6B] border-[#E7E9EE]',
  };

  return (
    <AppShell role="employer" pageTitle="Package Offers">
      <div className="max-w-2xl space-y-5">
        <div>
          <h2 className="text-base font-semibold text-[#15161A]">Provider Package Offers</h2>
          <p className="text-xs text-[#5B5F6B] mt-0.5">Joint deals created by two or more providers, offered specifically to your company</p>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 shimmer rounded-[12px]" />)}</div>
        ) : offers.length === 0 ? (
          <div className="bg-white rounded-[16px] border border-dashed border-[#E7E9EE] py-16 text-center">
            <Package size={28} className="text-[#E7E9EE] mx-auto mb-3" />
            <p className="font-semibold text-[#15161A] text-sm mb-1">No package offers yet</p>
            <p className="text-xs text-[#5B5F6B]">Providers can create collaboration packages and offer them directly to you.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {offers.map((offer) => (
              <div key={offer.id} className={`bg-white rounded-[12px] border shadow-[0_1px_2px_rgba(21,22,26,.04)] overflow-hidden ${offer.status === 'offered' ? 'border-[#3D5AFE]/30' : 'border-[#E7E9EE]'}`}>
                {/* Header */}
                <button
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[#F7F8FA]/50 transition-colors"
                  onClick={() => setExpanded(expanded === offer.id ? null : offer.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Package size={16} className="text-[#3D5AFE] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#15161A]">{offer.name}</p>
                      <p className="text-xs text-[#5B5F6B] mt-0.5">
                        {offer.providers.map((p) => p.company_name || p.full_name).join(' × ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${statusColor[offer.status]}`}>
                      {offer.status}
                    </span>
                    {expanded === offer.id ? <ChevronUp size={14} className="text-[#5B5F6B]" /> : <ChevronDown size={14} className="text-[#5B5F6B]" />}
                  </div>
                </button>

                {/* Expanded detail */}
                {expanded === offer.id && (
                  <div className="px-5 pb-5 border-t border-[#F7F8FA] space-y-4 pt-4">
                    {offer.description && <p className="text-sm text-[#5B5F6B]">{offer.description}</p>}

                    {/* Perks list */}
                    <div>
                      <p className="text-xs font-semibold text-[#5B5F6B] uppercase tracking-wider mb-2">Included perks</p>
                      <div className="space-y-1.5">
                        {offer.perks.map((perk) => (
                          <div key={perk.id} className="flex items-center justify-between px-3 py-2 bg-[#F7F8FA] rounded-[6px]">
                            <div>
                              <p className="text-sm font-medium text-[#15161A]">{perk.name}</p>
                              {perk.category_name && <p className="text-xs text-[#5B5F6B]">{perk.category_name}</p>}
                            </div>
                            <span className="text-sm font-bold text-[#3D5AFE] tabular">{perk.credit_price} cr</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center py-2 border-t border-[#E7E9EE]">
                      <span className="text-sm font-medium text-[#5B5F6B]">Total credits</span>
                      <span className="text-lg font-bold text-[#3D5AFE] tabular">
                        {offer.perks.reduce((s, p) => s + Number(p.credit_price), 0)} cr
                      </span>
                    </div>

                    {/* Actions */}
                    {offer.status === 'offered' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRespond(offer.id, 'reject')}
                          disabled={responding === offer.id}
                          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[8px] border border-[#E7E9EE] text-sm font-medium text-[#D23B3B] hover:bg-red-50 disabled:opacity-60"
                        >
                          <XCircle size={14} /> Decline
                        </button>
                        <button
                          onClick={() => handleRespond(offer.id, 'accept')}
                          disabled={responding === offer.id}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] disabled:opacity-60"
                        >
                          {responding === offer.id
                            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <CheckCircle size={14} />}
                          Accept Package
                        </button>
                      </div>
                    )}
                    {offer.status !== 'offered' && (
                      <p className={`text-center text-sm font-semibold py-2 rounded-[8px] ${statusColor[offer.status]}`}>
                        {offer.status === 'accepted' ? '✓ You accepted this package' : '✗ You declined this package'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
