import React from 'react';

/**
 * Reusable StatusBadge component that maps various status values to specific dark-themed styling.
 * Colors:
 * - Green (Available, Completed)
 * - Blue (OnTrip, Dispatched)
 * - Orange (InShop, Suspended, Draft)
 * - Red/Gray (Retired, Cancelled, OffDuty)
 */
export default function StatusBadge({ status }) {
  const normalized = status ? status.trim().toLowerCase() : '';
  
  let colorClasses = 'bg-neutral-800 text-neutral-400 border border-neutral-700'; // Default gray

  if (normalized === 'available' || normalized === 'completed') {
    colorClasses = 'bg-green-950/50 text-green-400 border border-green-800/60';
  } else if (normalized === 'ontrip' || normalized === 'dispatched' || normalized === 'on trip') {
    colorClasses = 'bg-blue-950/50 text-blue-400 border border-blue-800/60';
  } else if (normalized === 'inshop' || normalized === 'suspended' || normalized === 'draft' || normalized === 'in shop' || normalized === 'in progress') {
    colorClasses = 'bg-orange-950/50 text-brand-orange border border-orange-800/60';
  } else if (normalized === 'retired' || normalized === 'cancelled' || normalized === 'offduty' || normalized === 'off duty') {
    colorClasses = 'bg-red-950/50 text-red-400 border border-red-800/60';
  }

  // Visual label spacing formatting
  const displayLabel = status === 'OnTrip' ? 'On Trip' 
                     : status === 'InShop' ? 'In Shop' 
                     : status === 'OffDuty' ? 'Off Duty' 
                     : status;

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClasses}`}>
      {displayLabel}
    </span>
  );
}
