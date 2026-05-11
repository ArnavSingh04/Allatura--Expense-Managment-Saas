import type {Money} from '@/lib/money';

export type ProjectStatus =|'Planning'|'Active'|'OnHold'|'Completed'|'Archived';

export const PROJECT_STATUSES: ProjectStatus[] = [
  'Planning',
  'Active',
  'OnHold',
  'Completed',
  'Archived',
];

export type DepartmentType =|'Sitework'|'Structural'|'Framing'|'Roofing'|
    'Electrical'|'Plumbing'|'HVAC'|'Flooring'|'Tiling'|'Painting'|'Cabinetry'|
    'Furnishing'|'Landscaping'|'Other';

export const DEPARTMENT_TYPES: DepartmentType[] = [
  'Sitework',
  'Structural',
  'Framing',
  'Roofing',
  'Electrical',
  'Plumbing',
  'HVAC',
  'Flooring',
  'Tiling',
  'Painting',
  'Cabinetry',
  'Furnishing',
  'Landscaping',
  'Other',
];

export type Department = {
  _id: string; type: DepartmentType; name: string; budget: Money;
  percentComplete: number;
  costCode: string;
};

export type Project = {
  _id: string;
  id?: string; tenantId: string; code: string; name: string; client: string;
  siteAddress: string;
  status: ProjectStatus;
  startDate: string;
  plannedEndDate: string;
  actualEndDate: string | null;
  budget: Money;
  contingency: Money;
  projectManagerId: string;
  departments: Department[];
  createdAt?: string;
  updatedAt?: string;
};

export type ContractStatus =
    |'Draft'|'Issued'|'Signed'|'Active'|'OnHold'|'Completed'|'Terminated';
export const CONTRACT_STATUSES: ContractStatus[] = [
  'Draft',
  'Issued',
  'Signed',
  'Active',
  'OnHold',
  'Completed',
  'Terminated',
];

export type PaymentMilestoneStatus =|'Pending'|'Claimed'|'Certified'|'Paid';
export const MILESTONE_STATUSES: PaymentMilestoneStatus[] = [
  'Pending',
  'Claimed',
  'Certified',
  'Paid',
];

export type PaymentMilestone = {
  _id: string; name: string; percentOfContract: number; amount: Money;
  dueDate: string | null;
  status: PaymentMilestoneStatus;
};

export type Contract = {
  _id: string; tenantId: string; projectId: string; departmentId: string;
  subcontractorId: string;
  reference: string;
  scope: string;
  status: ContractStatus;
  originalValue: Money;
  currentValue: Money;
  retentionPercent: number;
  retentionReleaseHalfAtPC: number;
  signedAt: string | null;
  startDate: string | null;
  plannedCompletionDate: string | null;
  paymentMilestones: PaymentMilestone[];
  createdAt?: string;
  updatedAt?: string;
};

export type VariationStatus =
    |'Draft'|'Pending'|'Approved'|'Rejected'|'Cancelled';
export const VARIATION_STATUSES: VariationStatus[] = [
  'Draft',
  'Pending',
  'Approved',
  'Rejected',
  'Cancelled',
];

export type VariationReason =
    |'ClientRequest'|'SiteCondition'|'DesignChange'|'CodeCompliance'|'Other';
export const VARIATION_REASONS: VariationReason[] = [
  'ClientRequest',
  'SiteCondition',
  'DesignChange',
  'CodeCompliance',
  'Other',
];

/** List/detail APIs may populate this ref with `{ _id, name, code }`. */
export type VariationProjectRef = string|{
  _id: string;
  name?: string;
  code?: string
};

export function resolveMongoRefId(ref: VariationProjectRef|null|undefined):
    string {
  if (ref == null) return '';
  if (typeof ref === 'string') return ref;
  if (typeof ref === 'object' && ref._id != null) return String(ref._id);
  return '';
}

