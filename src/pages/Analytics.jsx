import React, { useState, useEffect } from 'react';
import { analyticsService } from '../api';
import KPICard from '../components/KPICard';
import { 
  Fuel, 
  Percent, 
  Coins, 
  TrendingUp, 
  BarChart2, 
  Truck, 
  ShieldAlert 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

/**
 * Analytics page providing rich data visualizations, fuel reports,
 * and top expense registers.
 */
export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const report = await analyticsService.getReport();
        setData(report);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-brand-orange bg-neutral-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange border-t-transparent"></div>
      </div>
    );
  }

  const { kpis, monthlyRevenue, costliestVehicles } = data;

  // Custom tooltips for premium design aesthetics
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 shadow-xl">
          <p className="text-xs font-bold text-neutral-300 mb-1">{label} Overview</p>
          {payload.map((p, idx) => (
            <div key={idx} className="flex items-center space-x-2 text-2xs mt-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }}></span>
              <span className="text-neutral-500 font-medium">{p.name}:</span>
              <span className="font-mono text-neutral-200 font-bold">${Number(p.value).toLocaleString()}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Find max total cost to create horizontal progress bars representing proportion
  const maxVehicleCost = costliestVehicles.length > 0 ? Math.max(...costliestVehicles.map(v => v.total)) : 1;

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-neutral-100 uppercase tracking-wide">Fleet Analytics</h1>
          <p className="text-xs text-neutral-400 mt-1">Audit efficiency curves, profitability metrics, and expense breakdowns.</p>
        </div>
      </div>

      {/* KPI Cards Row (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          label="Fuel Efficiency" 
          value={`${kpis.fuelEfficiency} km/l`} 
          color="green" 
          icon={Fuel} 
          caption="Avg. distance covered per liter of fuel refilled" 
        />
        <KPICard 
          label="Fleet Utilization" 
          value={`${kpis.fleetUtilization}%`} 
          color="blue" 
          icon={Percent} 
          caption="Percentage of non-retired vehicles active or in shop" 
        />
        <KPICard 
          label="Operational Cost" 
          value={`$${kpis.operationalCost.toLocaleString()}`} 
          color="orange" 
          icon={Coins} 
          caption="Sum of maintenance costs + diesel + trip toll expenses" 
        />
        <KPICard 
          label="Vehicle ROI" 
          value={`${kpis.roi}%`} 
          color="orange" 
          icon={TrendingUp} 
          caption="Formula: ROI = (Total Revenue - Acq Cost) / Acq Cost * 100 (where revenue is estimated at $1.8 per km driven)" 
        />
      </div>

      {/* Analytics Visual split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Monthly Revenue/Cost Chart */}
        <div className="lg:col-span-8 rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-md flex flex-col justify-between">
          <div className="space-y-1 mb-5">
            <h2 className="text-base font-bold text-neutral-200">Financial Performance</h2>
            <p className="text-3xs text-neutral-500 font-semibold uppercase tracking-wider">Revenue vs Operational Expenses</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyRevenue}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                barSize={14}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis 
                  dataKey="name" 
                  stroke="#737373" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#737373" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `$${val / 1000}k`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#171717' }} />
                <Legend 
                  wrapperStyle={{ fontSize: '10px', paddingTop: '15px' }} 
                  iconType="circle" 
                  iconSize={6}
                />
                <Bar name="Est. Revenue" dataKey="Revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar name="Actual Expenses" dataKey="Costs" fill="#404040" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Top Costliest Vehicles list (Horizontal bar graph style) */}
        <div className="lg:col-span-4 rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-md flex flex-col">
          <div className="space-y-1 mb-5">
            <h2 className="text-base font-bold text-neutral-200 flex items-center gap-2">
              <Truck size={16} className="text-brand-orange" />
              <span>Costliest Assets</span>
            </h2>
            <p className="text-3xs text-neutral-500 font-semibold uppercase tracking-wider">Top 5 Total Expenses</p>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto">
            {costliestVehicles.length === 0 ? (
              <div className="text-center text-neutral-500 font-medium text-xs pt-10">
                No active costs on record
              </div>
            ) : (
              costliestVehicles.map((v, idx) => {
                // Calculate percentage of max vehicle cost
                const barPercentage = Math.max(8, Math.round((v.total / maxVehicleCost) * 100));
                return (
                  <div key={v.regNumber} className="space-y-1.5 p-2 rounded-lg bg-neutral-950/40 border border-neutral-800/40">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex flex-col">
                        <span className="font-bold text-neutral-200 font-mono">{v.regNumber}</span>
                        <span className="text-3xs text-neutral-500">{v.name}</span>
                      </div>
                      <span className="font-mono font-bold text-brand-orange">${v.total.toLocaleString()}</span>
                    </div>

                    {/* Proportional horizontal bar */}
                    <div className="h-2.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        style={{ width: `${barPercentage}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-orange-650 to-brand-orange"
                      ></div>
                    </div>

                    {/* Breakdown legend details */}
                    <div className="flex justify-between text-4xs font-bold uppercase tracking-widest text-neutral-500">
                      <span>Maint: ${v.maintenance.toLocaleString()}</span>
                      <span>Fuel: ${v.fuel.toLocaleString()}</span>
                      <span>Other: ${v.other.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
