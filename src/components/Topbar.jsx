import React from 'react';
import { useAuth } from '../App';
import { Search, Bell, User } from 'lucide-react';

/**
 * Topbar component showing Search, User Profile, and Role Pill badges.
 */
export default function Topbar() {
  const { user } = useAuth();

  return (
    <header className="fixed right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md px-6 left-16 md:left-56 transition-all duration-300">
      
      {/* Search Input Bar */}
      <div className="relative w-64 md:w-80">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-500">
          <Search size={16} />
        </span>
        <input
          type="search"
          placeholder="Quick search vehicles, trips..."
          className="w-full rounded-lg border border-neutral-800 bg-neutral-900/50 py-2 pl-10 pr-4 text-sm text-neutral-200 placeholder-neutral-500 focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange transition-colors"
        />
      </div>

      {/* User Area */}
      <div className="flex items-center space-x-4">
        {/* Notifications Mock Icon */}
        <button className="relative rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-orange animate-ping"></span>
        </button>

        {/* Vertical divider */}
        <div className="h-6 w-px bg-neutral-800"></div>

        {/* User Card */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-neutral-200">{user?.name || 'OPERATOR'}</span>
            <span className="text-3xs font-semibold text-neutral-400 uppercase tracking-wider">{user?.role || 'Staff'}</span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Avatar Circle */}
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800 border border-neutral-700 text-brand-orange">
              <User size={16} />
            </div>

            {/* Role Pill */}
            <span className="inline-flex items-center rounded-full bg-brand-orange/10 px-2.5 py-0.5 text-xs font-semibold text-brand-orange border border-brand-orange/20 uppercase tracking-wide scale-95">
              {user?.role || 'Guest'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
