import type { Task, DelayStatus } from '../types';

const todayISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Auto-classify a task's delay status (matches Excel "حالة التأخير" logic).
// - missing-date  → no due date OR completed without close date
// - on-time       → completed before/on due date OR open & not yet past due
// - overdue       → completed after due date OR open & past due
export function computeDelayStatus(task: Pick<Task, 'status' | 'dueDate' | 'endDate' | 'actualCloseDate' | 'actualDate'>): DelayStatus {
  const due = task.dueDate || task.endDate || null;
  if (!due) return 'missing-date';

  if (task.status === 'completed') {
    const closed = task.actualCloseDate || task.actualDate || null;
    if (!closed) return 'missing-date';
    return closed.slice(0, 10) <= due.slice(0, 10) ? 'on-time' : 'overdue';
  }

  if (task.status === 'cancelled' || task.status === 'postponed') return 'on-time';

  return todayISO() > due.slice(0, 10) ? 'overdue' : 'on-time';
}

export interface RequestMetricsSummary {
  total: number;
  completed: number;
  ongoing: number;
  notStarted: number;
  awaitingReply: number;
  cancelled: number;
  onTime: number;
  overdue: number;
  missingDate: number;
  needsFollowUp: number;
  completedOnTime: number;
  slaCompliance: number;       // (completed-on-time / completed) * 100
  commitmentRate: number;      // (on-time / total) * 100
}

const daysUntil = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const target = new Date(iso.slice(0, 10));
  const now = new Date(todayISO());
  return Math.floor((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

export function computeRequestMetrics(tasks: Task[]): RequestMetricsSummary {
  let onTime = 0, overdue = 0, missingDate = 0;
  let completed = 0, ongoing = 0, notStarted = 0, awaitingReply = 0, cancelled = 0;
  let needsFollowUp = 0;
  let completedOnTime = 0;

  for (const t of tasks) {
    const ds = computeDelayStatus(t);
    if (ds === 'on-time') onTime++;
    else if (ds === 'overdue') overdue++;
    else missingDate++;

    if (t.status === 'completed') completed++;
    else if (t.status === 'ongoing') ongoing++;
    else if (t.status === 'not-started') notStarted++;
    else if (t.status === 'awaiting-reply') awaitingReply++;
    else if (t.status === 'cancelled') cancelled++;

    if (t.status === 'completed' && ds === 'on-time') completedOnTime++;

    // Needs follow-up: open task with due in <=3 days OR awaiting-reply OR overdue
    const open = t.status !== 'completed' && t.status !== 'cancelled';
    if (open) {
      const due = t.dueDate || t.endDate || null;
      const d = daysUntil(due);
      if (t.status === 'awaiting-reply' || ds === 'overdue' || (d !== null && d <= 3)) {
        needsFollowUp++;
      }
    }
  }

  const total = tasks.length;
  const slaCompliance = completed > 0 ? (completedOnTime / completed) * 100 : 0;
  const commitmentRate = total > 0 ? (onTime / total) * 100 : 0;

  return {
    total, completed, ongoing, notStarted, awaitingReply, cancelled,
    onTime, overdue, missingDate, needsFollowUp,
    completedOnTime, slaCompliance, commitmentRate,
  };
}
