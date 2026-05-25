import { z } from 'zod';

// ---- Auth schemas ----

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().max(200).optional(),
});

// ---- Task schemas ----

export const createTaskSchema = z.object({
  refNo: z.string().max(100).optional().nullable(),
  requestNo: z.string().max(50).optional().nullable(),
  title: z.string().min(1).max(500),
  department: z.string().min(1).max(200),
  month: z.string().max(50).optional().nullable(),
  status: z.enum(['not-started', 'ongoing', 'completed', 'overdue', 'postponed', 'cancelled', 'awaiting-reply']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.string().optional().nullable(),
  teamMembers: z.array(z.any()).optional(),
  dependencies: z.array(z.string()).optional(),
  classification: z.string().max(200).optional().nullable(),
  taskType: z.enum(['regular', 'recurring', 'committee']).optional(),
  plannedDate: z.string().optional().nullable(),
  actualDate: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  completionPercentage: z.number().min(0).max(100).optional(),
  notes: z.string().max(5000).optional().nullable(),
  obstacles: z.string().max(5000).optional().nullable(),
  parentTaskId: z.string().optional().nullable(),
  committeeId: z.string().uuid().optional().nullable(),
  isArchived: z.boolean().optional(),
  // Request-tracker fields (merged from Excel)
  requestType: z.enum(['chairman', 'deputy', 'sector', 'internal', 'external', 'task', 'transaction', 'letter', 'report']).optional().nullable(),
  requestingEntity: z.string().max(500).optional().nullable(),
  entityClassification: z.enum(['internal', 'external']).optional().nullable(),
  sector: z.string().max(100).optional().nullable(),
  purpose: z.enum(['completion', 'follow_up', 'feedback', 'approval']).optional().nullable(),
  direction: z.enum(['incoming', 'outgoing', 'internal']).optional().nullable(),
  transactionNo: z.string().max(50).optional().nullable(),
  transactionName: z.string().max(500).optional().nullable(),
  transactionStatus: z.enum(['new', 'ongoing', 'awaiting-reply', 'completed', 'paused', 'cancelled']).optional().nullable(),
  requestDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  actualCloseDate: z.string().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const bulkUpdateSchema = z.object({
  taskIds: z.array(z.string().uuid()).min(1),
  updates: updateTaskSchema,
});

export const bulkDeleteSchema = z.object({
  taskIds: z.array(z.string().uuid()).min(1),
});

// ---- User schemas ----

export const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.string().min(1).max(100),
  customPermissions: z.array(z.string()).optional(),
});

export const updateUserSchema = z.object({
  role: z.string().min(1).max(100),
  customPermissions: z.array(z.string()).optional(),
});

// ---- Notification schemas ----

export const createNotificationSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1).max(500),
  message: z.string().min(1).max(2000),
  taskId: z.string().optional().nullable(),
});

// ---- Report schemas ----

export const createReportSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().min(1),
  period: z.string().max(200).optional().nullable(),
});

// ---- Custom Role schemas ----

export const createCustomRoleSchema = z.object({
  name: z.string().min(1).max(200),
  permissions: z.array(z.string()).optional(),
  color: z.string().max(50).optional(),
});

export const updateCustomRoleSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  permissions: z.array(z.string()).optional(),
  color: z.string().max(50).optional(),
});

// ---- Department schemas ----

export const createDepartmentSchema = z.object({
  name: z.string().min(1).max(255),
  nameEn: z.string().max(255).optional().nullable(),
  color: z.string().max(50).optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  nameEn: z.string().max(255).optional().nullable(),
  color: z.string().max(50).optional(),
});

// ---- Chat schema ----

export const chatSchema = z.object({
  message: z.string().min(1).max(10000),
  history: z.array(z.object({
    role: z.string(),
    text: z.string(),
  })).optional(),
  taskContext: z.string().max(50000).optional(),
});

// ---- Committee schemas ----

export const committeeMemberInputSchema = z.object({
  userId: z.string().uuid().optional().nullable(),
  memberName: z.string().max(255).optional().nullable(),
  role: z.enum(['chair', 'vice_chair', 'secretary', 'technical', 'financial', 'member']).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const createCommitteeSchema = z.object({
  recordNo: z.string().max(50).optional().nullable(),
  name: z.string().min(1).max(500),
  type: z.string().max(100).optional().nullable(),
  representativeType: z.string().max(100).optional().nullable(),
  scope: z.enum(['internal', 'regional', 'international', 'external']).optional().nullable(),
  department: z.string().max(255).optional().nullable(),
  confidentiality: z.enum(['public', 'internal', 'secret']).optional(),
  status: z.enum(['forming', 'active', 'frozen', 'ended']).optional(),
  isInternal: z.boolean().optional(),
  organizingEntity: z.string().max(500).optional().nullable(),
  formationDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  chairperson: z.string().max(255).optional().nullable(),
  budget: z.number().optional().nullable(),
  investment: z.number().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  members: z.array(committeeMemberInputSchema).optional(),
});

export const updateCommitteeSchema = createCommitteeSchema.partial();

export const importCommitteesSchema = z.object({
  committees: z.array(createCommitteeSchema).min(1),
  upsertByName: z.boolean().optional(),
});
