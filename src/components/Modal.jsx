import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Reusable Modal component for forms, workflows, and dialogs.
 */
export default function Modal({ isOpen, onClose, title, children }) {
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg transform rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl transition-all duration-300 animate-fade-in text-neutral-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-5">
          <h3 className="text-lg font-bold text-neutral-100">{title}</h3>
          <button 
            onClick={onClose} 
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}
