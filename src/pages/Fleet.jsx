import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { vehicleService } from '../api';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import { Plus, Search, Info, ShieldAlert, Truck } from 'lucide-react';

/**
 * Fleet Registry page tracking all heavy/medium transit vehicles.
 * Implements access controls (Fleet Manager only can add), filters, and unique key verification.
 */
export default function Fleet() {
  const { user } = useAuth();
  const isManager = user?.role === 'Fleet Manager';

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    regNumber: '',
    name: '',
    type: 'Semi-Truck',
    maxLoadKg: '',
    odometer: '',
    acquisitionCost: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchVehicles = async () => {
    try {
      const data = await vehicleService.getAll();
      setVehicles(data);
    } catch (err) {
      console.error('Error fetching fleet vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear validation error when typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    const regPattern = /^[A-Z0-9-]+$/i;

    if (!formData.regNumber) {
      errors.regNumber = 'Registration number is required';
    } else if (!regPattern.test(formData.regNumber)) {
      errors.regNumber = 'Alphanumeric and hyphens only (e.g. CA-123-XY)';
    }

    if (!formData.name) {
      errors.name = 'Model name is required';
    }

    if (!formData.maxLoadKg) {
      errors.maxLoadKg = 'Max cargo load weight is required';
    } else if (Number(formData.maxLoadKg) <= 0) {
      errors.maxLoadKg = 'Weight capacity must be a positive number';
    }

    if (!formData.odometer) {
      errors.odometer = 'Starting odometer reading is required';
    } else if (Number(formData.odometer) < 0) {
      errors.odometer = 'Odometer reading cannot be negative';
    }

    if (!formData.acquisitionCost) {
      errors.acquisitionCost = 'Acquisition cost is required';
    } else if (Number(formData.acquisitionCost) <= 0) {
      errors.acquisitionCost = 'Acquisition cost must be positive';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setApiError('');

    try {
      await vehicleService.create(formData);
      // Reset and close
      setFormData({
        regNumber: '',
        name: '',
        type: 'Semi-Truck',
        maxLoadKg: '',
        odometer: '',
        acquisitionCost: '',
      });
      setIsModalOpen(false);
      fetchVehicles();
    } catch (err) {
      // API error handling for uniqueness
      setApiError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filters logic
  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch = v.regNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'All' || v.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const columns = [
    {
      header: 'Reg No.',
      accessor: 'regNumber',
      sortable: true,
      render: (row) => <span className="font-mono font-bold text-neutral-100">{row.regNumber}</span>
    },
    {
      header: 'Name / Model',
      accessor: 'name',
      sortable: true,
      render: (row) => <span className="font-medium text-neutral-200">{row.name}</span>
    },
    {
      header: 'Type',
      accessor: 'type',
      sortable: true,
      render: (row) => <span className="text-xs text-neutral-400 font-semibold uppercase">{row.type}</span>
    },
    {
      header: 'Capacity (Kg)',
      accessor: 'maxLoadKg',
      sortable: true,
      render: (row) => <span className="font-mono text-neutral-300 font-semibold">{row.maxLoadKg.toLocaleString()} kg</span>
    },
    {
      header: 'Odometer (Km)',
      accessor: 'odometer',
      sortable: true,
      render: (row) => <span className="font-mono text-neutral-300">{row.odometer.toLocaleString()} km</span>
    },
    {
      header: 'Acq. Cost ($)',
      accessor: 'acquisitionCost',
      sortable: true,
      render: (row) => <span className="font-mono text-neutral-300">${row.acquisitionCost.toLocaleString()}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-neutral-100 uppercase tracking-wide">Vehicle Registry</h1>
          <p className="text-xs text-neutral-400 mt-1">Manage core fleet assets and service registers.</p>
        </div>

        {/* Add vehicle trigger (Fleet Manager only) */}
        {isManager ? (
          <button
            onClick={() => {
              setApiError('');
              setFormErrors({});
              setIsModalOpen(true);
            }}
            className="flex items-center space-x-2 rounded-lg bg-brand-orange px-4 py-2 text-sm font-bold text-white hover:bg-brand-orange-hover transition-all duration-200 shadow-lg shadow-orange-500/10 active:scale-95"
          >
            <Plus size={16} />
            <span>Add Vehicle</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2 bg-neutral-900/50 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-400 select-none">
            <ShieldAlert size={14} className="text-brand-orange" />
            <span>View Only Access (Dispatcher/Analyst)</span>
          </div>
        )}
      </div>

      {/* Filter and Search Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Reg No or Model name..."
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 py-2 pl-10 pr-4 text-sm text-neutral-200 placeholder-neutral-500 focus:border-brand-orange focus:outline-none transition-colors"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-neutral-800 bg-neutral-900 py-2 px-4 text-sm text-neutral-200 focus:border-brand-orange focus:outline-none cursor-pointer"
          >
            <option value="All">All Types</option>
            <option value="Semi-Truck">Semi-Truck</option>
            <option value="Cargo Van">Cargo Van</option>
            <option value="Box Truck">Box Truck</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-neutral-800 bg-neutral-900 py-2 px-4 text-sm text-neutral-200 focus:border-brand-orange focus:outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="OnTrip">On Trip</option>
            <option value="InShop">In Shop</option>
            <option value="Retired">Retired</option>
          </select>
        </div>

        {/* Rule Banner */}
        <div className="flex items-center space-x-2.5 rounded-lg bg-neutral-900 p-3 text-xs text-neutral-400 border border-neutral-800">
          <Info size={14} className="text-brand-orange flex-shrink-0" />
          <span className="leading-normal">
            <strong>Registry Rule:</strong> Registration No. must be unique · Retired/In Shop vehicles are automatically hidden from Trip Dispatcher selection.
          </span>
        </div>
      </div>

      {/* Vehicles Table */}
      {loading ? (
        <div className="flex h-48 items-center justify-center text-brand-orange bg-neutral-900 border border-neutral-800 rounded-lg">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-orange border-t-transparent"></div>
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          rows={filteredVehicles} 
          emptyMessage="No vehicles match your registry search filters" 
        />
      )}

      {/* Add Vehicle Modal (Fleet Manager only) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Fleet Vehicle"
      >
        {apiError && (
          <div className="rounded-lg bg-red-950/50 border border-red-800/40 p-3 text-xs text-red-400 font-medium">
            {apiError}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Registration No." error={formErrors.regNumber} required>
              <input
                type="text"
                name="regNumber"
                value={formData.regNumber}
                onChange={handleInputChange}
                placeholder="e.g. CA-982-TR"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-brand-orange focus:outline-none"
              />
            </FormField>

            <FormField label="Vehicle Model" error={formErrors.name} required>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. Volvo FH16"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-brand-orange focus:outline-none"
              />
            </FormField>
          </div>

          <FormField label="Vehicle Category" required>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-200 focus:border-brand-orange focus:outline-none"
            >
              <option value="Semi-Truck">Semi-Truck</option>
              <option value="Cargo Van">Cargo Van</option>
              <option value="Box Truck">Box Truck</option>
            </select>
          </FormField>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Max Load (kg)" error={formErrors.maxLoadKg} required>
              <input
                type="number"
                name="maxLoadKg"
                value={formData.maxLoadKg}
                onChange={handleInputChange}
                placeholder="25000"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-brand-orange focus:outline-none"
              />
            </FormField>

            <FormField label="Odometer (km)" error={formErrors.odometer} required>
              <input
                type="number"
                name="odometer"
                value={formData.odometer}
                onChange={handleInputChange}
                placeholder="45000"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-brand-orange focus:outline-none"
              />
            </FormField>

            <FormField label="Acq. Cost ($)" error={formErrors.acquisitionCost} required>
              <input
                type="number"
                name="acquisitionCost"
                value={formData.acquisitionCost}
                onChange={handleInputChange}
                placeholder="145000"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-brand-orange focus:outline-none"
              />
            </FormField>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-800 mt-5">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 py-2 px-4 text-xs font-semibold text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-brand-orange hover:bg-brand-orange-hover py-2 px-4 text-xs font-semibold text-white transition-colors flex items-center space-x-1.5"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Truck size={14} />
                  <span>Register Vehicle</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
