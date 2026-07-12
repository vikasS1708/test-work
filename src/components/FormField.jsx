import React from 'react';

/**
 * Reusable FormField component that wraps inputs, selects, or textareas with uniform labels and error messages.
 */
export default function FormField({ label, error, children, required }) {
  return (
    <div className="flex flex-col space-y-1.5 w-full">
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          {label}
          {required && <span className="text-brand-orange ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {children}
      </div>
      {error && (
        <span className="text-2xs font-semibold text-red-500 animate-fade-in block mt-1">
          {error}
        </span>
      )}
    </div>
  );
}
