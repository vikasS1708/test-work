import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { maintenanceService, vehicleService } from '../api';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import FormField from '../components/FormField';
import { 
  Wrench, 
  ArrowLeftRight, 
  Plus, 
  Calendar, 
  DollarSign, 
  Check, 
  HelpCircle,
  ShieldAlert
} from 'lucide-react';

/**
 * Maintenance logging page listing service log books, containing logging controls
 * and simple state-transition visual graphs.
 */
export default function Maintenance() {
  const { user } = useAuth();
  const isViewOnly = user?.role === 'Financial Analyst'; // Analyst has view-only on maintenance

  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    vehicleReg: '',
    serviceType: '',
    cost: '',
    date: new Date().toISOString().split('T')[0],
    status: 'In Progress',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const allRecords = await maintenanceService.getAll();
      const allVehicles = await vehicleService.getAll();
      setRecords(allRecords);
      // Filter out retired vehicles for new service entry
      setVehicles(allVehicles.filter(v => v.status !== 'Retired'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.vehicleReg) errors.vehicleReg = 'Vehicle registration is required';
    if (!formData.serviceType) errors.serviceType = 'Service type description is required';
    if (!formData.date) errors.date = 'Service date is required';
    
    if (!formData.cost || Number(formData.cost) <= 0) {
      errors.cost = 'Service cost must be a positive number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await maintenanceService.create(formData);
      setFormData({
        vehicleReg: '',
        serviceType: '',
        cost: '',
        date: new Date().toISOString().split('T')[0],
        status: 'In Progress',
      });
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Vehicle',
      accessor: 'vehicleReg',
      sortable: true,
      render: (row) => <span className="font-mono font-bold text-neutral-100">{row.vehicleReg}</span>
    },
    {
      header: 'Service Type / Work Done',
      accessor: 'serviceType',
      sortable: true,
      render: (row) => <span className="font-semibold text-neutral-200">{row.serviceType}</span>
    },
    {
      header: 'Cost ($)',
      accessor: 'cost',
      sortable: true,
      render: (row) => <span className="font-mono font-semibold text-brand-orange">${row.cost.toLocaleString()}</span>
    },
    {
      header: 'Service Date',
      accessor: 'date',
      sortable: true,
      render: (row) => <span className="text-xs font-mono text-neutral-400">{row.date}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          row.status === 'Completed'
            ? 'bg-green-950/40 text-green-400 border border-green-800/40'
            : 'bg-orange-950/40 text-brand-orange border border-orange-800/40'
        }`}>
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-neutral-100 uppercase tracking-wide">Maintenance Hub</h1>
          <p className="text-xs text-neutral-400 mt-1">Record scheduled repairs, engine overhauls, and general servicing.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form & Static diagram */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Service form */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 shadow-lg space-y-4">
            <div className="flex items-center space-x-2">
              <Wrench size={18} className="text-brand-orange animate-pulse" />
              <h2 className="text-base font-bold text-neutral-200">Log Service Record</h2>
            </div>

            {isViewOnly ? (
              <div className="rounded-lg bg-orange-950/20 border border-orange-900/30 p-4 space-y-2">
                <div className="flex items-center space-x-2 text-brand-orange">
                  <ShieldAlert size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Financial Read-Only</span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Your current account profile (<strong>Financial Analyst</strong>) permits read-only observation of maintenance logs for budget reviews. Logging operations requires a <strong>Fleet Manager</strong> access.
                </p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <FormField label="Target Vehicle" error={formErrors.vehicleReg} required>
                  <select
                    name="vehicleReg"
                    value={formData.vehicleReg}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2.5 px-3 text-sm text-neutral-200 focus:border-brand-orange focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Choose Truck --</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.regNumber}>{v.regNumber} ({v.name})</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Service / Work Type" error={formErrors.serviceType} required>
                  <input
                    type="text"
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleInputChange}
                    placeholder="e.g. Brake replacement"
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2.5 px-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-brand-orange focus:outline-none"
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Total Cost ($)" error={formErrors.cost} required>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                        <DollarSign size={14} />
                      </span>
                      <input
                        type="number"
                        name="cost"
                        value={formData.cost}
                        onChange={handleInputChange}
                        placeholder="750"
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2.5 pl-9 pr-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-brand-orange focus:outline-none"
                      />
                    </div>
                  </FormField>

                  <FormField label="Service Date" error={formErrors.date} required>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                        <Calendar size={14} />
                      </span>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2.5 pl-9 pr-3 text-sm text-neutral-200 focus:border-brand-orange focus:outline-none"
                      />
                    </div>
                  </FormField>
                </div>

                <FormField label="Service Status" required>
                  <div className="flex gap-4">
                    <label className="flex items-center space-x-2 text-xs text-neutral-300 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="In Progress"
                        checked={formData.status === 'In Progress'}
                        onChange={handleInputChange}
                        className="h-4 w-4 border-neutral-800 bg-neutral-950 text-brand-orange focus:ring-brand-orange"
                      />
                      <span>In Progress</span>
                    </label>
                    <label className="flex items-center space-x-2 text-xs text-neutral-300 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="Completed"
                        checked={formData.status === 'Completed'}
                        onChange={handleInputChange}
                        className="h-4 w-4 border-neutral-800 bg-neutral-950 text-brand-orange focus:ring-brand-orange"
                      />
                      <span>Completed</span>
                    </label>
                  </div>
                </FormField>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-brand-orange hover:bg-brand-orange-hover py-2 px-4 text-xs font-bold text-white transition-colors flex items-center justify-center space-x-1.5 shadow-md shadow-orange-500/5 active:scale-95"
                >
                  {isSubmitting ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <Plus size={14} />
                      <span>Log Service</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Flow Diagram (Static Visual Card) */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 shadow-lg space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-orange">Asset Status Flow</h3>
            
            {/* Flow boxes */}
            <div className="flex items-center justify-between py-4 px-2 rounded-lg bg-neutral-950/40 border border-neutral-800/40">
              <div className="flex flex-col items-center p-2 rounded-lg border border-green-900 bg-green-950/20 text-green-400 min-w-[90px]">
                <Check size={14} />
                <span className="text-2xs font-bold uppercase tracking-widest mt-1">Available</span>
              </div>

              <div className="text-neutral-600 flex flex-col items-center">
                <ArrowLeftRight size={16} className="animate-pulse" />
                <span className="text-3xs mt-1">Servicing</span>
              </div>

              <div className="flex flex-col items-center p-2 rounded-lg border border-orange-900 bg-orange-950/20 text-brand-orange min-w-[90px]">
                <Wrench size={14} />
                <span className="text-2xs font-bold uppercase tracking-widest mt-1">In Shop</span>
              </div>
            </div>

            <p className="text-3xs text-neutral-500 leading-relaxed font-semibold italic text-center">
              "In Shop vehicles are automatically removed from the active trip dispatch pool until repairs are marked Completed."
            </p>
          </div>

        </div>

        {/* Right Column: Service Record Table */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-200">Active Service Log Book</h2>
            <span className="text-3xs text-neutral-500 font-semibold uppercase tracking-wider">Archived & Live Log</span>
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center text-brand-orange bg-neutral-900 border border-neutral-800 rounded-lg">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-orange border-t-transparent"></div>
            </div>
          ) : (
            <DataTable 
              columns={columns} 
              rows={records} 
              emptyMessage="No recorded maintenance files found" 
            />
          )}
        </div>

      </div>

    </div>
  );
}
