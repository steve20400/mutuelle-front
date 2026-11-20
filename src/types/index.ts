// ─── Enums ────────────────────────────────────────────────────────────────────

export type BackendRole = 'SUPER_ADMIN' | 'ADMIN' | 'PRESIDENT' | 'TRESORIER' | 'MEMBER';
export type FrontendRole = 'SUPER_ADMIN' | 'SECRETAIRE' | 'PRESIDENT' | 'TRESORIER' | 'MEMBRE';
export type EntityStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type MutuelleStatus = 'ACTIF' | 'INSOLVABLE' | 'INACTIF';
export type TransactionType =
  | 'INSCRIPTION'
  | 'EPARGNE'
  | 'SOLIDARITE'
  | 'EMPRUNT'
  | 'REMBOURSSEMENT'
  | 'RENFOULEMENT'
  | 'RENFOULEMENT_INSCRIPTION'
  | 'RENFOULEMENT_SOLIDARITE'
  | 'INTERET'
  | 'ASSISTANCE'
  | 'AGAPE'
  | 'PENALITE';
export type TransactionDirection = 'CREDIT' | 'DEBIT';

// ─── API wrapper ───────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
  code: number;
  totalElements?: number;
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
  timestamp: string;
}

export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ProfileDTO {
  id: number;
  firstname: string;
  lastname: string;
  phone: string | null;
  avatar: string | null;
  pin: string | null;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

export interface LoginResponseDto {
  authId: number;
  role: BackendRole;
  userRefId: number;
  accessToken: string;
  refreshToken: string;
  email: string;
  profile: ProfileDTO | null;
}

export interface RefreshResponseDto {
  accessToken: string;
}

export interface JWTPayload {
  sub: string;
  userId: number;
  type: BackendRole;
  refId: number;
  iat: number;
  exp: number;
}

// ─── Member ───────────────────────────────────────────────────────────────────

export interface MemberResponseDTO {
  authId: number;
  id: number;
  firstname: string;
  lastname: string;
  phone: string | null;
  email: string;
  avatar: string | null;
  role: BackendRole;
  isActive: boolean;
  unpaidRegistrationAmount: number;
  baseRegistrationAmount: number;
  solidarityAmount: number;
  borrowAmount: number;
  unpaidRenfoulement: number;
  savingAmount: number;
  idAccount: number;
  pin: string | null;
  status: MutuelleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MemberRegisterDTO {
  firstname: string;
  lastname: string;
  phone: string;
  email: string;
  password: string;
}

export interface MemberUpdateDTO {
  firstname?: string;
  lastname?: string;
  phone?: string;
}

export interface MemberStatusUpdateDTO {
  active: boolean;
}

export interface MemberMutuelleStatusUpdateDTO {
  status: MutuelleStatus;
}

// ─── Admin profile ─────────────────────────────────────────────────────────────

export interface AdminProfileDTO {
  id: number;
  firstname: string;
  lastname: string;
  phone: string | null;
  avatar: string | null;
  pin: string | null;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

// ─── Session ──────────────────────────────────────────────────────────────────

export interface SessionResponseDTO {
  id: number;
  name: string;
  startDate: string;
  endDate: string | null;
  agapeAmountPerMember: number;
  status: EntityStatus;
  exerciceId: number;
  exerciceName: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionRequestDTO {
  name: string;
  agapeAmountPerMember: number;
  exerciceId: number;
}

export interface UpdateSessionRequestDTO {
  name: string;
  agapeAmountPerMember: number;
}

// ─── Exercice ─────────────────────────────────────────────────────────────────

export interface ExerciceResponseDTO {
  id: number;
  name: string;
  startDate: string;
  status: EntityStatus;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExerciceRequestDTO {
  name: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

export interface MutuelleConfig {
  id: number;
  registrationFeeAmount: number;
  solidarityFeeAmount: number;
  loanInterestRatePercent: number;
  loanPenaltyFixedAmount: number;
  loanPenaltySessionThreshold: number;
  insolvencyThreshold: number;
  updatedAt: string;
  updatedBy: string;
}

export interface ConfigMutuelleRequestDto {
  registrationFeeAmount?: number;
  solidarityFeeAmount?: number;
  loanInterestRatePercent?: number;
  loanPenaltyFixedAmount?: number;
  loanPenaltySessionThreshold?: number;
  insolvencyThreshold?: number;
}

// ─── Assistance ───────────────────────────────────────────────────────────────

export interface TypeAssistanceResponseDto {
  id: number;
  name: string;
  amount: number;
  description: string;
}

export interface AssistanceResponseDto {
  id: number;
  description: string;
  typeAssistanceId: number;
  typeAssistanceName: string;
  typeAssistanceAmount: number;
  memberId: number;
  memberFullName: string;
  sessionId: number;
  sessionName: string;
  transaction: TransactionResponseDTO | null;
  amountMove: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssistanceDto {
  typeAssistanceId: number;
  sessionId: number;
  memberId: number;
  description?: string;
}

// ─── Transaction ──────────────────────────────────────────────────────────────

export interface TransactionResponseDTO {
  id: number;
  amount: number;
  transactionType: TransactionType;
  transactionDirection: TransactionDirection;
  accountMemberId: number;
  memberFullName: string;
  sessionId: number;
  createdAt: string;
  updatedAt: string;
  children?: TransactionResponseDTO[];
}

// ─── Epargne ─────────────────────────────────────────────────────────────────

export interface EpargneRequestDto {
  memberId: number;
  amount: number;
  transactionDirection: TransactionDirection;
}

// ─── Emprunt ─────────────────────────────────────────────────────────────────

export interface EmpruntRequestDTO {
  memberId: number;
  amount: number;
}

export interface RemboursementRequestDTO {
  memberId: number;
  amount: number;
}

// ─── Solidarite ───────────────────────────────────────────────────────────────

export interface PaiementRequest {
  membreId: number;
  montant: number;
  sessionId: number;
}

// ─── Contribution ─────────────────────────────────────────────────────────────

export interface ContributionPaymentRequestDto {
  memberId: number;
  amount: number;
  contributionType: TransactionType;
}

export interface ContributionPaymentResponseDto {
  transactionId: number;
  memberId: number;
  memberFullName: string;
  amountPaid: number;
  contributionType: TransactionType;
  direction: TransactionDirection;
  remainingUnpaidAmount: number;
  paymentDate: string;
  message: string;
}

// ─── Renfoulement ─────────────────────────────────────────────────────────────

export interface RenfoulementSimulationDto {
  exerciceName: string;
  estimatedTotalToDistributeAmount: number;
  estimatedBaseMembersCount: number;
  estimatedUnitAmount: number;
  estimatedDistributedMembersCount: number;
  estimatedExpectedTotalAmount: number;
  isPossible: boolean;
  message: string;
}

export interface RenfoulementHistoryItemDto {
  id: number;
  exerciceName: string;
  calculatedAt: string;
  unitAmount: number;
  baseMembersCount: number;
  distributedMembersCount: number;
  totalToDistributeAmount: number;
  expectedTotalAmount: number;
}

export interface RenfoulementHistoryResponseDto {
  pastRenfoulements: RenfoulementHistoryItemDto[];
  currentSimulation: RenfoulementSimulationDto | null;
  accountMembers: AccountMemberFullDTO[];
}

// ─── Bilan ────────────────────────────────────────────────────────────────────

export interface MemberSessionBilanDTO {
  id: number;
  memberId: number;
  memberFirstname: string;
  memberLastname: string;
  sessionId: number;
  sessionName: string;
  exerciceName: string;
  sessionStartDate: string;
  sessionEndDate: string | null;
  createdAt: string;
  solidaritePaid: number;
  epargneDeposited: number;
  registrationPaid: number;
  renfoulementPaid: number;
  remboursementAmount: number;
  epargneWithdrawn: number;
  empruntAmount: number;
  interetAmount: number;
  assistanceReceived: number;
  agapeShare: number;
  totalVerse: number;
  totalRecu: number;
  netSession: number;
  snapshotSavingAmount: number;
  snapshotBorrowAmount: number;
  snapshotUnpaidSolidarity: number;
  snapshotUnpaidRegistration: number;
  snapshotUnpaidRenfoulement: number;
}

export interface MemberExerciceBilanDTO {
  id: number;
  memberId: number;
  memberFirstname: string;
  memberLastname: string;
  exerciceId: number;
  exerciceName: string;
  exerciceStartDate: string;
  exerciceEndDate: string | null;
  sessionsCount: number;
  createdAt: string;
  totalSolidaritePaid: number;
  totalEpargneDeposited: number;
  totalRegistrationPaid: number;
  totalRenfoulementPaid: number;
  totalRemboursementAmount: number;
  totalEpargneWithdrawn: number;
  totalEmpruntAmount: number;
  totalInteretAmount: number;
  totalAssistanceReceived: number;
  totalAgapeShare: number;
  renfoulementDistributed: number;
  totalVerse: number;
  totalRecu: number;
  netExercice: number;
  snapshotSavingAmount: number;
  snapshotBorrowAmount: number;
  snapshotUnpaidSolidarity: number;
  snapshotUnpaidRegistration: number;
  snapshotUnpaidRenfoulement: number;
}

export interface SessionHistoryResponseDTO {
  id: number;
  sessionId: number;
  sessionName: string;
  exerciceName: string;
  sessionStartDate: string;
  sessionEndDate: string | null;
  createdAt: string;
  totalAssistanceAmount: number;
  totalAssistanceCount: number;
  agapeAmount: number;
  totalSolidarityCollected: number;
  totalSolidarityCount: number;
  totalEpargneDeposited: number;
  totalEpargneWithdrawn: number;
  totalEmpruntAmount: number;
  totalRemboursementAmount: number;
  totalInteretAmount: number;
  totalRenfoulementCollected: number;
  totalRegistrationCollected: number;
  mutuelleCash: number;
  mutuellesSavingAmount: number;
  mutuelleSolidarityAmount: number;
  mutuelleRegistrationAmount: number;
  mutuelleBorrowAmount: number;
  totalTransactions: number;
  activeMembersCount: number;
}

export interface MutuelleExerciceBilanDTO {
  id: number;
  exerciceId: number;
  exerciceName: string;
  exerciceStartDate: string;
  exerciceEndDate: string | null;
  createdAt: string;
  sessionsCount: number;
  totalAssistanceAmount: number;
  totalAssistanceCount: number;
  totalAgapeAmount: number;
  totalSolidarityCollected: number;
  totalEpargneDeposited: number;
  totalEpargneWithdrawn: number;
  totalEmpruntAmount: number;
  totalRemboursementAmount: number;
  totalInteretAmount: number;
  totalRenfoulementCollected: number;
  totalRegistrationCollected: number;
  mutuelleCash: number;
  mutuelleSavingAmount: number;
  mutuelleSolidarityAmount: number;
  mutuelleRegistrationAmount: number;
  mutuelleBorrowAmount: number;
  totalTransactions: number;
  activeMembersCount: number;
}

// ─── Account ──────────────────────────────────────────────────────────────────

export interface AccountMutuelle {
  id: number;
  savingAmount: number;
  solidarityAmount: number;
  registrationAmount: number;
  borrowAmount: number;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

export interface AccountMemberDTO {
  id: number;
  memberId: number;
  savingAmount: number;
  unpaidRegistrationAmount: number;
  baseRegistrationAmount: number;
  solidarityAmount: number;
  borrowAmount: number;
  unpaidRenfoulement: number;
  lastInterestDate: string | null;
  unpaidSolidarityAmount: number;
  maxBorrow: number;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

export interface AccountMemberFullDTO {
  id: number;
  memberId: number;
  savingAmount: number;
  unpaidRegistrationAmount: number;
  solidarityAmount: number;
  borrowAmount: number;
  unpaidRenfoulement: number;
  lastInterestDate: string | null;
  unpaidSolidarityAmount: number;
  maxBorrow: number;
  profile: MemberProfileDTO | null;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

export interface MemberProfileDTO {
  id: number;
  firstname: string;
  lastname: string;
  phone: string | null;
  avatar: string | null;
  pin: string | null;
  createdAt: string;
  updatedAt: string;
  account: AccountMemberDTO | null;
  active: boolean;
}

// ─── Borrowing ceiling ────────────────────────────────────────────────────────

export interface BorrowingCeilingInterval {
  id: number;
  minEpargne: number;
  maxEpargne: number | null;
  multiplier: number;
  maxPlafond: number | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Context ──────────────────────────────────────────────────────────────────

export interface CurrentContextResponseDTO {
  currentSession: SessionResponseDTO | null;
  currentExercice: ExerciceResponseDTO | null;
  config: MutuelleConfig | null;
  typeAssistance: TypeAssistanceResponseDto[];
  borrowingCeilingIntervals: BorrowingCeilingInterval[];
  authenticated: boolean;
  email: string;
  authUserId: number;
  role: BackendRole;
  userRefId: number;
  memberProfile: MemberResponseDTO | null;
  adminProfile: AdminProfileDTO | null;
  memberTotalAssistances: number | null;
  memberTotalTransactions: number | null;
  globalTotalAssistances: number;
  globalTotalTransactions: number;
  globalTotalAssistanceAmount: number;
  accountMutuelle: AccountMutuelle | null;
  member: boolean;
  admin: boolean;
  totalMembers: number;
}

// ─── Push notification ────────────────────────────────────────────────────────

export interface PushTokenDto {
  token: string;
}
