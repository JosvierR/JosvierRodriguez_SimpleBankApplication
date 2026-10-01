import type { AccountType, Role, SecurityAuditAction } from '@/shared/types/api';

export type BankingAction = 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER';

export interface DashboardActivityPoint {
  periodStart: string;
  deposits: number;
  withdrawals: number;
  transfers: number;
}

export interface DashboardAccountSummary {
  accountId: string;
  accountType: AccountType;
  balance: number;
  createdAt: string;
  accountNumber?: string | null;
}

export interface DashboardCustomerTransaction {
  type: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER_OUT' | 'TRANSFER_IN';
  accountSuffix: string;
  amount: number;
  createdAt: string;
  counterpartyDisplayName?: string | null;
  counterpartyAccountNumberMasked?: string | null;
}

export interface DashboardBankingActivity {
  action: BankingAction;
  customerName: string;
  actorUsername: string | null;
  accountSuffixes: string[];
  amount: number;
  createdAt: string;
}

export interface DashboardSecurityActivity {
  action: SecurityAuditAction;
  actorUsername: string;
  targetUsername: string;
  createdAt: string;
}

interface DashboardBase {
  role: Role;
  generatedAt: string;
}

export interface CustomerDashboardData extends DashboardBase {
  role: 'CUSTOMER';
  bankUserLinked: boolean;
  displayName: string;
  totalBalance: number;
  accountCount: number;
  accounts: DashboardAccountSummary[];
  last30DayDeposits: number;
  last30DayWithdrawals: number;
  last30DayTransfersIn: number;
  last30DayTransfersOut: number;
  activitySeries: DashboardActivityPoint[];
  recentTransactions: DashboardCustomerTransaction[];
}

export interface TellerDashboardData extends DashboardBase {
  role: 'TELLER';
  username: string;
  customerCount: number;
  accountCount: number;
  newAccountsToday: number;
  myOperationsToday: number;
  myDepositsTodayAmount: number;
  myWithdrawalsTodayAmount: number;
  myRecentOperations: DashboardBankingActivity[];
}

export interface ManagerDashboardData extends DashboardBase {
  role: 'MANAGER';
  customerCount: number;
  accountCount: number;
  totalBankBalance: number;
  checkingCount: number;
  savingsCount: number;
  premiumAccountCount: number;
  last30DayDepositVolume: number;
  last30DayWithdrawalVolume: number;
  last30DayTransferVolume: number;
  moneyMovementSeries: DashboardActivityPoint[];
  recentBankingAudits: DashboardBankingActivity[];
}

export interface AuditorDashboardData extends DashboardBase {
  role: 'AUDITOR';
  customerCount: number;
  accountCount: number;
  auditRecordsLast30Days: number;
  distinctActorsLast30Days: number;
  depositAuditCount: number;
  withdrawAuditCount: number;
  transferAuditCount: number;
  recentBankingAudits: DashboardBankingActivity[];
}

export interface DashboardRoleCount {
  role: Role;
  count: number;
}

export interface AdminDashboardData extends DashboardBase {
  role: 'ADMIN';
  activeAuthUsers: number;
  disabledAuthUsers: number;
  roleDistribution: DashboardRoleCount[];
  linkedCustomerIdentities: number;
  unlinkedCustomerIdentities: number;
  customerCount: number;
  accountCount: number;
  recentSecurityAudits: DashboardSecurityActivity[];
  recentBankingAudits: DashboardBankingActivity[];
}

export type RoleDashboardData =
  CustomerDashboardData | TellerDashboardData | ManagerDashboardData | AuditorDashboardData | AdminDashboardData;
