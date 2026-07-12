import React from 'react';

/**
 * Reusable KPICard component with dark-themed styling, micro-animations, and dynamic accents.
 */
export default function KPICard({ label, value, color = 'orange', icon: Icon, caption }) {
  // Map color strings to tailwind values
  const colorMap = {
    green: {
      text: 'text-green-400',
      bg: 'bg-green-950/40 border-green-900/40',
      iconBg: 'bg-green-500/10 text-green-400'
    },
    blue: {
      text: 'text-blue-400',
      bg: 'bg-blue-950/40 border-blue-900/40',
      iconBg: 'bg-blue-500/10 text-blue-400'
    },
    orange: {
      text: 'text-brand-orange',
      bg: 'bg-orange-950/40 border-orange-900/40',
      iconBg: 'bg-brand-orange/10 text-brand-orange'
    },
    red: {
      text: 'text-red-400',
      bg: 'bg-red-950/40 border-red-900/40',
      iconBg: 'bg-red-500/10 text-red-400'
    },
    neutral: {
      text: 'text-neutral-400',
      bg: 'bg-neutral-900 border-neutral-800',
      iconBg: 'bg-neutral-800 text-neutral-400'
    }
  };

  const scheme = colorMap[color] || colorMap.orange;

  return (
    <div className={`relative overflow-hidden rounded-xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-700 bg-neutral-900 border-neutral-800 shadow-lg group`}>
      {/* Subtle background gradient glow on hover */}
      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-neutral-800/10 blur-xl transition-all duration-300 group-hover:bg-brand-orange/5"></div>
      
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{label}</p>
          <h3 className="text-2xl font-bold tracking-tight text-neutral-100">{value}</h3>
        </div>
        {Icon && (
          <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${scheme.iconBg} transition-transform duration-300 group-hover:scale-110`}>
            <Icon size={20} strokeWidth={2} />
          </div>
        )}
      </div>

      {caption && (
        <p className="mt-3 text-2xs text-neutral-500 font-medium">{caption}</p>
      )}
    </div>
  );
}
