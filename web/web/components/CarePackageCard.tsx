'use client';

import { useState } from 'react';
import { Heart, CheckCircle } from 'lucide-react';
import { useToast } from './Toast';
import { approveCarePackage } from '@/lib/api';

const EVENT_LABELS: Record<string, string> = {
  new_baby:      'New Baby',
  medical:       'Medical Leave',
  medical_leave: 'Medical Leave',
  relocation:    'Relocation',
  bereavement:   'Bereavement',
  burnout:       'Burnout Leave',
  burnout_leave: 'Burnout Leave',
};

interface Perk {
  id: number;
  name: string;
  credit_price: number;
}

interface CarePackage {
  id: number;
  status: string;
  credit_boost: string | number;
  perks: Perk[];
  total_donations: number;
  approved_at: string | null;
}

export interface LifeEvent {
  id: number;
  employee_name: string;
  event_type: string;
  event_type_display: string;
  note: string;
  is_active: boolean;
  created_at: string;
  care_package: CarePackage;
}

interface CarePackageCardProps {
  event: LifeEvent;
  onApproved?: (id: number) => void;
}

export default function CarePackageCard({ event, onApproved }: CarePackageCardProps) {
  const [boost, setBoost] = useState(200);
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(event.care_package?.status === 'approved');
  const [ribbonVisible, setRibbonVisible] = useState(false);
  const { toast } = useToast();

  const handleApprove = async () => {
    setLoading(true);
    try {
      await approveCarePackage(event.id, boost);
      setRibbonVisible(true);
      setApproved(true);
      toast(`Care package approved for ${event.employee_name}`, 'care');
      onApproved?.(event.id);
    } catch {
      toast('Something went wrong. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const label = EVENT_LABELS[event.event_type] ?? event.event_type_display ?? event.event_type;
  const perks = event.care_package?.perks ?? [];

  return (
    <div className={`bg-white rounded-[12px] border overflow-hidden transition-all duration-300 ${
      approved ? 'border-[#E8623D]/30' : 'border-[#E7E9EE]'
    } shadow-[0_1px_2px_rgba(21,22,26,.04),0_4px_16px_rgba(21,22,26,.06)]`}>

      {/* Care Ribbon */}
      <div className="relative h-1.5 bg-[#E7E9EE] overflow-hidden">
        <div
          className={`absolute inset-0 bg-[#E8623D] origin-left ${ribbonVisible ? 'ribbon-sweep' : approved ? 'scale-x-100' : 'scale-x-0'}`}
          style={{ transform: ribbonVisible || approved ? undefined : 'scaleX(0)' }}
        />
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Heart size={14} className="text-[#E8623D]" />
              <span className="text-xs font-semibold text-[#E8623D] uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-base font-semibold text-[#15161A]">{event.employee_name}</p>
          </div>
          {approved && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-[#1F9D6B] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <CheckCircle size={11} />
              Approved
            </span>
          )}
        </div>

        {/* Suggested perks */}
        {perks.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-medium text-[#5B5F6B] mb-2">Suggested care package</p>
            <div className="flex flex-wrap gap-1.5">
              {perks.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1.5 bg-[#FCEDE7] border border-[#E8623D]/20 text-[#E8623D] text-xs font-medium px-2.5 py-1 rounded-full"
                >
                  {p.name}
                  <span className="tabular opacity-70">{p.credit_price}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Credit boost + action */}
        {!approved && (
          <div className="flex items-center gap-3 pt-4 border-t border-[#E7E9EE]">
            <div className="flex items-center gap-2">
              <label htmlFor={`boost-${event.id}`} className="text-xs font-medium text-[#5B5F6B] whitespace-nowrap">
                Credit boost
              </label>
              <input
                id={`boost-${event.id}`}
                type="number"
                value={boost}
                onChange={(e) => setBoost(Number(e.target.value))}
                min={0}
                step={50}
                className="w-24 px-3 py-1.5 text-sm tabular font-semibold text-[#15161A] border border-[#E7E9EE] rounded-[8px] focus:border-[#E8623D] focus:ring-1 focus:ring-[#E8623D] outline-none"
              />
            </div>
            <button
              onClick={handleApprove}
              disabled={loading}
              className="ml-auto flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#E8623D] text-white text-sm font-semibold transition-all duration-[120ms] hover:bg-[#D4522E] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Heart size={13} />
              )}
              Approve Care Package
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
