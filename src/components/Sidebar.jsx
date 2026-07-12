import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth, RBAC_MATRIX } from '../App';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Route as TripIcon, 
  Wrench, 
  Coins, 
  BarChart3, 
  Settings as SettingsIcon,
  LogOut
} from 'lucide-react';

/**
 * Responsive Sidebar component supporting collapsed icon view on mobile/tablet widths.
 * Enforces role-based menu filtering.
 */
export default function Sidebar() {
  const { user, logout } = useAuth();
  const allowedNavs = user ? RBAC_MATRIX[user.role]?.nav || [] : [];

  const allNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Fleet', path: '/fleet', icon: Truck },
    { name: 'Drivers', path: '/drivers', icon: Users },
    { name: 'Trips', path: '/trips', icon: TripIcon },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench },
    { name: 'Fuel & Expenses', path: '/fuel-expenses', icon: Coins },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  // Filter based on user role permission matrix
  const filteredNavItems = allNavItems.filter(item => allowedNavs.includes(item.name));

  return (
    <aside className="fixed bottom-0 left-0 top-0 z-40 flex h-full flex-col border-r border-neutral-800 bg-neutral-900 transition-all duration-300 w-16 md:w-56">
      
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-center md:justify-start px-4 border-b border-neutral-800">
        <span className="flex items-center space-x-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-orange text-white font-black text-lg">T</span>
          <span className="hidden md:inline text-lg font-bold tracking-wider text-neutral-100 uppercase">
            Transit<span className="text-brand-orange">Ops</span>
          </span>
        </span>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1.5 px-3 py-6 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'border-l-4 border-brand-orange bg-brand-orange/10 text-neutral-100 font-semibold'
                    : 'border-l-4 border-transparent text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-100'
                }`
              }
            >
              <Icon size={18} className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span className="hidden md:inline truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="border-t border-neutral-800 p-3">
        <button
          onClick={logout}
          className="flex w-full items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium text-red-400 border-l-4 border-transparent hover:bg-red-950/20 hover:text-red-300 transition-colors group"
        >
          <LogOut size={18} className="flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
          <span className="hidden md:inline font-semibold">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
