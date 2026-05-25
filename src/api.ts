const API_BASE = import.meta.env.VITE_API_URL || '/api';

let token: string | null = localStorage.getItem('auth_token');

export function setToken(t: string | null) {
  token = t;
  if (t) {
    localStorage.setItem('auth_token', t);
  } else {
    localStorage.removeItem('auth_token');
  }
}

export function getToken() {
  return token;
}

async function request(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    setToken(null);
    localStorage.removeItem('auth_user');
    window.location.reload();
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

// Auth
export const api = {
  // Auth
  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: (email: string, password: string, displayName?: string) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, displayName }) }),

  getMe: () => request('/auth/me'),

  // Tasks
  listTasks: () => request('/tasks'),

  createTask: (task: any) =>
    request('/tasks', { method: 'POST', body: JSON.stringify(task) }),

  updateTask: (id: string, updates: any) =>
    request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),

  bulkUpdateTasks: (taskIds: string[], updates: any) =>
    request('/tasks', { method: 'PATCH', body: JSON.stringify({ taskIds, updates }) }),

  deleteTask: (id: string) =>
    request(`/tasks/${id}`, { method: 'DELETE' }),

  bulkDeleteTasks: (taskIds: string[]) =>
    request('/tasks/bulk-delete', { method: 'POST', body: JSON.stringify({ taskIds }) }),

  resetTasks: (tasks: any[]) =>
    request('/tasks/reset', { method: 'POST', body: JSON.stringify({ tasks }) }),

  // Users
  listUsers: () => request('/users'),

  inviteUser: (email: string, role: string, customPermissions?: string[]) =>
    request('/users/invite', { method: 'POST', body: JSON.stringify({ email, role, customPermissions }) }),

  updateUserRole: (uid: string, role: string, customPermissions?: string[]) =>
    request(`/users/${uid}`, { method: 'PATCH', body: JSON.stringify({ role, customPermissions }) }),

  deleteUser: (uid: string) =>
    request(`/users/${uid}`, { method: 'DELETE' }),

  // Notifications
  listNotifications: () => request('/notifications'),

  createNotification: (data: { userId: string; title: string; message: string; taskId?: string }) =>
    request('/notifications', { method: 'POST', body: JSON.stringify(data) }),

  markNotificationRead: (id: string) =>
    request(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllNotificationsRead: () =>
    request('/notifications/mark-all-read', { method: 'POST' }),

  deleteNotification: (id: string) =>
    request(`/notifications/${id}`, { method: 'DELETE' }),

  // Reports
  listReports: () => request('/reports'),

  createReport: (data: { title: string; content: string; period?: string }) =>
    request('/reports', { method: 'POST', body: JSON.stringify(data) }),

  // Custom Roles
  listCustomRoles: () => request('/custom-roles'),

  createCustomRole: (data: any) =>
    request('/custom-roles', { method: 'POST', body: JSON.stringify(data) }),

  updateCustomRole: (id: string, data: any) =>
    request(`/custom-roles/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteCustomRole: (id: string) =>
    request(`/custom-roles/${id}`, { method: 'DELETE' }),

  // Departments
  listDepartments: () => request('/departments'),

  createDepartment: (data: { name: string; nameEn?: string | null; color?: string }) =>
    request('/departments', { method: 'POST', body: JSON.stringify(data) }),

  updateDepartment: (id: string, data: { name?: string; nameEn?: string | null; color?: string }) =>
    request(`/departments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteDepartment: (id: string) =>
    request(`/departments/${id}`, { method: 'DELETE' }),

  // Committees
  listCommittees: () => request('/committees'),

  getCommittee: (id: string) => request(`/committees/${id}`),

  createCommittee: (data: any) =>
    request('/committees', { method: 'POST', body: JSON.stringify(data) }),

  updateCommittee: (id: string, data: any) =>
    request(`/committees/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteCommittee: (id: string) =>
    request(`/committees/${id}`, { method: 'DELETE' }),

  addCommitteeMember: (committeeId: string, member: any) =>
    request(`/committees/${committeeId}/members`, { method: 'POST', body: JSON.stringify(member) }),

  removeCommitteeMember: (committeeId: string, memberId: string) =>
    request(`/committees/${committeeId}/members/${memberId}`, { method: 'DELETE' }),

  importCommittees: (committees: any[], upsertByName: boolean = true) =>
    request('/committees/import', { method: 'POST', body: JSON.stringify({ committees, upsertByName }) }),

  // Chat
  chat: (message: string, history: { role: string; text: string }[], taskSummary: string) =>
    request('/chat', { method: 'POST', body: JSON.stringify({ message, history, taskContext: taskSummary }) }),

  // System settings (admin)
  listSettings: () => request('/settings'),

  publicSettings: () => request('/settings/public'),

  updateSetting: (key: string, value: unknown, isSecret: boolean) =>
    request(`/settings/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify({ value, isSecret }),
    }),

  deleteSetting: (key: string) =>
    request(`/settings/${encodeURIComponent(key)}`, { method: 'DELETE' }),

  testSetting: (key: string) =>
    request(`/settings/test/${encodeURIComponent(key)}`, { method: 'POST' }),

  // System diagnostics (admin)
  systemInfo: () => request('/system/info'),

  systemAudit: (limit = 100, offset = 0) =>
    request(`/system/audit?limit=${limit}&offset=${offset}`),

  downloadBackup: async (): Promise<Blob> => {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/system/backup`, { headers });
    if (!res.ok) throw new Error(`Backup failed: ${res.status}`);
    return res.blob();
  },
};
