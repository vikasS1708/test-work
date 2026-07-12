import React, { useState, useEffect } from 'react';
import { dashboardService } from '../api';
import KPICard from '../components/KPICard';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import { 
  Truck, 
  CheckCircle, 
  Wrench, 
  MapPin, 
  Clock, 
  Users, 
  Activity,
  Filter,
  RefreshCw
} from 'lucide-react';

/**
 * Dashboard Overview containing KPI grids, recent logs, active filters, 
 * and custom stacked status breakdown widgets. Polls updates every 10s.
 */
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);

  // Filter States (Mock visual filters)
  const [vehicleType, setVehicleType] = useState('All');
  const [status, setStatus] = useState('All');
  const [region, setRegion] = useState('All');

  const fetchDashboardData = async (showPulse = false) => {
    if (showPulse) setIsPolling(true);
    try {
      const summary = await dashboardService.getSummary();
      setData(summary);
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
    } finally {
      setLoading(false);
      if (showPulse) {
        setTimeout(() => setIsPolling(false), 500);
      }
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // 10-second Polling Loop
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-brand-orange bg-neutral-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange border-t-transparent"></div>
      </div>
    );
  }

  const { kpis, recentTrips, statusBreakdown } = data;

  // Recent Trips columns definition for DataTable
  const tripColumns = [
    {
      header: 'Trip ID',
      accessor: 'id',
      sortable: true,
      render: (row) => <span className="font-mono font-bold text-neutral-100">{row.id}</span>
    },
    {
      header: 'Route / Path',
      accessor: 'route',
      sortable: true,
      render: (row) => <span className="font-medium text-neutral-200">{row.route}</span>
    },
    {
      header: 'Assigned Vehicle',
      accessor: 'vehicleReg',
      sortable: true,
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs font-semibold text-neutral-300">{row.vehicleReg}</span>
          <span className="text-3xs text-neutral-500">{row.vehicleName}</span>
        </div>
      )
    },
    {
      header: 'Assigned Driver',
      accessor: 'driverName',
      sortable: true,
      render: (row) => <span className="text-xs text-neutral-300 font-medium">{row.driverName}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'ETA / Note',
      accessor: 'eta',
      sortable: true,
      render: (row) => (
        <span className={`text-xs ${row.status === 'Completed' ? 'text-green-500 font-medium' : row.status === 'Cancelled' ? 'text-red-500 font-medium' : 'text-blue-400 font-mono font-semibold'}`}>
          {row.eta}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top filter bar + heading */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-black text-neutral-100 uppercase tracking-wide">Operations Dashboard</h1>
            <span className={`flex h-2 w-2 rounded-full bg-green-500 ${isPolling ? 'animate-ping' : ''}`}></span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">Real-time status updates from live transponders.</p>
        </div>

        {/* Dynamic Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-400">
            <Filter size={14} className="text-neutral-500" />
            <span>Filters:</span>
          </div>

          {/* Vehicle Type Filter */}
          <select
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            className="rounded-lg border border-neutral-800 bg-neutral-900 py-1.5 px-3 text-xs text-neutral-200 focus:border-brand-orange focus:outline-none cursor-pointer"
          >
            <option value="All">All Vehicle Types</option>
            <option value="Semi-Truck">Semi-Trucks Only</option>
            <option value="Cargo Van">Cargo Vans Only</option>
          </select>

          {/* Vehicle Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-neutral-800 bg-neutral-900 py-1.5 px-3 text-xs text-neutral-200 focus:border-brand-orange focus:outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="OnTrip">On Trip</option>
            <option value="InShop">In Shop</option>
          </select>

          {/* Region Filter */}
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="rounded-lg border border-neutral-800 bg-neutral-900 py-1.5 px-3 text-xs text-neutral-200 focus:border-brand-orange focus:outline-none cursor-pointer"
          >
            <option value="All">All Regions</option>
            <option value="Depot North">Depot North</option>
            <option value="Depot South">Depot South</option>
          </select>

          {/* Manual Refresh Indicator */}
          <button 
            onClick={() => fetchDashboardData(true)} 
            disabled={isPolling}
            className="rounded-lg p-2 text-neutral-400 bg-neutral-900 border border-neutral-800 hover:text-neutral-100 hover:bg-neutral-800/80 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={14} className={`${isPolling ? 'animate-spin text-brand-orange' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Row (7 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
        <KPICard label="Active Vehicles" value={kpis.activeVehicles} color="blue" icon={Truck} />
        <KPICard label="Available" value={kpis.availableVehicles} color="green" icon={CheckCircle} />
        <KPICard label="In Maintenance" value={kpis.inShopVehicles} color="orange" icon={Wrench} />
        <KPICard label="Active Trips" value={kpis.activeTrips} color="blue" icon={MapPin} />
        <KPICard label="Pending Trips" value={kpis.pendingTrips} color="neutral" icon={Clock} />
        <KPICard label="Drivers Duty" value={kpis.driversOnDuty} color="green" icon={Users} />
        <KPICard label="Utilization" value={`${kpis.fleetUtilization}%`} color="orange" icon={Activity} />
      </div>

      {/* Main split display: Recent Trips vs Vehicle status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Recent Trips Table */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-200">Recent Dispatches</h2>
            <span className="text-3xs text-neutral-500 font-semibold uppercase tracking-wider">Live Feed</span>
          </div>
          <DataTable 
            columns={tripColumns} 
            rows={recentTrips} 
            emptyMessage="No active trip dispatches recorded yet" 
          />
        </div>

        {/* Right Column: Visual proportions bar card */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 flex flex-col justify-between shadow-lg">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-neutral-200">Vehicle Proportions</h2>
            <p className="text-3xs text-neutral-500 font-semibold uppercase tracking-wider">Operational Distribution</p>
          </div>

          {/* Dynamic Stacked Bar Breakdown */}
          <div className="my-6 space-y-4">
            {/* Visual Bar */}
            <div className="flex h-5 w-full overflow-hidden rounded-full bg-neutral-800 border border-neutral-700/50 shadow-inner">
              {statusBreakdown.map((bar, idx) => (
                <div
                  key={idx}
                  style={{ width: `${bar.percentage || 1}%`, backgroundColor: bar.color }}
                  className="h-full transition-all duration-500 hover:brightness-110 relative group cursor-pointer"
                  title={`${bar.name}: ${bar.value} (${bar.percentage}%)`}
                >
                  {/* Hover mini-tooltip */}
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 bg-neutral-950 text-neutral-200 text-3xs font-semibold px-2 py-0.5 rounded border border-neutral-800 shadow-md whitespace-nowrap transition-transform z-10">
                    {bar.name} ({bar.percentage}%)
                  </span>
                </div>
              ))}
            </div>

            {/* Visual Bar Legend */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {statusBreakdown.map((bar, idx) => (
                <div key={idx} className="flex items-center space-x-2.5 p-2 rounded-lg bg-neutral-950/40 border border-neutral-800/40">
                  <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: bar.color }}></span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-2xs font-semibold text-neutral-400 leading-none">{bar.name}</span>
                    <span className="text-sm font-bold text-neutral-200 mt-1 leading-none">{bar.value} <span className="text-3xs font-normal text-neutral-500">({bar.percentage}%)</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-neutral-800 pt-4 mt-auto">
            <div className="flex items-center justify-between text-3xs font-medium text-neutral-500 uppercase tracking-wider">
              <span>Syncing Status</span>
              <span>10s interval</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
