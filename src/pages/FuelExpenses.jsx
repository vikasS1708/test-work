import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { expenseService, maintenanceService, vehicleService } from '../api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import { Plus, Coins, Fuel, DollarSign, Calendar, Info, BarChart } from 'lucide-react';

/**
 * Fuel & Expense Management system.
 * Keeps track of diesel/gas refills and ancillary trip charges, summing total fleet cost.
 */
export default function FuelExpenses() {
  const { user } = useAuth();
  // Financial Analyst and Fleet Manager can add logs
  const canLog = user?.role === 'Financial Analyst' || user?.role === 'Fleet Manager';

  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [maintenanceCost, setMaintenanceCost] = useState(0);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Form states
  const [fuelForm, setFuelForm] = useState({
    date: new Date().toISOString().split('T')[0],
    vehicleReg: '',
    liters: '',
    cost: '',
    odometer: '',
  });
  const [fuelErrors, setFuelErrors] = useState({});

  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    vehicleReg: '',
    type: 'Tolls',
    cost: '',
  });
  const [expenseErrors, setExpenseErrors] = useState({});

  const loadData = async () => {
    try {
      const fuelData = await expenseService.getFuelLogs();
      const expData = await expenseService.getExpenses();
      const maintData = await maintenanceService.getAll();
      const vehData = await vehicleService.getAll();

      setFuelLogs(fuelData);
      setExpenses(expData);
      setVehicles(vehData.filter(v => v.status !== 'Retired'));

      // Calculate total maintenance cost to pull into the Operational Cost summing logic
      const totalMaint = maintData.reduce((acc, curr) => acc + curr.cost, 0);
      setMaintenanceCost(totalMaint);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Form submissions
  const handleFuelSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!fuelForm.vehicleReg) errors.vehicleReg = 'Vehicle registration is required';
    if (!fuelForm.liters || Number(fuelForm.liters) <= 0) errors.liters = 'Liters must be positive';
    if (!fuelForm.cost || Number(fuelForm.cost) <= 0) errors.cost = 'Cost must be positive';
    if (!fuelForm.odometer || Number(fuelForm.odometer) < 0) errors.odometer = 'Odometer cannot be negative';

    if (Object.keys(errors).length > 0) {
      setFuelErrors(errors);
      return;
    }

    try {
      await expenseService.createFuelLog(fuelForm);
      setFuelForm({
        date: new Date().toISOString().split('T')[0],
        vehicleReg: '',
        liters: '',
        cost: '',
        odometer: '',
      });
      setIsFuelModalOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!expenseForm.vehicleReg) errors.vehicleReg = 'Vehicle registration is required';
    if (!expenseForm.type) errors.type = 'Expense type description is required';
    if (!expenseForm.cost || Number(expenseForm.cost) <= 0) errors.cost = 'Cost must be positive';

    if (Object.keys(errors).length > 0) {
      setExpenseErrors(errors);
      return;
    }

    try {
      await expenseService.createExpense(expenseForm);
      setExpenseForm({
        date: new Date().toISOString().split('T')[0],
        vehicleReg: '',
        type: 'Tolls',
        cost: '',
      });
      setIsExpenseModalOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Cost summing
  const totalFuelCost = fuelLogs.reduce((acc, curr) => acc + curr.cost, 0);
  const totalOtherExpenses = expenses.reduce((acc, curr) => acc + curr.cost, 0);
  // Sum = Fuel + Maintenance + Other
  const totalOperationalCost = totalFuelCost + maintenanceCost + totalOtherExpenses;

  const fuelColumns = [
    {
      header: 'Date',
      accessor: 'date',
      sortable: true,
      render: (row) => <span className="text-xs font-mono text-neutral-400">{row.date}</span>
    },
    {
      header: 'Vehicle',
      accessor: 'vehicleReg',
      sortable: true,
      render: (row) => <span className="font-mono font-bold text-neutral-200">{row.vehicleReg}</span>
    },
    {
      header: 'Liters Refilled',
      accessor: 'liters',
      sortable: true,
      render: (row) => <span className="font-mono text-neutral-300 font-semibold">{row.liters} L</span>
    },
    {
      header: 'Odometer (km)',
      accessor: 'odometer',
      sortable: true,
      render: (row) => <span className="font-mono text-neutral-400">{row.odometer.toLocaleString()} km</span>
    },
    {
      header: 'Cost ($)',
      accessor: 'cost',
      sortable: true,
      render: (row) => <span className="font-mono font-bold text-brand-orange">${row.cost.toLocaleString()}</span>
    }
  ];

  const expenseColumns = [
    {
      header: 'Date',
      accessor: 'date',
      sortable: true,
      render: (row) => <span className="text-xs font-mono text-neutral-400">{row.date}</span>
    },
    {
      header: 'Vehicle',
      accessor: 'vehicleReg',
      sortable: true,
      render: (row) => <span className="font-mono font-bold text-neutral-200">{row.vehicleReg}</span>
    },
    {
      header: 'Charge Description',
      accessor: 'type',
      sortable: true,
      render: (row) => <span className="font-medium text-neutral-300">{row.type}</span>
    },
    {
      header: 'Cost ($)',
      accessor: 'cost',
      sortable: true,
      render: (row) => <span className="font-mono font-bold text-brand-orange">${row.cost.toLocaleString()}</span>
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-neutral-100 uppercase tracking-wide">Expense & Fuel Ledger</h1>
          <p className="text-xs text-neutral-400 mt-1">Audit operational fuel refills, tolls, driver charges, and maintenance costs.</p>
        </div>

        {canLog && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setFuelErrors({});
                setIsFuelModalOpen(true);
              }}
              className="flex items-center space-x-2 rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2 text-xs font-bold text-neutral-200 hover:text-white hover:bg-neutral-800 transition-all active:scale-95 shadow"
            >
              <Fuel size={14} className="text-brand-orange" />
              <span>Log Fuel Refill</span>
            </button>
            <button
              onClick={() => {
                setExpenseErrors({});
                setIsExpenseModalOpen(true);
              }}
              className="flex items-center space-x-2 rounded-lg bg-brand-orange px-4 py-2 text-xs font-bold text-white hover:bg-brand-orange-hover transition-all active:scale-95 shadow-lg shadow-orange-500/10"
            >
              <Plus size={14} />
              <span>Add Expense</span>
            </button>
          </div>
        )}
      </div>

      {/* Main split display: Fuel Logs vs Other Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Fuel Logs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-200 flex items-center gap-2">
              <Fuel size={16} className="text-brand-orange" />
              <span>Fuel Log Registry</span>
            </h2>
            <span className="text-3xs text-neutral-500 font-semibold uppercase tracking-wider">Refills</span>
          </div>

          {loading ? (
            <div className="h-48 flex items-center justify-center bg-neutral-900 border border-neutral-800 rounded-lg">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-orange border-t-transparent"></div>
            </div>
          ) : (
            <DataTable columns={fuelColumns} rows={fuelLogs} emptyMessage="No fuel logs logged on this station" />
          )}
        </div>

        {/* Right: Other Expenses */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-200 flex items-center gap-2">
              <Coins size={16} className="text-brand-orange" />
              <span>Ancillary Trip Charges</span>
            </h2>
            <span className="text-3xs text-neutral-500 font-semibold uppercase tracking-wider">Incidents</span>
          </div>

          {loading ? (
            <div className="h-48 flex items-center justify-center bg-neutral-900 border border-neutral-800 rounded-lg">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-orange border-t-transparent"></div>
            </div>
          ) : (
            <DataTable columns={expenseColumns} rows={expenses} emptyMessage="No ancillary expenses found" />
          )}
        </div>

      </div>

      {/* Bottom auto-calculating total bar */}
      <div className="rounded-xl border-2 border-neutral-800 bg-neutral-900/80 p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden backdrop-blur-md">
        <div className="absolute inset-y-0 left-0 w-2.5 bg-brand-orange"></div>
        
        <div className="flex items-start space-x-3.5 pl-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-950/40 text-brand-orange border border-orange-900/20">
            <BarChart size={20} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Total Fleet Operational Cost</h3>
            <p className="text-2xs text-neutral-500 mt-1 font-medium">Auto-derived from fuel refills, maintenance work logs, and trip incidents.</p>
          </div>
        </div>

        {/* Sum Breakdowns */}
        <div className="flex flex-wrap items-center gap-6 text-xs text-neutral-400">
          <div className="flex flex-col">
            <span className="text-3xs text-neutral-500 uppercase tracking-widest leading-none">Fuel Costs</span>
            <span className="font-mono font-semibold text-neutral-200 mt-1.5">${totalFuelCost.toLocaleString()}</span>
          </div>
          <div className="h-6 w-px bg-neutral-850"></div>
          <div className="flex flex-col">
            <span className="text-3xs text-neutral-500 uppercase tracking-widest leading-none">Maintenance</span>
            <span className="font-mono font-semibold text-neutral-200 mt-1.5">${maintenanceCost.toLocaleString()}</span>
          </div>
          <div className="h-6 w-px bg-neutral-850"></div>
          <div className="flex flex-col">
            <span className="text-3xs text-neutral-500 uppercase tracking-widest leading-none">Other Charges</span>
            <span className="font-mono font-semibold text-neutral-200 mt-1.5">${totalOtherExpenses.toLocaleString()}</span>
          </div>
          <div className="h-6 w-px bg-neutral-800 hidden md:block"></div>
          
          {/* Formula Total */}
          <div className="flex flex-col bg-neutral-950/60 border border-neutral-800 rounded-lg px-4 py-2 min-w-[150px] text-center">
            <span className="text-3xs text-brand-orange uppercase font-bold tracking-widest leading-none">Operational Cost</span>
            <span className="font-mono text-lg font-black text-neutral-100 mt-1">${totalOperationalCost.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Log Fuel Modal */}
      <Modal isOpen={isFuelModalOpen} onClose={() => setIsFuelModalOpen(false)} title="Log Diesel / Fuel Refill">
        <form onSubmit={handleFuelSubmit} className="space-y-4">
          <FormField label="Target Vehicle" error={fuelErrors.vehicleReg} required>
            <select
              value={fuelForm.vehicleReg}
              onChange={(e) => {
                setFuelForm(prev => ({ ...prev, vehicleReg: e.target.value }));
                if (fuelErrors.vehicleReg) setFuelErrors(prev => ({ ...prev, vehicleReg: '' }));
              }}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2.5 px-3 text-sm text-neutral-200 focus:border-brand-orange focus:outline-none cursor-pointer"
            >
              <option value="">-- Choose Truck --</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.regNumber}>{v.regNumber} ({v.name})</option>
              ))}
            </select>
          </FormField>

          <FormField label="Refill Liters" error={fuelErrors.liters} required>
            <input
              type="number"
              value={fuelForm.liters}
              onChange={(e) => {
                setFuelForm(prev => ({ ...prev, liters: e.target.value }));
                if (fuelErrors.liters) setFuelErrors(prev => ({ ...prev, liters: '' }));
              }}
              placeholder="120"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-200 focus:border-brand-orange focus:outline-none"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Fuel Cost ($)" error={fuelErrors.cost} required>
              <input
                type="number"
                value={fuelForm.cost}
                onChange={(e) => {
                  setFuelForm(prev => ({ ...prev, cost: e.target.value }));
                  if (fuelErrors.cost) setFuelErrors(prev => ({ ...prev, cost: '' }));
                }}
                placeholder="240"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-200 focus:border-brand-orange focus:outline-none"
              />
            </FormField>

            <FormField label="Odometer Reading (km)" error={fuelErrors.odometer} required>
              <input
                type="number"
                value={fuelForm.odometer}
                onChange={(e) => {
                  setFuelForm(prev => ({ ...prev, odometer: e.target.value }));
                  if (fuelErrors.odometer) setFuelErrors(prev => ({ ...prev, odometer: '' }));
                }}
                placeholder="124600"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-200 focus:border-brand-orange focus:outline-none"
              />
            </FormField>
          </div>

          <FormField label="Refill Date" required>
            <input
              type="date"
              value={fuelForm.date}
              onChange={(e) => setFuelForm(prev => ({ ...prev, date: e.target.value }))}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-200 focus:border-brand-orange focus:outline-none"
            />
          </FormField>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-800 mt-5">
            <button
              type="button"
              onClick={() => setIsFuelModalOpen(false)}
              className="rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 py-2 px-4 text-xs font-semibold text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand-orange hover:bg-brand-orange-hover py-2 px-4 text-xs font-semibold text-white transition-colors"
            >
              Log Refill
            </button>
          </div>
        </form>
      </Modal>

      {/* Log Expense Modal */}
      <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Add Operational Charge">
        <form onSubmit={handleExpenseSubmit} className="space-y-4">
          <FormField label="Associated Vehicle" error={expenseErrors.vehicleReg} required>
            <select
              value={expenseForm.vehicleReg}
              onChange={(e) => {
                setExpenseForm(prev => ({ ...prev, vehicleReg: e.target.value }));
                if (expenseErrors.vehicleReg) setExpenseErrors(prev => ({ ...prev, vehicleReg: '' }));
              }}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2.5 px-3 text-sm text-neutral-200 focus:border-brand-orange focus:outline-none cursor-pointer"
            >
              <option value="">-- Choose Truck --</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.regNumber}>{v.regNumber} ({v.name})</option>
              ))}
            </select>
          </FormField>

          <FormField label="Expense Type / Incident" required>
            <select
              value={expenseForm.type}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, type: e.target.value }))}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2.5 px-3 text-sm text-neutral-200 focus:border-brand-orange focus:outline-none cursor-pointer"
            >
              <option value="Tolls">Tolls / State Tax</option>
              <option value="Driver Incident Meal">Driver Incident Meal</option>
              <option value="Permit Fees">Logistics Permit Fees</option>
              <option value="Truck Wash">Truck Detailing/Wash</option>
            </select>
          </FormField>

          <FormField label="Charge Cost ($)" error={expenseErrors.cost} required>
            <input
              type="number"
              value={expenseForm.cost}
              onChange={(e) => {
                setExpenseForm(prev => ({ ...prev, cost: e.target.value }));
                if (expenseErrors.cost) setExpenseErrors(prev => ({ ...prev, cost: '' }));
              }}
              placeholder="50"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-200 focus:border-brand-orange focus:outline-none"
            />
          </FormField>

          <FormField label="Incident Date" required>
            <input
              type="date"
              value={expenseForm.date}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-200 focus:border-brand-orange focus:outline-none"
            />
          </FormField>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-800 mt-5">
            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(false)}
              className="rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 py-2 px-4 text-xs font-semibold text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand-orange hover:bg-brand-orange-hover py-2 px-4 text-xs font-semibold text-white transition-colors"
            >
              Log Charge
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