export type Variation = {
  _id: string; tenantId: string; contractId: string;
  projectId: VariationProjectRef;
  number: string;
  title: string;
  description: string;
  reason: VariationReason;
  costImpact: Money;
  timeImpactDays: number;
  status: VariationStatus;
  submittedBy: string | null;
  submittedAt: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  decisionNote: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ExpenseKind =
    |'Material'|'Labor'|'Equipment'|'Subcontractor'|'Other';
export const EXPENSE_KINDS: ExpenseKind[] = [
  'Material',
  'Labor',
  'Equipment',
  'Subcontractor',
  'Other',
];

export type ExpenseStatus =|'Draft'|'Committed'|'Invoiced'|'Paid'|'Disputed';
export const EXPENSE_STATUSES: ExpenseStatus[] = [
  'Draft',
  'Committed',
  'Invoiced',
  'Paid',
  'Disputed',
];

export type Expense = {
  _id: string; tenantId: string; projectId: string; departmentId: string;
  contractId: string | null;
  subcontractorId: string | null;
  supplierId: string | null;
  kind: ExpenseKind;
  status: ExpenseStatus;
  description: string;
  invoiceNumber: string;
  incurredOn: string;
  dueOn: string | null;
  paidOn: string | null;
  amount: Money;
  tax: Money;
  documentIds: string[];
  createdBy: string;
  createdAt?: string;
};

export type PaymentClaimStatus =
    |'Submitted'|'UnderReview'|'Certified'|'Rejected'|'Paid';
export const PAYMENT_CLAIM_STATUSES: PaymentClaimStatus[] = [
  'Submitted',
  'UnderReview',
  'Certified',
  'Rejected',
  'Paid',
];

export type PaymentClaim = {
  _id: string; tenantId: string; contractId: string; projectId: string;
  milestoneId: string | null;
  claimNumber: string;
  claimDate: string;
  claimedAmount: Money;
  certifiedAmount: Money | null;
  retentionHeld: Money | null;
  status: PaymentClaimStatus;
  supportingDocumentIds: string[];
  submittedBy: string;
  certifiedBy: string | null;
  certifiedAt: string | null;
  paidAt: string | null;
  decisionNote: string;
};

export type Subcontractor = {
  _id: string; tenantId: string; name: string; abn: string; trade: string;
  email: string;
  phone: string;
  contactPerson: string;
  licenseNumber: string;
  licenseExpiresAt: string | null;
  insuranceExpiresAt: string | null;
  preferred: boolean;
  notes: string;
};

export type Supplier = {
  _id: string; tenantId: string; name: string; category: string; email: string;
  phone: string;
  accountNumber: string;
  notes: string;
};

export type DocumentCategory =|'Contract'|'Variation'|'Invoice'|'Receipt'|
    'Plan'|'Drawing'|'Permit'|'Photo'|'Report'|'Other';
export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'Contract',
  'Variation',
  'Invoice',
  'Receipt',
  'Plan',
  'Drawing',
  'Permit',
  'Photo',
  'Report',
  'Other',
];

export type DocumentEntityType =|'Project'|'Contract'|'Variation'|'Expense'|
    'PaymentClaim'|'SiteLog'|'Subcontractor';

export type AppDocument = {
  _id: string; tenantId: string; projectId: string | null;
  departmentId: string | null;
  contractId: string | null;
  entityId: string | null;
  entityType: DocumentEntityType | null;
  category: DocumentCategory;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  checksum: string;
  tags: string[];
  uploaded: boolean;
  uploadedBy: string;
  createdAt?: string;
};

export type ProgressUpdate = {
  _id: string; projectId: string; departmentId: string; percentComplete: number;
  note: string;
  createdBy: string;
  createdAt?: string;
};

export type Milestone = {
  _id: string; projectId: string; departmentId: string | null; name: string;
  description: string;
  plannedDate: string;
  actualDate: string | null;
  status: 'Planned' | 'InProgress' | 'Completed' | 'AtRisk';
};

export type CrewLog = {
  subcontractorId: string; headcount: number; hours: number;
};

export type SiteLog = {
  _id: string; projectId: string; logDate: string; weather: string;
  temperatureC: number | null;
  crewOnSite: CrewLog[];
  workCompleted: string;
  issues: string;
  safetyNotes: string;
  photoIds: string[];
  createdBy: string;
  createdAt?: string;
};

export type ProjectFinancials = {
  projectId: string; tenantId: string; originalBudget: Money;
  approvedVariations: Money;
  revisedBudget: Money;
  committedTotal: Money;
  invoicedTotal: Money;
  paidTotal: Money;
  retentionHeld: Money;
  forecastFinalCost: Money;
  forecastVariance: Money;
  lastRecomputedAt: string;
};

export type CompanyOverview = {
  projectCount: number; activeCount: number; completedCount: number;
  onHoldCount: number;
  totalBudget: Money;
  totalCommitted: Money;
  totalPaid: Money;
  pendingVariations: number;
  openPaymentClaims: number;
  projectsAtRisk: Array<{
    id: string; name: string; code: string; status: ProjectStatus;
    plannedEndDate: string;
    variance: number;
    overrunPercent: number;
    lateDays: number;
  }>;
};

export type ProjectOverview = {
  project: Project&{id: string}; financials: ProjectFinancials | null;
  departmentSummary: Array<{
    departmentId: string; name: string; type: DepartmentType; budget: Money;
    committed: Money;
    paid: Money;
    percentComplete: number;
  }>;
  contractCount: number;
  openVariationCount: number;
  approvedVariationCount: number;
  recentVariations: Variation[];
  upcomingMilestones: Array<{
    contractId: string; contractRef: string; milestoneId: string; name: string;
    dueDate: string;
    amount: Money;
    status: PaymentMilestoneStatus;
  }>;
  recentClaims: PaymentClaim[];
  overdueDays: number;
};

export type ProjectMember = {
  _id?: string;
  userId: string;
  projectRole: 'PM' | 'Supervisor' | 'Finance' | 'Subcontractor' | 'Viewer';
  /**
   * Backend may attach the populated user record alongside `userId` so the UI
   * can render name/email without a separate /users fetch. Optional because
   * mutation responses (add/remove) currently don't populate it.
   */
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
};
