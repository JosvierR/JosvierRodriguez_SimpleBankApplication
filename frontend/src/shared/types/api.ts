export type Role = 'CUSTOMER' | 'TELLER' | 'MANAGER' | 'AUDITOR' | 'ADMIN';
export type AccountType = 'CHECKING' | 'SAVINGS';
export type TransactionType = 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER_OUT' | 'TRANSFER_IN';

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  username: string;
  roles: Role[];
}

export interface VerifyResponse {
  username: string;
  primaryRole: Role;
  bankUserLinked: boolean;
  roles: Role[];
}

export interface LoginRequest {
  username: string;
  password: string;
}
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
}
export type UpdateUserRequest = CreateUserRequest;

export interface AccountResponse {
  accountId: string;
  userId: string;
  userName: string;
  accountType: AccountType;
  balance: number;
  createdAt: string;
  accountNumber?: string | null;
}

export interface CreateAccountRequest {
  userId: string;
  accountType: AccountType;
}
export interface UpdateAccountRequest {
  accountType: AccountType;
}

export interface TransactionResponse {
  transactionId: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  createdAt: string;
  transferReference?: string | null;
  counterpartyAccountNumberMasked?: string | null;
  counterpartyDisplayName?: string | null;
}

export interface TransferRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
}

export interface TransferResponse {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  fromBalance: number;
  toBalance: number;
  auditId: string;
  createdAt: string;
}

export interface AuditResponse {
  id: string;
  action: string;
  userId: string;
  userName: string;
  accountIds: string[];
  involvedUserIds: string[];
  amount: number;
  transactionIds: string[];
  createdAt: string;
  actorAuthUserId: string | null;
  actorUsername: string | null;
}

export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  code?: string;
}

export interface WhoAmIResponse {
  username: string;
  roles: Role[];
}

export interface CustomerProfileResponse {
  name: string;
  email: string;
  createdAt: string;
}

export interface CustomerMeResponse {
  username: string;
  role: 'CUSTOMER';
  bankUserLinked: boolean;
  profile: CustomerProfileResponse | null;
}

export interface CustomerAccountResponse {
  accountId: string;
  accountType: AccountType;
  balance: number;
  createdAt: string;
  accountNumber?: string | null;
}

export interface CustomerTransactionResponse {
  transactionId: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  createdAt: string;
  transferReference?: string | null;
  counterpartyAccountNumberMasked?: string | null;
  counterpartyDisplayName?: string | null;
}

export interface CustomerTransferRequest {
  sourceAccountId: string;
  destinationAccountNumber: string;
  amount: number;
}

export interface TransferPreviewResponse {
  sourceAccountNumberMasked: string;
  sourceBalance: number;
  destinationAccountNumberMasked: string;
  destinationDisplayName: string;
  amount: number;
  ownTransfer: boolean;
}

export interface CustomerTransferReceiptResponse {
  transferReference: string;
  amount: number;
  sourceAccountNumberMasked: string;
  destinationAccountNumberMasked: string;
  destinationDisplayName: string;
  sourceBalance: number;
  createdAt: string;
}

export interface AdminAuthUserResponse {
  id: string;
  username: string;
  email: string;
  role: Role;
  bankUserId: string | null;
  bankUserName: string | null;
  enabled: boolean;
  createdAt: string;
}

export type SecurityAuditAction =
  'ROLE_CHANGED' | 'AUTH_USER_ENABLED' | 'AUTH_USER_DISABLED' | 'CUSTOMER_LINKED' | 'CUSTOMER_UNLINKED' | 'ADMIN_BOOTSTRAPPED';

export interface SecurityAuditResponse {
  id: string;
  actorUsername: string;
  targetAuthUserId: string;
  action: SecurityAuditAction;
  previousValue: string | null;
  newValue: string | null;
  createdAt: string;
}
