/**
 * Solar Energy Sharing Platform - Type Definitions
 * All TypeScript types for the application
 */

// ============================================================
// USER & AUTHENTICATION TYPES
// ============================================================

export type UserRole = 'host' | 'buyer' | 'investor' | 'admin';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HostProfile extends User {
  hostDetails: {
    panelCapacity: number; // kW
    batteryCapacity: number; // kWh
    installationDate: string;
    panelBrand?: string;
    latitude: number;
    longitude: number;
    isVerified: boolean;
    rating: number;
    totalEnergyShared: number; // kWh
    totalEarnings: number; // ₹
  };
}

export interface BuyerProfile extends User {
  buyerDetails: {
    averageConsumption: number; // kWh per month
    allocatedHosts: string[];
    totalEnergyBought: number; // kWh
    totalSpending: number; // ₹
  };
}

export interface InvestorProfile extends User {
  investorDetails: {
    totalInvested: number; // ₹
    totalReturns: number; // ₹
    activeInvestments: number;
    portfolioValue: number; // ₹
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  role: UserRole;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ============================================================
// IoT & ENERGY DATA TYPES
// ============================================================

export interface EnergyReading {
  id: string;
  userId: string;
  deviceId: string;
  timestamp: string;
  power: number; // kW (instantaneous)
  voltage: number; // V
  current: number; // A
  batterySoc: number; // % (State of Charge)
  temperature?: number; // °C
  frequency?: number; // Hz
  // Additional fields for calculations
  powerOutput?: number; // kW (alias for power in some contexts)
  powerConsumed?: number; // kW
  efficiency?: number; // %
  batteryLevel?: number; // % (alias for batterySoc)
  gridExport?: number; // kW
  gridImport?: number; // kW
}

export interface DailyEnergySummary {
  date: string;
  totalGeneration: number; // kWh
  totalConsumption: number; // kWh
  totalShared: number; // kWh
  totalFromGrid: number; // kWh
  peakPower: number; // kW
  peakTime: string;
  averagePower: number; // kW
  selfConsumption: number; // kWh
  selfConsumptionPercentage: number; // %
}

export interface DeviceInfo {
  deviceId: string;
  deviceType: 'solar_panel' | 'inverter' | 'battery' | 'meter' | 'sensor';
  location: string;
  capacity: number;
  status: 'online' | 'offline' | 'warning' | 'error';
  lastSeen: string;
  firmwareVersion?: string;
}

export interface EnergyChartData {
  time: string;
  generation: number;
  consumption: number;
  shared: number;
  fromGrid: number;
}

// ============================================================
// WALLET & TRANSACTION TYPES
// ============================================================

export interface Wallet {
  userId: string;
  balance: number; // ₹
  pendingBalance: number; // ₹ (under processing)
  totalEarned: number; // ₹
  totalSpent: number; // ₹
  lastUpdated: string;
}

export type TransactionType =
  | 'energy_sale'
  | 'energy_purchase'
  | 'wallet_topup'
  | 'withdrawal'
  | 'refund'
  | 'investment'
  | 'investment_return'
  | 'platform_fee';

export type TransactionStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  description: string;
  reference?: string;
  counterpartyId?: string;
  counterpartyName?: string;
  energyAmount?: number; // kWh (for energy transactions)
  createdAt: string;
  completedAt?: string;
}

export interface TopupRequest {
  amount: number;
  paymentMethod: 'razorpay' | 'upi' | 'card' | 'netbanking';
}

export interface WithdrawalRequest {
  amount: number;
  bankAccount: string;
  ifscCode: string;
}

// ============================================================
// ALLOCATION TYPES
// ============================================================

export interface EnergyAllocation {
  id: string;
  hostId: string;
  buyerId: string;
  allocatedCapacity: number; // kW
  pricePerKwh: number; // ₹
  startDate: string;
  endDate?: string;
  status: 'active' | 'paused' | 'terminated';
  totalEnergyDelivered: number; // kWh
  totalAmountPaid: number; // ₹
}

export interface AvailableHost {
  hostId: string;
  hostName: string;
  availableCapacity: number; // kW
  pricePerKwh: number; // ₹
  rating: number;
  distance: number; // km
  location: {
    city: string;
    state: string;
  };
  panelDetails: {
    capacity: number; // kW
    brand?: string;
    installationDate: string;
  };
}

// ============================================================
// INVESTMENT TYPES
// ============================================================

export interface Investment {
  id: string;
  investorId: string;
  hostId: string;
  amount: number; // ₹
  sharePercentage: number; // % of host's earnings
  status: 'active' | 'matured' | 'withdrawn';
  expectedReturn: number; // ₹
  actualReturn: number; // ₹
  startDate: string;
  maturityDate: string;
}

// ============================================================
// NOTIFICATION TYPES
// ============================================================

export type NotificationType =
  | 'transaction'
  | 'energy'
  | 'system'
  | 'alert'
  | 'promotion';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface ApiError {
  success: false;
  statusCode: number;
  error: string;
  message: string;
  details?: Array<{
    path: string;
    message: string;
  }>;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  timestamp: string;
}

// ============================================================
// NAVIGATION TYPES
// ============================================================

export type RootStackParamList = {
  // Auth Stack
  Onboarding: undefined;
  RoleSelection: undefined;
  Login: undefined;
  Register: { role: UserRole };
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  VerifyEmail: { token?: string };
  ProfileSetup: { role: UserRole };

  // Main App
  MainTabs: undefined;
  HostDashboard: undefined;
  BuyerDashboard: undefined;
  InvestorDashboard: undefined;

  // Wallet
  Wallet: undefined;
  TopUp: undefined;
  Withdraw: undefined;
  TransactionDetails: { transactionId: string };
  TransactionHistory: undefined;

  // Energy
  EnergyDetails: undefined;
  LiveMonitoring: undefined;
  EnergyHistory: undefined;

  // Profile
  Profile: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Notifications: undefined;
  DeviceManagement: undefined;

  // Host specific
  MyBuyers: undefined;
  ShareSettings: undefined;

  // Buyer specific
  AvailableHosts: undefined;
  HostDetails: { hostId: string };
  AllocateEnergy: { hostId: string };
  MyAllocations: undefined;

  // Investor specific
  InvestmentOpportunities: undefined;
  MyInvestments: undefined;
  InvestmentDetails: { investmentId: string };
};

// ============================================================
// APP STATE TYPES
// ============================================================

export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  theme: 'light' | 'dark' | 'system';
  notifications: Notification[];
  unreadCount: number;
}

export interface EnergyState {
  currentReading: EnergyReading | null;
  todaySummary: DailyEnergySummary | null;
  chartData: EnergyChartData[];
  devices: DeviceInfo[];
  isLive: boolean;
  lastUpdated: string | null;
}

export interface WalletState {
  wallet: Wallet | null;
  recentTransactions: Transaction[];
  isLoading: boolean;
  error: string | null;
}
