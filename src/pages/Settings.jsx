import React, { useState } from 'react';
import FormField from '../components/FormField';
import { Settings as SettingsIcon, Save, Database, Shield, Globe } from 'lucide-react';

/**
 * Settings configuration dashboard.
 * Houses platform settings and renders a clear read-only RBAC matrix map.
 */
export default function Settings() {
  const [depotName, setDepotName] = useState(localStorage.getItem('setting_depot') || 'Chicago Main Depot');
  const [currency, setCurrency] = useState(localStorage.getItem('setting_currency') || 'USD ($)');
  const [distanceUnit, setDistanceUnit] = useState(localStorage.getItem('setting_unit') || 'Kilometers (km)');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('setting_depot', depotName);
    localStorage.setItem('setting_currency', currency);
    localStorage.setItem('setting_unit', distanceUnit);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const rbacRules = [
    { role: 'Fleet Manager', fleet: 'Read & Write', drivers: 'Read & Write', trips: 'No Access', maint: 'Read & Write', fuel: 'No Access', analytics: 'Read Access' },
    { role: 'Dispatcher', fleet: 'View Only', drivers: 'No Access', trips: 'Read & Write', maint: 'No Access', fuel: 'No Access', analytics: 'No Access' },
    { role: 'Safety Officer', fleet: 'No Access', drivers: 'Read & Write', trips: 'View Only', maint: 'No Access', fuel: 'No Access', analytics: 'No Access' },
    { role: 'Financial Analyst', fleet: 'View Only', drivers: 'No Access', trips: 'No Access', maint: 'View Only', fuel: 'Read & Write', analytics: 'Read Access' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-neutral-100 uppercase tracking-wide">Terminal Settings</h1>
          <p className="text-xs text-neutral-400 mt-1">Configure workspace localization, units, and review security scope mappings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: General Settings Form */}
        <div className="lg:col-span-5 space-y-4">
          <form onSubmit={handleSave} className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-lg space-y-5">
            <div className="flex items-center space-x-2 border-b border-neutral-800/60 pb-3 mb-2">
              <Globe size={16} className="text-brand-orange" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-200">Localization & Rules</h2>
            </div>

            {saveSuccess && (
              <div className="rounded-lg bg-green-950/40 border border-green-900/40 p-3 text-xs text-green-400 font-semibold animate-fade-in">
                Settings parameters saved successfully!
              </div>
            )}

            <FormField label="Depot Name / Callsign" required>
              <input
                type="text"
                value={depotName}
                onChange={(e) => setDepotName(e.target.value)}
                placeholder="Chicago Main Depot"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2.5 px-3 text-sm text-neutral-200 focus:border-brand-orange focus:outline-none"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Operational Currency" required>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2.5 px-3 text-sm text-neutral-200 focus:border-brand-orange focus:outline-none cursor-pointer"
                >
                  <option value="USD ($)">USD ($)</option>
                  <option value="EUR (€)">EUR (€)</option>
                  <option value="GBP (£)">GBP (£)</option>
                </select>
              </FormField>

              <FormField label="Distance Metrics" required>
                <select
                  value={distanceUnit}
                  onChange={(e) => setDistanceUnit(e.target.value)}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2.5 px-3 text-sm text-neutral-200 focus:border-brand-orange focus:outline-none cursor-pointer"
                >
                  <option value="Kilometers (km)">Kilometers (km)</option>
                  <option value="Miles (mi)">Miles (mi)</option>
                </select>
              </FormField>
            </div>

            {/* Clear Database Storage */}
            <div className="pt-4 border-t border-neutral-800/60 mt-6">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Reset localStorage database mock? All custom vehicles, trips, drivers, fuel logs, and maintenance logs will reset to seed defaults.')) {
                    // Remove database entries to force seed re-initialization
                    localStorage.removeItem('db_vehicles');
                    localStorage.removeItem('db_drivers');
                    localStorage.removeItem('db_trips');
                    localStorage.removeItem('db_maintenance');
                    localStorage.removeItem('db_fuel_logs');
                    localStorage.removeItem('db_expenses');
                    window.location.reload();
                  }
                }}
                className="flex items-center space-x-1.5 rounded-lg border border-red-950 bg-red-950/20 text-red-400 hover:bg-red-950/40 hover:text-red-300 py-2 px-3 text-2xs font-bold transition-colors w-full justify-center"
              >
                <Database size={12} />
                <span>Reset Database Seed Data</span>
              </button>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-brand-orange hover:bg-brand-orange-hover py-2.5 text-xs font-bold text-white transition-colors flex items-center justify-center space-x-1.5 shadow-md shadow-orange-500/5 active:scale-95"
            >
              <Save size={14} />
              <span>Save Configurations</span>
            </button>
          </form>
        </div>

        {/* Right: RBAC Scope Table */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-lg space-y-4">
            <div className="flex items-center space-x-2 border-b border-neutral-800/60 pb-3 mb-2">
              <Shield size={16} className="text-brand-orange animate-pulse" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-200">RBAC Security Scope Matrix</h2>
            </div>
            
            <p className="text-2xs text-neutral-500 leading-normal">
              System access configuration is parsed and enforced dynamically by route protectors and UI conditional element rendering.
            </p>

            <div className="overflow-x-auto rounded-lg border border-neutral-850 bg-neutral-950/40">
              <table className="w-full text-left text-xs text-neutral-300">
                <thead className="bg-neutral-950 text-4xs font-bold uppercase tracking-widest text-neutral-500 border-b border-neutral-850">
                  <tr>
                    <th className="px-4 py-3">Security Role</th>
                    <th className="px-3 py-3">Fleet</th>
                    <th className="px-3 py-3">Drivers</th>
                    <th className="px-3 py-3">Trips</th>
                    <th className="px-3 py-3">Maintenance</th>
                    <th className="px-3 py-3">Fuel / Expenses</th>
                    <th className="px-3 py-3">Analytics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {rbacRules.map((row) => (
                    <tr key={row.role} className="hover:bg-neutral-950/30 transition-colors">
                      <td className="px-4 py-3 font-bold text-neutral-200 whitespace-nowrap">{row.role}</td>
                      <td className="px-3 py-3 font-medium whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-4xs font-bold uppercase tracking-wider ${
                          row.fleet.includes('Write') ? 'bg-green-950/50 text-green-400 border border-green-900/30' : 'bg-orange-950/50 text-brand-orange border border-orange-900/30'
                        }`}>
                          {row.fleet}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-medium whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-4xs font-bold uppercase tracking-wider ${
                          row.drivers.includes('Write') ? 'bg-green-950/50 text-green-400 border border-green-900/30' : 'bg-red-950/50 text-red-400 border border-red-900/30'
                        }`}>
                          {row.drivers}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-medium whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-4xs font-bold uppercase tracking-wider ${
                          row.trips.includes('Write') ? 'bg-green-950/50 text-green-400 border border-green-900/30' : row.trips.includes('View') ? 'bg-orange-950/50 text-brand-orange border border-orange-900/30' : 'bg-red-950/50 text-red-400 border border-red-900/30'
                        }`}>
                          {row.trips}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-medium whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-4xs font-bold uppercase tracking-wider ${
                          row.maint.includes('Write') ? 'bg-green-950/50 text-green-400 border border-green-900/30' : row.maint.includes('View') ? 'bg-orange-950/50 text-brand-orange border border-orange-900/30' : 'bg-red-950/50 text-red-400 border border-red-900/30'
                        }`}>
                          {row.maint}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-medium whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-4xs font-bold uppercase tracking-wider ${
                          row.fuel.includes('Write') ? 'bg-green-950/50 text-green-400 border border-green-900/30' : 'bg-red-950/50 text-red-400 border border-red-900/30'
                        }`}>
                          {row.fuel}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-medium whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-4xs font-bold uppercase tracking-wider ${
                          row.analytics.includes('Access') ? 'bg-orange-950/50 text-brand-orange border border-orange-900/30' : 'bg-red-950/50 text-red-400 border border-red-900/30'
                        }`}>
                          {row.analytics}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
