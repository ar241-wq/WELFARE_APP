'use client';

import React from 'react';

interface FormFieldProps {
  label: string;
  id: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactElement<React.InputHTMLAttributes<HTMLInputElement> | React.SelectHTMLAttributes<HTMLSelectElement> | React.TextareaHTMLAttributes<HTMLTextAreaElement>>;
}

export function inputClass(hasError?: boolean) {
  return `w-full px-3.5 py-2.5 rounded-[8px] border text-sm text-[#15161A] bg-white transition-colors duration-[120ms] ${
    hasError
      ? 'border-[#D23B3B] focus:border-[#D23B3B] focus:ring-1 focus:ring-[#D23B3B]'
      : 'border-[#E7E9EE] focus:border-[#3D5AFE] focus:ring-1 focus:ring-[#3D5AFE]'
  } outline-none placeholder:text-[#5B5F6B]/50 disabled:bg-[#F7F8FA] disabled:text-[#5B5F6B]`;
}

export default function FormField({ label, id, error, required, hint, children }: FormFieldProps) {
  const child = React.cloneElement(children, {
    id,
    'aria-describedby': error ? `${id}-error` : hint ? `${id}-hint` : undefined,
    'aria-invalid': error ? true : undefined,
    className: inputClass(!!error),
  } as Record<string, unknown>);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-[#15161A]">
        {label}
        {required && <span className="text-[#D23B3B] ml-0.5">*</span>}
      </label>
      {child}
      {hint && !error && <p id={`${id}-hint`} className="text-xs text-[#5B5F6B]">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="text-xs text-[#D23B3B]">{error}</p>}
    </div>
  );
}
