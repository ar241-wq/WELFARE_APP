'use client';

import { ToggleLeft, ToggleRight, Pencil, Trash2 } from 'lucide-react';

export interface Perk {
  id: number;
  name: string;
  category: string;
  credit_price: number;
  description?: string;
  is_active: boolean;
  images?: string[];
}

const categoryColors: Record<string, string> = {
  wellness:     'bg-emerald-50 text-emerald-700',
  food:         'bg-amber-50 text-amber-700',
  travel:       'bg-sky-50 text-sky-700',
  learning:     'bg-violet-50 text-violet-700',
  connectivity: 'bg-blue-50 text-blue-700',
  lifestyle:    'bg-rose-50 text-rose-700',
};

interface PerkCardProps {
  perk: Perk;
  onToggle?: (id: number, active: boolean) => void;
  onEdit?: (perk: Perk) => void;
  onDelete?: (id: number) => void;
  mini?: boolean;
}

export default function PerkCard({ perk, onToggle, onEdit, onDelete, mini }: PerkCardProps) {
  const catClass = categoryColors[perk.category?.toLowerCase()] ?? 'bg-[#F7F8FA] text-[#5B5F6B]';

  if (mini) {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${catClass}`}>
        {perk.name}
        <span className="tabular font-semibold">{perk.credit_price}</span>
      </span>
    );
  }

  return (
    <div className={`bg-white rounded-[12px] border border-[#E7E9EE] overflow-hidden transition-shadow duration-[120ms] hover:shadow-[0_4px_16px_rgba(21,22,26,.08)] ${!perk.is_active ? 'opacity-60' : ''}`}>
      {perk.images?.[0] ? (
        <div className="h-36 overflow-hidden">
          <img src={perk.images[0]} alt={perk.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="h-36 bg-[#F7F8FA] flex items-center justify-center">
          <span className="text-3xl text-[#E7E9EE]">◈</span>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="text-sm font-semibold text-[#15161A] leading-snug">{perk.name}</p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${catClass}`}>
              {perk.category}
            </span>
          </div>
          <p className="text-base font-bold text-[#15161A] tabular shrink-0">{perk.credit_price} <span className="text-xs font-normal text-[#5B5F6B]">cr</span></p>
        </div>
        {perk.description && (
          <p className="text-xs text-[#5B5F6B] line-clamp-2 mb-3">{perk.description}</p>
        )}
        {(onToggle || onEdit || onDelete) && (
          <div className="flex items-center gap-1 pt-3 border-t border-[#E7E9EE]">
            {onToggle && (
              <button
                onClick={() => onToggle(perk.id, !perk.is_active)}
                className="flex items-center gap-1.5 text-xs text-[#5B5F6B] hover:text-[#15161A] transition-colors px-2 py-1.5 rounded-[6px] hover:bg-[#F7F8FA]"
                aria-label={perk.is_active ? 'Deactivate' : 'Activate'}
              >
                {perk.is_active
                  ? <ToggleRight size={15} className="text-[#1F9D6B]" />
                  : <ToggleLeft size={15} />}
                {perk.is_active ? 'Active' : 'Inactive'}
              </button>
            )}
            <div className="flex-1" />
            {onEdit && (
              <button
                onClick={() => onEdit(perk)}
                className="p-1.5 rounded-[6px] text-[#5B5F6B] hover:text-[#15161A] hover:bg-[#F7F8FA] transition-colors"
                aria-label="Edit"
              >
                <Pencil size={13} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(perk.id)}
                className="p-1.5 rounded-[6px] text-[#5B5F6B] hover:text-[#D23B3B] hover:bg-red-50 transition-colors"
                aria-label="Delete"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
