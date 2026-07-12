import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { driverService } from '../api';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import { Plus, Search, Info, ShieldAlert, UserPlus, AlertCircle } from 'lucide-react';

/**
 * Drivers registry page with license expiry checks, safety metrics,
 * and an interactive inline status toggle group for safety managers.
 */
export default function Drivers() {
  const { user } = useAuth();
  // Fleet Manager and Safety Officer can edit drivers
  const canEdit = user?.role === 'Fleet Manager' || user?.role === 'Safety Officer';

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    licenseNo: '',
    category: 'Class A',
    expiryDate: '',
    contact: '',
    safetyScore: '',
    tripCompletionPct: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDrivers = async () => {
    try {
      const data = await driverService.getAll();
      setDrivers(data);
    } catch (err) {
      console.error('Error fetching drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
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
    if (!formData.name) errors.name = 'Driver name is required';
    if (!formData.licenseNo) errors.licenseNo = 'License number is required';
    if (!formData.expiryDate) errors.expiryDate = 'License expiration date is required';
    if (!formData.contact) errors.contact = 'Contact phone number is required';
    
    const score = Number(formData.safetyScore);
    if (formData.safetyScore && (score < 0 || score > 100)) {
      errors.safetyScore = 'Safety score must be between 0 and 100';
    }

    const completion = Number(formData.tripCompletionPct);
    if (formData.tripCompletionPct && (completion < 0 || completion > 100)) {
      errors.tripCompletionPct = 'Completion percentage must be between 0 and 100';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await driverService.create(formData);
      setFormData({
        name: '',
        licenseNo: '',
        category: 'Class A',
        expiryDate: '',
        contact: '',
        safetyScore: '',
        tripCompletionPct: '',
      });
      setIsModalOpen(false);
      fetchDrivers();
    } catch (err) {
      console.error('Error creating driver:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusToggle = async (driverId, newStatus) => {
    try {
      await driverService.updateStatus(driverId, newStatus);
      // Fast state reload
      const updated = drivers.map(d => d.id === driverId ? { ...d, status: newStatus } : d);
      setDrivers(updated);
    } catch (err) {
      console.error('Error toggling driver status:', err);
    }
  };

  // Compare dates using 2026-07-12 reference
  const checkLicenseExpiry = (dateStr) => {
    const refDate = new Date('2026-07-12');
    const expDate = new Date(dateStr);
    const diffTime = expDate - refDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { label: 'Expired', style: 'text-red-500 font-extrabold flex items-center gap-1' };
    } else if (diffDays <= 30) {
      return { label: `Expiring (${diffDays}d)`, style: 'text-brand-orange font-bold flex items-center gap-1' };
    } else {
      return { label: dateStr, style: 'text-neutral-400 font-medium' };
    }
  };

  // Filters logic
  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.licenseNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      header: 'Driver Name',
      accessor: 'name',
      sortable: true,
      render: (row) => <span className="font-bold text-neutral-100">{row.name}</span>
    },
    {
      header: 'License No.',
      accessor: 'licenseNo',
      sortable: true,
      render: (row) => <span className="font-mono text-neutral-300">{row.licenseNo}</span>
    },
    {
      header: 'Category',
      accessor: 'category',
      sortable: true,
      render: (row) => <span className="text-xs text-neutral-400 font-semibold uppercase">{row.category}</span>
    },
    {
      header: 'License Expiry',
      accessor: 'expiryDate',
      sortable: true,
      render: (row) => {
        const expiry = checkLicenseExpiry(row.expiryDate);
        return (
          <span className={expiry.style}>
            {expiry.label === 'Expired' && <AlertCircle size={12} />}
            {expiry.label.startsWith('Expiring') && <AlertCircle size={12} />}
            <span>{expiry.label === 'Expired' ? `Expired (${row.expiryDate})` : expiry.label}</span>
          </span>
        );
      }
    },
    {
      header: 'Contact',
      accessor: 'contact',
      sortable: false,
      render: (row) => <span className="text-xs font-mono text-neutral-400">{row.contact}</span>
    },
    {
      header: 'Safety Score',
      accessor: 'safetyScore',
      sortable: true,
      render: (row) => {
        const score = row.safetyScore;
        const color = score >= 90 ? 'text-green-400' : score >= 80 ? 'text-brand-orange' : 'text-red-400';
        return (
          <div className="flex items-center space-x-1.5">
            <span className={`font-mono font-bold ${color}`}>{score}/100</span>
          </div>
        );
      }
    },
    {
      header: 'Completion %',
      accessor: 'tripCompletionPct',
      sortable: true,
      render: (row) => <span className="font-mono text-neutral-300">{row.tripCompletionPct}%</span>
    },
    {
      header: 'Status Terminal',
      accessor: 'status',
      sortable: true,
      render: (row) => {
        if (!canEdit) {
          return <StatusBadge status={row.status} />;
        }
        
        // Interactive Toggle Button-Group
        const statuses = ['Available', 'OnTrip', 'OffDuty', 'Suspended'];
        const activeColors = {
          Available: 'bg-green-600 border-green-500 text-white font-bold',
          OnTrip: 'bg-blue-600 border-blue-500 text-white font-bold',
          OffDuty: 'bg-neutral-700 border-neutral-600 text-neutral-100',
          Suspended: 'bg-red-600 border-red-500 text-white font-bold',
        };

        return (
          <div className="inline-flex rounded-lg border border-neutral-800 bg-neutral-950 p-0.5" role="group">
            {statuses.map((s) => {
              const isActive = row.status === s || (s === 'OnTrip' && row.status === 'On Trip');
              const activeStyle = isActive ? activeColors[s] : 'text-neutral-500 hover:text-neutral-300';
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleStatusToggle(row.id, s)}
                  className={`rounded-md px-2 py-1 text-3xs font-medium uppercase tracking-wider transition-all ${activeStyle}`}
                >
                  {s === 'OnTrip' ? 'On Trip' : s === 'OffDuty' ? 'Off Duty' : s}
                </button>
              );
            })}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-neutral-100 uppercase tracking-wide">Drivers & Safety Profiles</h1>
          <p className="text-xs text-neutral-400 mt-1">Monitor driver safety ratings, compliance, and duty state.</p>
        </div>

        {canEdit ? (
          <button
            onClick={() => {
              setFormErrors({});
              setIsModalOpen(true);
            }}
            className="flex items-center space-x-2 rounded-lg bg-brand-orange px-4 py-2 text-sm font-bold text-white hover:bg-brand-orange-hover transition-all duration-200 shadow-lg shadow-orange-500/10 active:scale-95"
          >
            <Plus size={16} />
            <span>Add Driver</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2 bg-neutral-900/50 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-400 select-none">
            <ShieldAlert size={14} className="text-brand-orange" />
            <span>View Only Access (Dispatcher/Analyst)</span>
          </div>
        )}
      </div>

      {/* Filters and banner */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search driver by name or license number..."
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 py-2 pl-10 pr-4 text-sm text-neutral-200 placeholder-neutral-500 focus:border-brand-orange focus:outline-none transition-colors"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-neutral-800 bg-neutral-900 py-2 px-4 text-sm text-neutral-200 focus:border-brand-orange focus:outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="OnTrip">On Trip</option>
            <option value="OffDuty">Off Duty</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>

        {/* Rule Banner */}
        <div className="flex items-center space-x-2.5 rounded-lg bg-neutral-900 p-3 text-xs text-neutral-400 border border-neutral-800">
          <Info size={14} className="text-brand-orange flex-shrink-0" />
          <span className="leading-normal">
            <strong>Compliance Lock:</strong> Expired license or Suspended status &rarr; blocked from trip assignment by the dispatcher validation suite.
          </span>
        </div>
      </div>

      {/* Drivers log Table */}
      {loading ? (
        <div className="flex h-48 items-center justify-center text-brand-orange bg-neutral-900 border border-neutral-800 rounded-lg">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-orange border-t-transparent"></div>
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          rows={filteredDrivers} 
          emptyMessage="No drivers matched your active search query" 
        />
      )}

      {/* Add Driver Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Driver Profile"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <FormField label="Full Name" error={formErrors.name} required>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g. Sarah Jenkins"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-brand-orange focus:outline-none"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="License Number" error={formErrors.licenseNo} required>
              <input
                type="text"
                name="licenseNo"
                value={formData.licenseNo}
                onChange={handleInputChange}
                placeholder="e.g. DL-89210"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-brand-orange focus:outline-none"
              />
            </FormField>

            <FormField label="License Category" required>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-200 focus:border-brand-orange focus:outline-none"
              >
                <option value="Class A">Class A CDL</option>
                <option value="Class B">Class B CDL</option>
                <option value="Class C">Class C Standard</option>
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Expiration Date" error={formErrors.expiryDate} required>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-200 focus:border-brand-orange focus:outline-none"
              />
            </FormField>

            <FormField label="Contact Number" error={formErrors.contact} required>
              <input
                type="text"
                name="contact"
                value={formData.contact}
                onChange={handleInputChange}
                placeholder="+1-555-0100"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-brand-orange focus:outline-none"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Initial Safety Score" error={formErrors.safetyScore}>
              <input
                type="number"
                name="safetyScore"
                value={formData.safetyScore}
                onChange={handleInputChange}
                placeholder="100"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-brand-orange focus:outline-none"
              />
            </FormField>

            <FormField label="Completion Pct (%)" error={formErrors.tripCompletionPct}>
              <input
                type="number"
                name="tripCompletionPct"
                value={formData.tripCompletionPct}
                onChange={handleInputChange}
                placeholder="100"
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
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <UserPlus size={14} />
                  <span>Register Driver</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
