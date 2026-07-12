import axios from 'axios';

// ============================================================================
// API Configuration & Swappable Axios Client
// ============================================================================
// Toggle this to true to use the real API instead of local storage mocks
const USE_REAL_API = false;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('transitops_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// ============================================================================
// Mock Database Seeding & Persistence in LocalStorage
// ============================================================================
const DEFAULT_VEHICLES = [
  { id: '1', regNumber: 'NY-789-TR', name: 'Volvo FH16', type: 'Semi-Truck', maxLoadKg: 25000, odometer: 124500, acquisitionCost: 145000, status: 'Available' },
  { id: '2', regNumber: 'CA-456-VN', name: 'Ford Transit', type: 'Cargo Van', maxLoadKg: 1500, odometer: 45000, acquisitionCost: 32000, status: 'OnTrip' },
  { id: '3', regNumber: 'TX-123-DT', name: 'Peterbilt 579', type: 'Semi-Truck', maxLoadKg: 28000, odometer: 210000, acquisitionCost: 160000, status: 'InShop' },
  { id: '4', regNumber: 'FL-890-FL', name: 'Freightliner Cascadia', type: 'Semi-Truck', maxLoadKg: 26000, odometer: 89000, acquisitionCost: 135000, status: 'Retired' },
];

const DEFAULT_DRIVERS = [
  { id: '1', name: 'Sarah Jenkins', licenseNo: 'DL-89210', category: 'Class A', expiryDate: '2026-10-15', contact: '+1-555-0192', safetyScore: 98, tripCompletionPct: 99, status: 'OnTrip' },
  { id: '2', name: 'Marcus Chen', licenseNo: 'DL-45612', category: 'Class A', expiryDate: '2026-07-20', contact: '+1-555-0143', safetyScore: 94, tripCompletionPct: 95, status: 'Available' }, // Expiring within 30 days (based on 2026-07-12)
  { id: '3', name: 'John Miller', licenseNo: 'DL-78901', category: 'Class B', expiryDate: '2026-05-10', contact: '+1-555-0177', safetyScore: 82, tripCompletionPct: 90, status: 'OffDuty' }, // Expired
  { id: '4', name: 'David Kojo', licenseNo: 'DL-33445', category: 'Class A', expiryDate: '2026-12-31', contact: '+1-555-0188', safetyScore: 96, tripCompletionPct: 97, status: 'Suspended' },
];

const DEFAULT_TRIPS = [
  { id: 'T-1001', route: 'Chicago Depot → Detroit Hub', vehicleId: '2', vehicleReg: 'CA-456-VN', vehicleName: 'Ford Transit', driverId: '1', driverName: 'Sarah Jenkins', cargoWeight: 1200, status: 'Dispatched', eta: '3 hours', distance: 280, startOdometer: 44720 },
  { id: 'T-1002', route: 'Houston Port → Dallas Term', vehicleId: '1', vehicleReg: 'NY-789-TR', vehicleName: 'Volvo FH16', driverId: '2', driverName: 'Marcus Chen', cargoWeight: 20000, status: 'Completed', eta: 'Completed', distance: 240, startOdometer: 124260, endOdometer: 124500, fuelConsumed: 80, expensesLogged: 120 },
  { id: 'T-1003', route: 'Denver Depot → Phoenix Terminal', vehicleId: '3', vehicleReg: 'TX-123-DT', vehicleName: 'Peterbilt 579', driverId: '3', driverName: 'John Miller', cargoWeight: 15000, status: 'Cancelled', eta: 'Cancelled', distance: 800, startOdometer: 210000 },
];

const DEFAULT_MAINTENANCE = [
  { id: '1', vehicleReg: 'TX-123-DT', serviceType: 'Engine Overhaul', cost: 4500, date: '2026-07-10', status: 'Completed' },
  { id: '2', vehicleReg: 'CA-456-VN', serviceType: 'Tire Rotation', cost: 250, date: '2026-06-15', status: 'Completed' },
  { id: '3', vehicleReg: 'TX-123-DT', serviceType: 'Transmission Service', cost: 1800, date: '2026-07-12', status: 'In Progress' },
];

const DEFAULT_FUEL_LOGS = [
  { id: '1', date: '2026-07-08', vehicleReg: 'NY-789-TR', liters: 220, cost: 440, odometer: 124100 },
  { id: '2', date: '2026-07-11', vehicleReg: 'CA-456-VN', liters: 60, cost: 110, odometer: 44800 },
];

const DEFAULT_EXPENSES = [
  { id: '1', date: '2026-07-09', vehicleReg: 'NY-789-TR', type: 'Toll Fees', cost: 45 },
  { id: '2', date: '2026-07-11', vehicleReg: 'CA-456-VN', type: 'Driver Meal', cost: 30 },
];

// Helper to initialize and retrieve DB mock storage
const getDb = () => {
  const initDb = (key, defaultVal) => {
    if (!localStorage.getItem(`db_${key}`)) {
      localStorage.setItem(`db_${key}`, JSON.stringify(defaultVal));
    }
    return JSON.parse(localStorage.getItem(`db_${key}`));
  };

  return {
    vehicles: initDb('vehicles', DEFAULT_VEHICLES),
    drivers: initDb('drivers', DEFAULT_DRIVERS),
    trips: initDb('trips', DEFAULT_TRIPS),
    maintenance: initDb('maintenance', DEFAULT_MAINTENANCE),
    fuelLogs: initDb('fuel_logs', DEFAULT_FUEL_LOGS),
    expenses: initDb('expenses', DEFAULT_EXPENSES),
  };
};

const saveDb = (db) => {
  localStorage.setItem('db_vehicles', JSON.stringify(db.vehicles));
  localStorage.setItem('db_drivers', JSON.stringify(db.drivers));
  localStorage.setItem('db_trips', JSON.stringify(db.trips));
  localStorage.setItem('db_maintenance', JSON.stringify(db.maintenance));
  localStorage.setItem('db_fuel_logs', JSON.stringify(db.fuelLogs));
  localStorage.setItem('db_expenses', JSON.stringify(db.expenses));
};

// Simulate network latency (300ms)
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Lockout tracking helper
const checkLockout = (email) => {
  const attempts = JSON.parse(localStorage.getItem(`login_attempts_${email}`)) || { count: 0, lockedUntil: null };
  if (attempts.lockedUntil && new Date().getTime() < attempts.lockedUntil) {
    return { isLocked: true, lockedUntil: attempts.lockedUntil };
  }
  return { isLocked: false };
};

const incrementFailedAttempts = (email) => {
  const attempts = JSON.parse(localStorage.getItem(`login_attempts_${email}`)) || { count: 0, lockedUntil: null };
  attempts.count += 1;
  if (attempts.count >= 5) {
    attempts.lockedUntil = new Date().getTime() + 5 * 60 * 1000; // Lock for 5 minutes
  }
  localStorage.setItem(`login_attempts_${email}`, JSON.stringify(attempts));
  return attempts;
};

const clearFailedAttempts = (email) => {
  localStorage.removeItem(`login_attempts_${email}`);
};

// ============================================================================
// Service Endpoint Definitions
// ============================================================================
export const authService = {
  login: async (email, password, role) => {
    if (USE_REAL_API) {
      const response = await api.post('/auth/login', { email, password, role });
      return response.data;
    }
    
    await delay(500);

    // Check account lockout
    const lockout = checkLockout(email);
    if (lockout.isLocked) {
      throw new Error(`Account locked after 5 failed attempts. Please try again later.`);
    }

    // Hardcode verification for mock
    // Valid password will be "password" (case-insensitive) or any password that's at least 6 characters
    if (password && password.toLowerCase() === 'admin' || password.length >= 6) {
      clearFailedAttempts(email);
      const fakeToken = `fake-jwt-token-for-${role}-${Date.now()}`;
      const user = { name: email.split('@')[0].toUpperCase(), email, role };
      localStorage.setItem('transitops_token', fakeToken);
      localStorage.setItem('transitops_role', role);
      localStorage.setItem('transitops_user', JSON.stringify(user));
      return { token: fakeToken, user };
    } else {
      const attempts = incrementFailedAttempts(email);
      if (attempts.count >= 5) {
        throw new Error(`Account locked after 5 failed attempts.`);
      }
      throw new Error(`Invalid credentials. ${5 - attempts.count} attempts remaining before account lock.`);
    }
  },

  logout: async () => {
    await delay(100);
    localStorage.removeItem('transitops_token');
    localStorage.removeItem('transitops_role');
    localStorage.removeItem('transitops_user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('transitops_user');
    return userStr ? JSON.parse(userStr) : null;
  }
};

export const vehicleService = {
  getAll: async () => {
    if (USE_REAL_API) {
      const response = await api.get('/vehicles');
      return response.data;
    }
    await delay();
    return getDb().vehicles;
  },

  create: async (vehicle) => {
    if (USE_REAL_API) {
      const response = await api.post('/vehicles', vehicle);
      return response.data;
    }
    await delay();
    const db = getDb();
    
    // RegNo uniqueness check
    const exists = db.vehicles.some(v => v.regNumber.toUpperCase() === vehicle.regNumber.toUpperCase());
    if (exists) {
      throw new Error(`Registration number "${vehicle.regNumber}" is already registered in the system.`);
    }

    const newVehicle = {
      id: String(db.vehicles.length + 1),
      ...vehicle,
      odometer: Number(vehicle.odometer),
      maxLoadKg: Number(vehicle.maxLoadKg),
      acquisitionCost: Number(vehicle.acquisitionCost),
      status: 'Available'
    };
    db.vehicles.push(newVehicle);
    saveDb(db);
    return newVehicle;
  }
};

export const driverService = {
  getAll: async () => {
    if (USE_REAL_API) {
      const response = await api.get('/drivers');
      return response.data;
    }
    await delay();
    return getDb().drivers;
  },

  create: async (driver) => {
    if (USE_REAL_API) {
      const response = await api.post('/drivers', driver);
      return response.data;
    }
    await delay();
    const db = getDb();
    const newDriver = {
      id: String(db.drivers.length + 1),
      ...driver,
      safetyScore: Number(driver.safetyScore || 100),
      tripCompletionPct: Number(driver.tripCompletionPct || 100),
      status: 'Available'
    };
    db.drivers.push(newDriver);
    saveDb(db);
    return newDriver;
  },

  updateStatus: async (driverId, status) => {
    if (USE_REAL_API) {
      const response = await api.put(`/drivers/${driverId}/status`, { status });
      return response.data;
    }
    await delay();
    const db = getDb();
    const idx = db.drivers.findIndex(d => d.id === driverId);
    if (idx !== -1) {
      db.drivers[idx].status = status;
      saveDb(db);
      return db.drivers[idx];
    }
    throw new Error('Driver not found');
  }
};

export const tripService = {
  getAll: async () => {
    if (USE_REAL_API) {
      const response = await api.get('/trips');
      return response.data;
    }
    await delay();
    return getDb().trips;
  },

  create: async (tripData) => {
    if (USE_REAL_API) {
      const response = await api.post('/trips', tripData);
      return response.data;
    }
    await delay();
    const db = getDb();

    const vehicle = db.vehicles.find(v => v.id === tripData.vehicleId);
    const driver = db.drivers.find(d => d.id === tripData.driverId);

    if (!vehicle || vehicle.status !== 'Available') {
      throw new Error('Selected vehicle is not available for dispatch.');
    }
    if (!driver || driver.status !== 'Available') {
      throw new Error('Selected driver is not available for dispatch.');
    }

    // Create unique Trip ID
    const tripId = `T-${1000 + db.trips.length + 1}`;

    const newTrip = {
      id: tripId,
      route: `${tripData.source} → ${tripData.destination}`,
      vehicleId: tripData.vehicleId,
      vehicleReg: vehicle.regNumber,
      vehicleName: vehicle.name,
      driverId: tripData.driverId,
      driverName: driver.name,
      cargoWeight: Number(tripData.cargoWeight),
      status: 'Dispatched',
      eta: 'Calculating...',
      distance: Number(tripData.plannedDistance),
      startOdometer: vehicle.odometer
    };

    // Update statuses
    vehicle.status = 'OnTrip';
    driver.status = 'OnTrip';

    db.trips.push(newTrip);
    saveDb(db);
    return newTrip;
  },

  complete: async (tripId, finalOdometer, fuelConsumed) => {
    if (USE_REAL_API) {
      const response = await api.post(`/trips/${tripId}/complete`, { finalOdometer, fuelConsumed });
      return response.data;
    }
    await delay();
    const db = getDb();
    const trip = db.trips.find(t => t.id === tripId);
    if (!trip) throw new Error('Trip not found');

    const vehicle = db.vehicles.find(v => v.id === trip.vehicleId);
    const driver = db.drivers.find(d => d.id === trip.driverId);

    if (Number(finalOdometer) <= trip.startOdometer) {
      throw new Error(`Final odometer (${finalOdometer} km) must be greater than starting odometer (${trip.startOdometer} km).`);
    }

    trip.status = 'Completed';
    trip.eta = 'Completed';
    trip.endOdometer = Number(finalOdometer);
    trip.fuelConsumed = Number(fuelConsumed);
    
    // Auto-calculate travel expense (standard $0.50 per km + tolls)
    const drivenKm = Number(finalOdometer) - trip.startOdometer;
    const expenseCost = Math.round(drivenKm * 0.5);
    trip.expensesLogged = expenseCost;

    // Update vehicle odometer and status
    if (vehicle) {
      vehicle.odometer = Number(finalOdometer);
      vehicle.status = 'Available';
    }
    // Update driver status
    if (driver) {
      driver.status = 'Available';
      driver.tripCompletionPct = Math.min(100, Math.round(driver.tripCompletionPct * 1.02));
    }

    // Log Fuel Expenses auto
    const fuelCost = Math.round(Number(fuelConsumed) * 2.0); // Assume $2.0 per liter
    db.fuelLogs.push({
      id: String(db.fuelLogs.length + 1),
      date: new Date().toISOString().split('T')[0],
      vehicleReg: vehicle ? vehicle.regNumber : 'N/A',
      liters: Number(fuelConsumed),
      cost: fuelCost,
      odometer: Number(finalOdometer)
    });

    db.expenses.push({
      id: String(db.expenses.length + 1),
      date: new Date().toISOString().split('T')[0],
      vehicleReg: vehicle ? vehicle.regNumber : 'N/A',
      type: `Trip ${tripId} Expense`,
      cost: expenseCost
    });

    saveDb(db);
    return trip;
  },

  cancel: async (tripId) => {
    if (USE_REAL_API) {
      const response = await api.post(`/trips/${tripId}/cancel`);
      return response.data;
    }
    await delay();
    const db = getDb();
    const trip = db.trips.find(t => t.id === tripId);
    if (!trip) throw new Error('Trip not found');

    trip.status = 'Cancelled';
    trip.eta = 'Cancelled';

    const vehicle = db.vehicles.find(v => v.id === trip.vehicleId);
    const driver = db.drivers.find(d => d.id === trip.driverId);

    if (vehicle) vehicle.status = 'Available';
    if (driver) driver.status = 'Available';

    saveDb(db);
    return trip;
  }
};

export const maintenanceService = {
  getAll: async () => {
    if (USE_REAL_API) {
      const response = await api.get('/maintenance');
      return response.data;
    }
    await delay();
    return getDb().maintenance;
  },

  create: async (record) => {
    if (USE_REAL_API) {
      const response = await api.post('/maintenance', record);
      return response.data;
    }
    await delay();
    const db = getDb();

    const newRecord = {
      id: String(db.maintenance.length + 1),
      ...record,
      cost: Number(record.cost),
      status: record.status || 'In Progress'
    };

    // Update vehicle status to InShop if maintenance is "In Progress"
    const vehicle = db.vehicles.find(v => v.regNumber === record.vehicleReg);
    if (vehicle) {
      if (newRecord.status === 'In Progress') {
        vehicle.status = 'InShop';
      } else if (newRecord.status === 'Completed') {
        vehicle.status = 'Available';
      }
    }

    db.maintenance.push(newRecord);
    saveDb(db);
    return newRecord;
  }
};

export const expenseService = {
  getFuelLogs: async () => {
    if (USE_REAL_API) {
      const response = await api.get('/expenses/fuel');
      return response.data;
    }
    await delay();
    return getDb().fuelLogs;
  },

  createFuelLog: async (log) => {
    if (USE_REAL_API) {
      const response = await api.post('/expenses/fuel', log);
      return response.data;
    }
    await delay();
    const db = getDb();
    const newLog = {
      id: String(db.fuelLogs.length + 1),
      ...log,
      liters: Number(log.liters),
      cost: Number(log.cost),
      odometer: Number(log.odometer)
    };

    // Update vehicle odometer
    const vehicle = db.vehicles.find(v => v.regNumber === log.vehicleReg);
    if (vehicle && Number(log.odometer) > vehicle.odometer) {
      vehicle.odometer = Number(log.odometer);
    }

    db.fuelLogs.push(newLog);
    saveDb(db);
    return newLog;
  },

  getExpenses: async () => {
    if (USE_REAL_API) {
      const response = await api.get('/expenses/other');
      return response.data;
    }
    await delay();
    return getDb().expenses;
  },

  createExpense: async (expense) => {
    if (USE_REAL_API) {
      const response = await api.post('/expenses/other', expense);
      return response.data;
    }
    await delay();
    const db = getDb();
    const newExpense = {
      id: String(db.expenses.length + 1),
      ...expense,
      cost: Number(expense.cost)
    };
    db.expenses.push(newExpense);
    saveDb(db);
    return newExpense;
  }
};

export const dashboardService = {
  getSummary: async () => {
    if (USE_REAL_API) {
      const response = await api.get('/dashboard/summary');
      return response.data;
    }
    
    // Low latency for fast polling dashboard updates
    await delay(100);
    const db = getDb();

    const activeVehicles = db.vehicles.filter(v => v.status === 'OnTrip').length;
    const availableVehicles = db.vehicles.filter(v => v.status === 'Available').length;
    const inShopVehicles = db.vehicles.filter(v => v.status === 'InShop').length;
    const retiredVehicles = db.vehicles.filter(v => v.status === 'Retired').length;
    const totalFleet = db.vehicles.length;

    const activeTrips = db.trips.filter(t => t.status === 'Dispatched').length;
    const pendingTrips = db.trips.filter(t => t.status === 'Draft').length;
    const driversOnDuty = db.drivers.filter(d => d.status === 'Available' || d.status === 'OnTrip').length;

    // Calculation for fleet utilization: (OnTrip + InShop) / (Total - Retired)
    const operationalCount = totalFleet - retiredVehicles;
    const fleetUtilization = operationalCount > 0 
      ? Math.round(((activeVehicles + inShopVehicles) / operationalCount) * 100) 
      : 0;

    // Status breakdown proportions for stacked horizontal bar chart
    const totalVehiclesCount = db.vehicles.length || 1;
    const statusProportions = [
      { name: 'Available', value: availableVehicles, percentage: Math.round((availableVehicles / totalVehiclesCount) * 100), color: '#22c55e' },
      { name: 'On Trip', value: activeVehicles, percentage: Math.round((activeVehicles / totalVehiclesCount) * 100), color: '#3b82f6' },
      { name: 'In Shop', value: inShopVehicles, percentage: Math.round((inShopVehicles / totalVehiclesCount) * 100), color: '#f97316' },
      { name: 'Retired', value: retiredVehicles, percentage: Math.round((retiredVehicles / totalVehiclesCount) * 100), color: '#ef4444' },
    ];

    // Sorted recent trips
    const sortedTrips = [...db.trips]
      .sort((a, b) => b.id.localeCompare(a.id))
      .slice(0, 5);

    return {
      kpis: {
        activeVehicles,
        availableVehicles,
        inShopVehicles,
        activeTrips,
        pendingTrips,
        driversOnDuty,
        fleetUtilization
      },
      recentTrips: sortedTrips,
      statusBreakdown: statusProportions
    };
  }
};

export const analyticsService = {
  getReport: async () => {
    if (USE_REAL_API) {
      const response = await api.get('/analytics/report');
      return response.data;
    }
    await delay();
    const db = getDb();

    // 1. Calculate Fuel Efficiency (total driven distance / total fuel consumed)
    // For completed trips
    const completedTrips = db.trips.filter(t => t.status === 'Completed');
    const totalDist = completedTrips.reduce((acc, t) => acc + (t.endOdometer - t.startOdometer), 0);
    const totalFuel = db.fuelLogs.reduce((acc, f) => acc + f.liters, 0) || 1;
    const fuelEfficiency = totalDist > 0 ? (totalDist / totalFuel).toFixed(1) : "5.4"; // km/L

    // 2. Fleet utilization
    const activeVeh = db.vehicles.filter(v => v.status === 'OnTrip').length;
    const inShop = db.vehicles.filter(v => v.status === 'InShop').length;
    const totalActive = db.vehicles.filter(v => v.status !== 'Retired').length || 1;
    const fleetUtilization = Math.round(((activeVeh + inShop) / totalActive) * 100);

    // 3. Operational cost (Maintenance + Fuel + Expenses)
    const maintCost = db.maintenance.reduce((acc, m) => acc + m.cost, 0);
    const fuelCost = db.fuelLogs.reduce((acc, f) => acc + f.cost, 0);
    const otherCost = db.expenses.reduce((acc, e) => acc + e.cost, 0);
    const operationalCost = maintCost + fuelCost + otherCost;

    // 4. Vehicle ROI % = (Total Revenue - Acq Cost) / Acq Cost * 100
    // Mock revenue = ($1.8 per km driven)
    const mockRevenue = completedTrips.reduce((acc, t) => acc + (t.endOdometer - t.startOdometer) * 1.8, 0);
    const totalAcqCost = db.vehicles.reduce((acc, v) => acc + v.acquisitionCost, 0) || 1;
    const roi = totalAcqCost > 0 ? (((mockRevenue - operationalCost) / totalAcqCost) * 100).toFixed(1) : "12.4";

    // 5. Monthly Revenue Chart (Recharts)
    const monthlyRevenue = [
      { name: 'Jan', Revenue: 18500, Costs: 8200 },
      { name: 'Feb', Revenue: 22000, Costs: 9500 },
      { name: 'Mar', Revenue: 21200, Costs: 11000 },
      { name: 'Apr', Revenue: 26800, Costs: 13200 },
      { name: 'May', Revenue: 29000, Costs: 14000 },
      { name: 'Jun', Revenue: 34500, Costs: 16500 },
      { name: 'Jul', Revenue: Math.round(mockRevenue) || 12000, Costs: operationalCost || 6000 },
    ];

    // 6. Top Costliest Vehicles list (Group expenses + maintenance + fuel by vehicle reg)
    const vehicleCostMap = {};
    db.vehicles.forEach(v => {
      vehicleCostMap[v.regNumber] = {
        regNumber: v.regNumber,
        name: v.name,
        maintenance: 0,
        fuel: 0,
        other: 0,
        total: 0
      };
    });

    db.maintenance.forEach(m => {
      if (vehicleCostMap[m.vehicleReg]) {
        vehicleCostMap[m.vehicleReg].maintenance += m.cost;
      }
    });

    db.fuelLogs.forEach(f => {
      if (vehicleCostMap[f.vehicleReg]) {
        vehicleCostMap[f.vehicleReg].fuel += f.cost;
      }
    });

    db.expenses.forEach(e => {
      if (vehicleCostMap[e.vehicleReg]) {
        vehicleCostMap[e.vehicleReg].other += e.cost;
      }
    });

    const costliestVehicles = Object.values(vehicleCostMap)
      .map(v => {
        v.total = v.maintenance + v.fuel + v.other;
        return v;
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      kpis: {
        fuelEfficiency,
        fleetUtilization,
        operationalCost,
        roi
      },
      monthlyRevenue,
      costliestVehicles
    };
  }
};
