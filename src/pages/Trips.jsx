import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { tripService, vehicleService, driverService } from '../api';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import { 
  PlusCircle, 
  MapPin, 
  Scale, 
  Milestone, 
  AlertTriangle, 
  Compass, 
  CheckSquare, 
  XOctagon, 
  Calendar,
  CheckCircle,
  Truck
} from 'lucide-react';

/**
 * Trip Dispatcher interface acting as the mission control room.
 * Integrates interactive stepper guides, live capacity checks, Live Board widgets,
 * and a modal completion wizard.
 */
export default function Trips() {
  const { user } = useAuth();
  const isViewOnly = user?.role === 'Safety Officer'; // Safety Officer has Trips view-only

  const [trips, setTrips] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Focus Trip for Stepper
  const [selectedTrip, setSelectedTrip] = useState(null);

  // Dispatch Form State
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    vehicleId: '',
    driverId: '',
    cargoWeight: '',
    plannedDistance: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [capacityOverflow, setCapacityOverflow] = useState(null);

  // Completion Modal State
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [completingTrip, setCompletingTrip] = useState(null);
  const [completeFormData, setCompleteFormData] = useState({
    finalOdometer: '',
    fuelConsumed: '',
  });
  const [completeErrors, setCompleteErrors] = useState({});
  const [isSubmittingComplete, setIsSubmittingComplete] = useState(false);

  const [isSubmittingDispatch, setIsSubmittingDispatch] = useState(false);
  const [dispatchError, setDispatchError] = useState('');

  const loadData = async () => {
    try {
      const allTrips = await tripService.getAll();
      const allVehicles = await vehicleService.getAll();
      const allDrivers = await driverService.getAll();

      setTrips(allTrips);
      
      // Filter for available assets
      setAvailableVehicles(allVehicles.filter(v => v.status === 'Available'));
      setAvailableDrivers(allDrivers.filter(d => d.status === 'Available' && !checkIsLicenseExpired(d.expiryDate)));

      // Auto focus on the first Dispatched/Active trip if not already focused
      if (allTrips.length > 0) {
        const active = allTrips.find(t => t.status === 'Dispatched') || allTrips[0];
        setSelectedTrip(active);
      }
    } catch (err) {
      console.error('Error loading dispatcher data:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkIsLicenseExpired = (expiryDateStr) => {
    const ref = new Date('2026-07-12');
    const exp = new Date(expiryDateStr);
    return exp - ref <= 0;
  };

  useEffect(() => {
    loadData();
  }, []);

  // Live Capacity Audit on input change
  useEffect(() => {
    if (!formData.vehicleId || !formData.cargoWeight) {
      setCapacityOverflow(null);
      return;
    }

    const selectedVehicle = availableVehicles.find(v => v.id === formData.vehicleId);
    if (!selectedVehicle) return;

    const limit = selectedVehicle.maxLoadKg;
    const weight = Number(formData.cargoWeight);

    if (weight > limit) {
      setCapacityOverflow({
        limit,
        weight,
        exceededBy: weight - limit
      });
    } else {
      setCapacityOverflow(null);
    }
  }, [formData.vehicleId, formData.cargoWeight, availableVehicles]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateDispatchForm = () => {
    const errors = {};
    if (!formData.source) errors.source = 'Source location is required';
    if (!formData.destination) errors.destination = 'Destination location is required';
    if (!formData.vehicleId) errors.vehicleId = 'Please select an available vehicle';
    if (!formData.driverId) errors.driverId = 'Please assign an available driver';
    
    if (!formData.cargoWeight || Number(formData.cargoWeight) <= 0) {
      errors.cargoWeight = 'Cargo weight must be a positive number';
    }

    if (!formData.plannedDistance || Number(formData.plannedDistance) <= 0) {
      errors.plannedDistance = 'Distance must be positive';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0 && !capacityOverflow;
  };

  const handleDispatch = async (e) => {
    e.preventDefault();
    if (!validateDispatchForm()) return;

    setIsSubmittingDispatch(true);
    setDispatchError('');

    try {
      const newTrip = await tripService.create(formData);
      // Reset
      setFormData({
        source: '',
        destination: '',
        vehicleId: '',
        driverId: '',
        cargoWeight: '',
        plannedDistance: '',
      });
      await loadData();
      setSelectedTrip(newTrip);
    } catch (err) {
      setDispatchError(err.message);
    } finally {
      setIsSubmittingDispatch(false);
    }
  };

  const handleOpenCompleteModal = (trip) => {
    setCompletingTrip(trip);
    setCompleteFormData({
      finalOdometer: String(trip.startOdometer + trip.distance), // pre-calculate suggestion
      fuelConsumed: '',
    });
    setCompleteErrors({});
    setIsCompleteModalOpen(true);
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    const finalOdo = Number(completeFormData.finalOdometer);
    const fuel = Number(completeFormData.fuelConsumed);

    if (!completeFormData.finalOdometer) {
      errors.finalOdometer = 'Final odometer reading is required';
    } else if (finalOdo <= completingTrip.startOdometer) {
      errors.finalOdometer = `Must exceed starting value of ${completingTrip.startOdometer} km`;
    }

    if (!completeFormData.fuelConsumed) {
      errors.fuelConsumed = 'Fuel consumption (liters) is required';
    } else if (fuel <= 0) {
      errors.fuelConsumed = 'Liters consumed must be a positive number';
    }

    if (Object.keys(errors).length > 0) {
      setCompleteErrors(errors);
      return;
    }

    setIsSubmittingComplete(true);
    try {
      await tripService.complete(completingTrip.id, finalOdo, fuel);
      setIsCompleteModalOpen(false);
      await loadData();
      
      // Keep focused on updated trip details
      const refreshed = trips.find(t => t.id === completingTrip.id);
      if (refreshed) setSelectedTrip({ ...refreshed, status: 'Completed' });
    } catch (err) {
      setCompleteErrors({ api: err.message });
    } finally {
      setIsSubmittingComplete(false);
    }
  };

  const handleCancelTrip = async (tripId) => {
    if (!window.confirm(`Are you sure you want to cancel Trip ${tripId}?`)) return;
    try {
      await tripService.cancel(tripId);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to determine active index of lifecycle stepper
  const getStepIndex = (status) => {
    const s = status ? status.toLowerCase() : '';
    if (s === 'draft') return 0;
    if (s === 'dispatched' || s === 'ontrip') return 1;
    if (s === 'completed') return 2;
    if (s === 'cancelled') return 3;
    return 0;
  };

  const currentStep = selectedTrip ? getStepIndex(selectedTrip.status) : 0;
  const steps = ['Draft', 'Dispatched', 'Completed', 'Cancelled'];

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-neutral-100 uppercase tracking-wide">Trip Dispatch Terminal</h1>
          <p className="text-xs text-neutral-400 mt-1">Deploy vehicles, verify load safety, and record trip completions.</p>
        </div>
      </div>

      {/* Horizontal Lifecycle Stepper */}
      {selectedTrip && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Inspecting Trip:</span>
              <span className="font-mono text-sm font-bold text-brand-orange">{selectedTrip.id}</span>
              <StatusBadge status={selectedTrip.status} />
            </div>
            <span className="text-xs text-neutral-400 font-medium font-mono">{selectedTrip.route}</span>
          </div>

          {/* Stepper graphical line */}
          <div className="relative flex items-center justify-between w-full py-4 px-4 sm:px-10">
            {/* Background line */}
            <div className="absolute left-10 right-10 top-1/2 h-0.5 bg-neutral-800 -translate-y-1/2"></div>
            {/* Progress line */}
            <div 
              className={`absolute left-10 top-1/2 h-0.5 -translate-y-1/2 transition-all duration-500 ${
                currentStep === 3 ? 'bg-red-600' : 'bg-brand-orange'
              }`}
              style={{ width: `${selectedTrip.status === 'Cancelled' ? '100' : (currentStep / (steps.length - 2)) * 80}%` }}
            ></div>

            {steps.map((label, idx) => {
              const isActive = currentStep === idx;
              const isPassed = currentStep > idx && currentStep !== 3; // Cancelled doesn't show normal passes
              const isCancelled = selectedTrip.status === 'Cancelled' && idx === 3;

              let iconStyle = 'bg-neutral-950 border-neutral-800 text-neutral-500';
              if (isActive) {
                iconStyle = isCancelled ? 'bg-red-950 border-red-500 text-red-400 ring-4 ring-red-500/20' : 'bg-orange-950 border-brand-orange text-brand-orange ring-4 ring-orange-500/20';
              } else if (isPassed) {
                iconStyle = 'bg-brand-orange border-brand-orange text-white';
              } else if (isCancelled) {
                iconStyle = 'bg-red-950 border-red-500 text-red-500';
              }

              return (
                <div key={label} className="relative z-10 flex flex-col items-center">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${iconStyle}`}>
                    {isPassed ? <CheckCircle size={14} strokeWidth={3} /> : <span className="text-xs font-bold">{idx + 1}</span>}
                  </div>
                  <span className={`mt-2 text-2xs font-semibold uppercase tracking-wider ${isActive ? (isCancelled ? 'text-red-400' : 'text-brand-orange') : 'text-neutral-500'}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main split display: Dispatch form vs Live Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Dispatch Form (Hidden or read-only warning for safety officers) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-lg space-y-4">
            <h2 className="text-base font-bold text-neutral-200">Dispatch New Cargo</h2>

            {isViewOnly ? (
              <div className="rounded-lg bg-orange-950/20 border border-orange-900/30 p-4 space-y-3">
                <div className="flex items-center space-x-2 text-brand-orange">
                  <AlertTriangle size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">Access Scope Restricted</span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Your current account profile (<strong>Safety Officer</strong>) permits view-only inspection of dispatches. Creating and completing voyages requires a <strong>Fleet Manager</strong> or <strong>Dispatcher</strong> credentials.
                </p>
              </div>
            ) : (
              <form onSubmit={handleDispatch} className="space-y-4">
                {dispatchError && (
                  <div className="rounded-lg bg-red-950 border border-red-950 text-xs text-red-400 p-3">
                    {dispatchError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Source Depot" error={formErrors.source} required>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                        <MapPin size={14} />
                      </span>
                      <input
                        type="text"
                        name="source"
                        value={formData.source}
                        onChange={handleInputChange}
                        placeholder="Chicago Port"
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2.5 pl-9 pr-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-brand-orange focus:outline-none"
                      />
                    </div>
                  </FormField>

                  <FormField label="Destination Hub" error={formErrors.destination} required>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                        <MapPin size={14} />
                      </span>
                      <input
                        type="text"
                        name="destination"
                        value={formData.destination}
                        onChange={handleInputChange}
                        placeholder="Houston Terminal"
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2.5 pl-9 pr-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-brand-orange focus:outline-none"
                      />
                    </div>
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Available Vehicle" error={formErrors.vehicleId} required>
                    <select
                      name="vehicleId"
                      value={formData.vehicleId}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2.5 px-3 text-sm text-neutral-200 focus:border-brand-orange focus:outline-none"
                    >
                      <option value="">-- Select Active --</option>
                      {availableVehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.regNumber} ({v.name} · max {v.maxLoadKg.toLocaleString()}kg)</option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Available Driver" error={formErrors.driverId} required>
                    <select
                      name="driverId"
                      value={formData.driverId}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2.5 px-3 text-sm text-neutral-200 focus:border-brand-orange focus:outline-none"
                    >
                      <option value="">-- Assign Driver --</option>
                      {availableDrivers.map(d => (
                        <option key={d.id} value={d.id}>{d.name} (CDL · Score: {d.safetyScore})</option>
                      ))}
                    </select>
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Cargo Weight (kg)" error={formErrors.cargoWeight} required>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                        <Scale size={14} />
                      </span>
                      <input
                        type="number"
                        name="cargoWeight"
                        value={formData.cargoWeight}
                        onChange={handleInputChange}
                        placeholder="12000"
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2.5 pl-9 pr-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-brand-orange focus:outline-none"
                      />
                    </div>
                  </FormField>

                  <FormField label="Planned Distance (km)" error={formErrors.plannedDistance} required>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                        <Milestone size={14} />
                      </span>
                      <input
                        type="number"
                        name="plannedDistance"
                        value={formData.plannedDistance}
                        onChange={handleInputChange}
                        placeholder="350"
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2.5 pl-9 pr-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-brand-orange focus:outline-none"
                      />
                    </div>
                  </FormField>
                </div>

                {/* Capacity Overflow Warning Box */}
                {capacityOverflow && (
                  <div className="rounded-lg bg-red-950/50 border-2 border-red-800/80 p-4 space-y-2 animate-fade-in">
                    <div className="flex items-center space-x-2 text-red-400 font-bold text-xs uppercase">
                      <AlertTriangle size={16} />
                      <span>Dispatch Capacity Warning</span>
                    </div>
                    <p className="text-2xs text-red-300 leading-normal">
                      Vehicle Capacity: <strong className="font-mono text-neutral-100">{capacityOverflow.limit.toLocaleString()} kg</strong> / 
                      Cargo Weight: <strong className="font-mono text-neutral-100">{capacityOverflow.weight.toLocaleString()} kg</strong>. <br />
                      Capacity exceeded by <strong className="font-mono text-red-400 font-bold">{capacityOverflow.exceededBy.toLocaleString()} kg</strong> &mdash; dispatch blocked.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingDispatch || !!capacityOverflow}
                  className="w-full rounded-lg bg-brand-orange hover:bg-brand-orange-hover py-2.5 text-xs font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-orange-500/10 active:scale-95 flex items-center justify-center space-x-1.5"
                >
                  {isSubmittingDispatch ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>Dispatching Voyage...</span>
                    </>
                  ) : (
                    <>
                      <Compass size={14} />
                      <span>Dispatch Voyage</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Stepper Rules Footer */}
            <div className="border-t border-neutral-800 pt-4 text-3xs text-neutral-500 font-medium">
              <span className="uppercase tracking-wider block mb-1">Lifecycle Automation Rule</span>
              <p className="leading-normal">
                On Complete: odometer &rarr; fuel log &rarr; expenses &rarr; Vehicle & Driver status automatically reset to Available.
              </p>
            </div>

          </div>
        </div>

        {/* Right: Live Board (Trip List Cards) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-200">Live Voyage Board</h2>
            <span className="text-3xs text-neutral-500 font-semibold uppercase tracking-wider">Active Assets</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[520px] overflow-y-auto pr-1">
            {trips.length === 0 ? (
              <div className="col-span-2 rounded-xl border border-neutral-800 bg-neutral-900 p-10 text-center text-neutral-500 font-medium">
                No active trip dispatches on record
              </div>
            ) : (
              [...trips].reverse().map((trip) => {
                const isSelected = selectedTrip?.id === trip.id;
                const isDispatched = trip.status === 'Dispatched';

                return (
                  <div
                    key={trip.id}
                    onClick={() => setSelectedTrip(trip)}
                    className={`rounded-xl border p-4 bg-neutral-900 transition-all cursor-pointer flex flex-col justify-between space-y-4 shadow-sm hover:border-neutral-700 ${
                      isSelected ? 'border-brand-orange ring-2 ring-brand-orange/20 shadow-md shadow-orange-500/5 bg-neutral-900/90' : 'border-neutral-800'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <span className="font-mono text-xs font-black text-brand-orange">{trip.id}</span>
                        <h4 className="text-xs font-bold text-neutral-200 leading-tight">{trip.route}</h4>
                      </div>
                      <StatusBadge status={trip.status} />
                    </div>

                    {/* Meta info */}
                    <div className="grid grid-cols-2 gap-2 text-3xs font-medium text-neutral-400 pt-2 border-t border-neutral-800/40">
                      <div>
                        <span className="text-neutral-500 uppercase tracking-wider block">Assigned Truck</span>
                        <span className="font-mono font-semibold text-neutral-300">{trip.vehicleReg}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 uppercase tracking-wider block">Assigned Driver</span>
                        <span className="font-semibold text-neutral-300 truncate block">{trip.driverName}</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-neutral-500 uppercase tracking-wider block">Cargo Load</span>
                        <span className="font-mono font-semibold text-neutral-300">{trip.cargoWeight.toLocaleString()} kg</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-neutral-500 uppercase tracking-wider block">ETA Status</span>
                        <span className={`font-semibold ${isDispatched ? 'text-blue-400 font-mono' : 'text-neutral-500'}`}>{trip.eta}</span>
                      </div>
                    </div>

                    {/* Operational CTA Actions (Hidden for Safety Officers and view-only roles) */}
                    {!isViewOnly && isDispatched && (
                      <div className="flex items-center space-x-2 pt-3 border-t border-neutral-800/60" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenCompleteModal(trip)}
                          className="flex-1 flex items-center justify-center space-x-1 rounded bg-green-950/60 border border-green-800/60 hover:bg-green-900/60 py-1.5 text-3xs font-bold text-green-400 transition-colors"
                        >
                          <CheckSquare size={12} />
                          <span>Complete Voyage</span>
                        </button>
                        <button
                          onClick={() => handleCancelTrip(trip.id)}
                          className="rounded bg-red-950/60 border border-red-800/60 hover:bg-red-900/60 p-1.5 text-red-400 transition-colors"
                          title="Abort Voyage"
                        >
                          <XOctagon size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Complete Trip Wizard Modal */}
      {completingTrip && (
        <Modal
          isOpen={isCompleteModalOpen}
          onClose={() => setIsCompleteModalOpen(false)}
          title={`Log Trip Completion: ${completingTrip.id}`}
        >
          {completeErrors.api && (
            <div className="rounded-lg bg-red-950 border border-red-950 text-xs text-red-400 p-3">
              {completeErrors.api}
            </div>
          )}

          <form onSubmit={handleCompleteSubmit} className="space-y-4">
            
            {/* Help block details start odometer */}
            <div className="rounded-lg bg-neutral-950/50 border border-neutral-800 p-3 space-y-1.5 text-xs text-neutral-400">
              <div className="flex justify-between">
                <span>Start Odometer:</span>
                <strong className="font-mono text-neutral-200">{completingTrip.startOdometer.toLocaleString()} km</strong>
              </div>
              <div className="flex justify-between">
                <span>Planned distance:</span>
                <strong className="font-mono text-neutral-200">+{completingTrip.distance.toLocaleString()} km</strong>
              </div>
            </div>

            <FormField label="Final Odometer Reading (km)" error={completeErrors.finalOdometer} required>
              <input
                type="number"
                value={completeFormData.finalOdometer}
                onChange={(e) => {
                  setCompleteFormData(prev => ({ ...prev, finalOdometer: e.target.value }));
                  if (completeErrors.finalOdometer) setCompleteErrors(prev => ({ ...prev, finalOdometer: '' }));
                }}
                placeholder={String(completingTrip.startOdometer + completingTrip.distance)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-200 focus:border-brand-orange focus:outline-none"
              />
            </FormField>

            <FormField label="Actual Fuel Consumed (liters)" error={completeErrors.fuelConsumed} required>
              <input
                type="number"
                value={completeFormData.fuelConsumed}
                onChange={(e) => {
                  setCompleteFormData(prev => ({ ...prev, fuelConsumed: e.target.value }));
                  if (completeErrors.fuelConsumed) setCompleteErrors(prev => ({ ...prev, fuelConsumed: '' }));
                }}
                placeholder="e.g. 75"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-200 focus:border-brand-orange focus:outline-none"
              />
            </FormField>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-800 mt-5">
              <button
                type="button"
                onClick={() => setIsCompleteModalOpen(false)}
                className="rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 py-2 px-4 text-xs font-semibold text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isSubmittingComplete}
                className="rounded-lg bg-green-600 hover:bg-green-700 py-2 px-4 text-xs font-semibold text-white transition-all flex items-center space-x-1.5"
              >
                {isSubmittingComplete ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Logging...</span>
                  </>
                ) : (
                  <>
                    <CheckSquare size={14} />
                    <span>Log Completion</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}
