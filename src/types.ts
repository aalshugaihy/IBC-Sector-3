export interface CustomRole {
  id: string;
  name: { ar: string; en: string };
  permissions: string[];
  color: string;
}

export interface Department {
  id: string;
  name: string;
  nameEn?: string | null;
  color?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: 'admin' | 'member' | 'monitor' | string;
  isPending?: boolean;
  customPermissions?: string[];
}

export interface TaskHistory {
  userId: string;
  userName: string;
  timestamp: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

export type TaskStatus =
  | 'not-started'
  | 'ongoing'
  | 'completed'
  | 'overdue'
  | 'postponed'
  | 'cancelled'
  | 'awaiting-reply';

export type RequestType =
  | 'chairman'
  | 'deputy'
  | 'sector'
  | 'internal'
  | 'external'
  | 'task'
  | 'transaction'
  | 'letter'
  | 'report';

export type EntityClassification = 'internal' | 'external';
export type Purpose = 'completion' | 'follow_up' | 'feedback' | 'approval';
export type Direction = 'incoming' | 'outgoing' | 'internal';
export type TransactionStatus =
  | 'new'
  | 'ongoing'
  | 'awaiting-reply'
  | 'completed'
  | 'paused'
  | 'cancelled';
export type DelayStatus = 'on-time' | 'overdue' | 'missing-date';

export interface Task {
  id?: string;
  title: string;
  department: string;
  month: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  teamMembers?: { userId: string; role: string }[];
  dependencies?: string[];
  classification?: string;
  taskType?: 'regular' | 'recurring' | 'committee';
  plannedDate?: string;
  actualDate?: string;
  completionPercentage: number;
  notes?: string;
  obstacles?: string;
  createdAt?: string;
  updatedAt?: string;
  history?: TaskHistory[];
  parentTaskId?: string;
  committeeId?: string | null;
  isArchived?: boolean;
  startDate?: string;
  endDate?: string;
  refNo?: string;
  // Request-tracker fields (merged from Excel "متتبع الطلبات")
  requestNo?: string;                    // auto-generated REQ-YYYY-NNN
  requestType?: RequestType | null;
  requestingEntity?: string | null;
  entityClassification?: EntityClassification | null;
  sector?: string | null;
  purpose?: Purpose | null;
  direction?: Direction | null;
  transactionNo?: string | null;
  transactionName?: string | null;
  transactionStatus?: TransactionStatus | null;
  requestDate?: string | null;
  dueDate?: string | null;
  actualCloseDate?: string | null;
}

export type CommitteeStatus = 'forming' | 'active' | 'frozen' | 'ended';
export type CommitteeScope = 'internal' | 'regional' | 'international' | 'external';
export type CommitteeConfidentiality = 'public' | 'internal' | 'secret';
export type CommitteeMemberRole = 'chair' | 'vice_chair' | 'secretary' | 'technical' | 'financial' | 'member';

export interface CommitteeMember {
  id?: string;
  committeeId?: string;
  userId?: string | null;
  memberName?: string | null;
  role: CommitteeMemberRole;
  notes?: string | null;
  createdAt?: string;
}

export interface Committee {
  id?: string;
  recordNo?: string | null;
  name: string;
  type?: string | null;
  representativeType?: string | null;
  scope?: CommitteeScope | null;
  department?: string | null;
  confidentiality?: CommitteeConfidentiality;
  status?: CommitteeStatus;
  isInternal?: boolean;
  organizingEntity?: string | null;
  formationDate?: string | null;
  endDate?: string | null;
  chairperson?: string | null;
  budget?: number | null;
  investment?: number | null;
  notes?: string | null;
  members?: CommitteeMember[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Notification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  taskId?: string;
}

export interface RequestMetric {
  id?: string;
  timestamp: string;
  type: string;
  userId?: string;
}

export interface Report {
  id?: string;
  title: string;
  content: string;
  period?: string;
  createdAt: string;
  generatedBy?: string;
}
