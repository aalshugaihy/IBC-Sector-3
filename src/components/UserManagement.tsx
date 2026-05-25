import React, { useState } from 'react';
import { User, CustomRole, Department } from '../types';
import { useTranslation } from 'react-i18next';
import { UserPlus, Mail, Shield, ShieldAlert, Search, MoreVertical, Trash2, Edit2, User as UserIcon, Check, X, Settings2, Plus, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { ROLE_OPTIONS, PERMISSIONS, PERMISSION_LABELS } from '../constants';

const DEPARTMENT_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
  '#0ea5e9', '#ef4444', '#14b8a6', '#f97316', '#a855f7',
];

interface UserManagementProps {
  users: User[];
  currentUser: User | null;
  customRoles: CustomRole[];
  departments: Department[];
  onInviteUser: (email: string, role: User['role'], customPermissions?: string[]) => void;
  onUpdateUserRole: (uid: string, role: User['role'], customPermissions?: string[]) => void;
  onDeleteUser: (uid: string) => void;
  onAddCustomRole: (role: Omit<CustomRole, 'id'>) => void;
  onUpdateCustomRole: (id: string, role: Partial<CustomRole>) => void;
  onDeleteCustomRole: (id: string) => void;
  onAddDepartment: (data: { name: string; nameEn?: string | null; color?: string }) => Promise<{ ok: boolean; error?: string }>;
  onUpdateDepartment: (id: string, data: { name?: string; nameEn?: string | null; color?: string }) => Promise<{ ok: boolean; error?: string }>;
  onDeleteDepartment: (id: string) => Promise<{ ok: boolean; error?: string }>;
}

const PERMISSION_CATEGORIES = [
  {
    id: 'tasks',
    label: { ar: 'إدارة المهام', en: 'Task Management' },
    permissions: ['tasks:create', 'tasks:edit', 'tasks:delete', 'tasks:archive', 'tasks:view_history']
  },
  {
    id: 'users',
    label: { ar: 'إدارة المستخدمين', en: 'User Management' },
    permissions: ['users:manage']
  },
  {
    id: 'system',
    label: { ar: 'النظام والتقارير', en: 'System & Reports' },
    permissions: ['reports:view', 'kanban:manage']
  }
];

export function UserManagement({
  users,
  currentUser,
  customRoles,
  departments,
  onInviteUser,
  onUpdateUserRole,
  onDeleteUser,
  onAddCustomRole,
  onUpdateCustomRole,
  onDeleteCustomRole,
  onAddDepartment,
  onUpdateDepartment,
  onDeleteDepartment
}: UserManagementProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'departments'>('users');

  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptFormData, setDeptFormData] = useState({ nameAr: '', nameEn: '', color: DEPARTMENT_COLORS[0] });
  const [deptError, setDeptError] = useState<string | null>(null);
  const [deptSearch, setDeptSearch] = useState('');
  const [showDeptDeleteConfirm, setShowDeptDeleteConfirm] = useState<Department | null>(null);

  const openAddDeptModal = () => {
    setEditingDept(null);
    setDeptFormData({ nameAr: '', nameEn: '', color: DEPARTMENT_COLORS[0] });
    setDeptError(null);
    setIsDeptModalOpen(true);
  };

  const openEditDeptModal = (dept: Department) => {
    setEditingDept(dept);
    setDeptFormData({
      nameAr: dept.name,
      nameEn: dept.nameEn || '',
      color: dept.color || DEPARTMENT_COLORS[0],
    });
    setDeptError(null);
    setIsDeptModalOpen(true);
  };

  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptFormData.nameAr.trim()) {
      setDeptError(isRTL ? 'الاسم بالعربية مطلوب' : 'Arabic name is required');
      return;
    }
    setDeptError(null);
    const payload = {
      name: deptFormData.nameAr.trim(),
      nameEn: deptFormData.nameEn.trim() || null,
      color: deptFormData.color,
    };
    const res = editingDept
      ? await onUpdateDepartment(editingDept.id, payload)
      : await onAddDepartment(payload);
    if (res.ok) {
      setIsDeptModalOpen(false);
      setEditingDept(null);
    } else {
      setDeptError(res.error || (isRTL ? 'فشل الحفظ' : 'Failed to save'));
    }
  };

  const handleDeptDelete = async () => {
    if (!showDeptDeleteConfirm) return;
    const res = await onDeleteDepartment(showDeptDeleteConfirm.id);
    if (res.ok) {
      setShowDeptDeleteConfirm(null);
    } else {
      setDeptError(res.error || (isRTL ? 'فشل الحذف' : 'Failed to delete'));
      setShowDeptDeleteConfirm(null);
      setTimeout(() => setDeptError(null), 4000);
    }
  };

  const filteredDepartments = departments.filter(d =>
    d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
    (d.nameEn || '').toLowerCase().includes(deptSearch.toLowerCase())
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<User['role']>('member');
  const [inviteCustomPermissions, setInviteCustomPermissions] = useState<string[]>([]);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingCustomPermissions, setEditingCustomPermissions] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryLabelAr, setNewCategoryLabelAr] = useState('');
  const [newCategoryLabelEn, setNewCategoryLabelEn] = useState('');
  const [categories, setCategories] = useState(PERMISSION_CATEGORIES);

  const [showInviteSuccess, setShowInviteSuccess] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [roleFormData, setRoleFormData] = useState({
    nameAr: '',
    nameEn: '',
    permissions: [] as string[],
    color: 'bg-primary/10 text-primary'
  });

  const openEditRoleModal = (role: CustomRole) => {
    setEditingRole(role);
    setRoleFormData({
      nameAr: role.name.ar,
      nameEn: role.name.en,
      permissions: role.permissions,
      color: role.color
    });
    setIsRoleModalOpen(true);
  };

  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    onInviteUser(inviteEmail, inviteRole, inviteRole === 'custom' ? inviteCustomPermissions : undefined);
    
    // Professional and informative invitation email
    const appName = t('innovationHub');
    const customRole = customRoles.find(r => r.id === inviteRole);
    const roleName = customRole ? customRole.name[isRTL ? 'ar' : 'en'] : (inviteRole === 'custom' ? t('customPermissions') : ROLE_OPTIONS.find(r => r.value === inviteRole)?.label[isRTL ? 'ar' : 'en']);
    
    const subject = encodeURIComponent(isRTL ? `دعوة للانضمام إلى ${appName}` : `Invitation to join ${appName}`);
    const body = encodeURIComponent(
      (isRTL ? 
        `مرحباً،\n\n` +
        `يسرنا دعوتك للانضمام إلى منصة ${appName} بصلاحية (${roleName}).\n\n` +
        `تعتبر منصة ${appName} المركز الرئيسي لإدارة المهام ومتابعة أعمال القطاع، حيث تهدف إلى تعزيز التعاون والابتكار.\n\n` +
        `للبدء، يرجى تسجيل الدخول باستخدام حساب جوجل الخاص بك من خلال الرابط التالي:\n` +
        `${window.location.origin}\n\n` +
        `نتطلع لمشاركتك الفعالة.\n\n` +
        `مع تحيات،\n` +
        `فريق إدارة ${appName}`
        :
        `Hello,\n\n` +
        `You have been formally invited to join the ${appName} platform with the role of (${roleName}).\n\n` +
        `The ${appName} serves as our central hub for task management and sector performance monitoring, designed to foster collaboration and innovation.\n\n` +
        `To get started, please log in using your professional Google account at:\n` +
        `${window.location.origin}\n\n` +
        `We look forward to your contributions.\n\n` +
        `Best regards,\n` +
        `The ${appName} Administration Team`
      )
    );
    
    const mailtoLink = `mailto:${inviteEmail}?subject=${subject}&body=${body}`;
    window.open(mailtoLink, '_blank');
    
    setInviteEmail('');
    setInviteCustomPermissions([]);
    setShowInviteSuccess(true);
    setTimeout(() => setShowInviteSuccess(false), 5000);
  };

  const togglePermission = (perm: string, isInvite: boolean) => {
    if (isInvite) {
      setInviteCustomPermissions(prev => 
        prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
      );
    } else {
      setEditingCustomPermissions(prev => 
        prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
      );
    }
  };

  const handleRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const roleData = {
      name: { ar: roleFormData.nameAr, en: roleFormData.nameEn },
      permissions: roleFormData.permissions,
      color: roleFormData.color
    };

    if (editingRole) {
      onUpdateCustomRole(editingRole.id, roleData);
    } else {
      onAddCustomRole(roleData);
    }
    setIsRoleModalOpen(false);
    setEditingRole(null);
    setRoleFormData({ nameAr: '', nameEn: '', permissions: [], color: 'bg-primary/10 text-primary' });
  };

  const openAddRoleModal = () => {
    setEditingRole(null);
    setRoleFormData({ nameAr: '', nameEn: '', permissions: [], color: 'bg-primary/10 text-primary' });
    setIsRoleModalOpen(true);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryLabelAr.trim() || !newCategoryLabelEn.trim()) return;

    const newCategory = {
      id: `custom_${Date.now()}`,
      label: { ar: newCategoryLabelAr, en: newCategoryLabelEn },
      permissions: []
    };

    setCategories([...categories, newCategory]);
    setNewCategoryLabelAr('');
    setNewCategoryLabelEn('');
    setIsAddingCategory(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-1000 relative">
      {/* Tabs */}
      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
          {isRTL ? 'المستخدمين' : 'Users'}
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'roles' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
          {isRTL ? 'الأدوار المخصصة' : 'Custom Roles'}
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'departments' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
          {t('departments')}
        </button>
      </div>

      {activeTab === 'users' && (
        <>
          {/* Invitation Form */}
          <div className="glass-1 rounded-xl p-5 border border-slate-200/50 dark:border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-indigo-600/10 p-2.5 rounded-lg border border-indigo-600/20">
                <UserPlus className="text-indigo-600" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('inviteUser')}</h2>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('innovationHub')}</p>
              </div>
            </div>
            
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Mail className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} size={20} />
                  <input
                    type="email"
                    placeholder={t('email')}
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className={`w-full ${isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all`}
                    required
                  />
                </div>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as User['role'])}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                >
                  {ROLE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label[i18n.language as 'ar' | 'en']}</option>
                  ))}
                  {customRoles.map(role => (
                    <option key={role.id} value={role.id}>{role.name[i18n.language as 'ar' | 'en']}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all"
                >
                  {t('sendInvitation')}
                </button>
              </div>

              {inviteRole === 'custom' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Shield size={16} className="text-indigo-600" />
                    {t('customPermissions')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-500 transition-all">
                        <input
                          type="checkbox"
                          checked={inviteCustomPermissions.includes(key)}
                          onChange={() => togglePermission(key, true)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-slate-900 dark:text-white">{label[isRTL ? 'ar' : 'en']}</span>
                          <span className="text-xs font-medium text-slate-400">{key}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}
            </form>

            {showInviteSuccess && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg flex items-center gap-3 text-green-700 dark:text-green-400 font-bold"
              >
                <Check size={20} />
                <span>{isRTL ? 'تم إرسال الدعوة بنجاح! سيظهر المستخدم في القائمة كـ "قيد الانتظار".' : 'Invitation sent successfully! The user will appear as "Pending" in the list.'}</span>
              </motion.div>
            )}
          </div>

          {/* User List - Card Based Layout */}
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600/10 p-2.5 rounded-lg border border-indigo-600/20">
                  <UserIcon className="text-indigo-600" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('userManagement')}</h2>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('sectorName')}</p>
                </div>
              </div>
              <div className="relative max-w-md w-full">
                <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400`} size={16} />
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full ${isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredUsers.map((user) => (
                <motion.div
                  layout
                  key={user.uid}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -5 }}
                  className="glass-1 rounded-xl p-4 border border-slate-200/50 dark:border-white/5 flex flex-col transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || '')}&background=random`}
                          alt=""
                          className="w-12 h-12 rounded-lg border border-slate-200 dark:border-slate-700 object-cover"
                        />
                        {user.isPending && (
                          <div className="absolute -top-2 -right-2 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-lg z-20 animate-bounce">
                            <Mail size={14} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight truncate">
                          {user.displayName || user.email?.split('@')[0]}
                        </h3>
                        <div className="flex items-center gap-1.5 text-slate-400 mt-0.5">
                          <Mail size={11} />
                          <p className="text-xs font-medium truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === user.uid ? null : user.uid)}
                        className={`p-2 rounded-lg transition-all ${activeMenuId === user.uid ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600'}`}
                      >
                        <MoreVertical size={20} />
                      </button>

                      {activeMenuId === user.uid && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-20 overflow-hidden`}
                          >
                            <div className="p-1.5 space-y-0.5">
                              <button
                                disabled={user.uid === currentUser?.uid}
                                onClick={() => {
                                  setEditingUserId(user.uid);
                                  setEditingCustomPermissions(user.customPermissions || []);
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Edit2 size={14} />
                                {isRTL ? 'تعديل الصلاحية' : 'Edit Role'}
                              </button>
                              <button
                                disabled={user.uid === currentUser?.uid}
                                onClick={() => {
                                  setShowDeleteConfirm(user.uid);
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Trash2 size={14} />
                                {isRTL ? 'حذف المستخدم' : 'Delete User'}
                              </button>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </div>
                  </div>

                  {editingUserId === user.uid && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mb-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800/50"
                    >
                      <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-3">{isRTL ? 'اختر الصلاحية الجديدة' : 'Select New Role'}</p>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <select
                            value={user.role}
                            onChange={(e) => onUpdateUserRole(user.uid, e.target.value as User['role'], e.target.value === 'custom' ? editingCustomPermissions : undefined)}
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                          >
                            {ROLE_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label[i18n.language as 'ar' | 'en']}</option>
                            ))}
                            {customRoles.map(role => (
                              <option key={role.id} value={role.id}>{role.name[i18n.language as 'ar' | 'en']}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              if (user.role === 'custom') {
                                onUpdateUserRole(user.uid, 'custom', editingCustomPermissions);
                              }
                              setEditingUserId(null);
                            }}
                            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
                          >
                            <Check size={16} strokeWidth={3} />
                          </button>
                        </div>

                        {user.role === 'custom' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                              <label key={key} className="flex items-center gap-2 p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-indigo-100 dark:border-indigo-800/50 cursor-pointer hover:bg-indigo-50 transition-all">
                                <input
                                  type="checkbox"
                                  checked={editingCustomPermissions.includes(key)}
                                  onChange={() => togglePermission(key, false)}
                                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{label[isRTL ? 'ar' : 'en']}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${
                        user.role === 'admin'
                          ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/50'
                          : user.role === 'monitor'
                          ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50'
                          : 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50'
                      }`}>
                        {user.role === 'admin' ? <ShieldAlert size={12} /> : user.role === 'monitor' ? <Settings2 size={12} /> : <Shield size={12} />}
                        {customRoles.find(r => r.id === user.role)?.name[isRTL ? 'ar' : 'en'] || ROLE_OPTIONS.find(r => r.value === user.role)?.label[i18n.language as 'ar' | 'en']}
                      </span>
                      {user.isPending && (
                        <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/50 text-xs font-medium rounded-md">
                          {isRTL ? 'قيد الانتظار' : 'Pending'}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredUsers.length === 0 && (
              <div className="p-12 text-center glass-1 rounded-xl border border-slate-200/50 dark:border-white/5">
                <div className="bg-slate-100 dark:bg-slate-800 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Search className="text-slate-300 dark:text-slate-600" size={24} />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{t('noTasksFound')}</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{isRTL ? 'لم يتم العثور على مستخدمين يطابقون بحثك' : 'No users found matching your search'}</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'roles' && (
        /* Custom Roles Management */
        <div className="space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600/10 p-2.5 rounded-lg border border-indigo-600/20">
                <Shield className="text-indigo-600" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{isRTL ? 'إدارة الأدوار المخصصة' : 'Manage Custom Roles'}</h2>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('innovationHub')}</p>
              </div>
            </div>
            <button
              onClick={openAddRoleModal}
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all"
            >
              <Plus size={20} />
              <span>{isRTL ? 'إضافة دور جديد' : 'Add New Role'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {customRoles.map((role) => (
              <motion.div
                layout
                key={role.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-1 rounded-xl p-4 border border-slate-200/50 dark:border-white/5 flex flex-col"
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                      {role.name[isRTL ? 'ar' : 'en']}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${role.color}`}>
                      {role.id}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => openEditRoleModal(role)}
                      className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 rounded-lg transition-all"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(t('confirmDelete'))) {
                          onDeleteCustomRole(role.id);
                        }
                      }}
                      className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 rounded-lg transition-all"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('permissions')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions.map(perm => (
                      <span key={perm} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-600">
                        {PERMISSION_LABELS[perm]?.[isRTL ? 'ar' : 'en'] || perm}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}

            {customRoles.length === 0 && (
              <div className="col-span-full p-12 text-center glass-1 rounded-xl border border-slate-200/50 dark:border-white/5">
                <div className="bg-slate-100 dark:bg-slate-800 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="text-slate-300 dark:text-slate-600" size={24} />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{isRTL ? 'لم يتم تعريف أدوار مخصصة بعد' : 'No custom roles defined yet'}</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{isRTL ? 'ابدأ بإضافة دور جديد لتخصيص الصلاحيات' : 'Start by adding a new role to customize permissions'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'departments' && (
        /* Departments Management */
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600/10 p-2.5 rounded-lg border border-indigo-600/20">
                <Building2 className="text-indigo-600" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('manageDepartments')}</h2>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('innovationHub')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative max-w-md w-full">
                <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400`} size={16} />
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  className={`w-full ${isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all`}
                />
              </div>
              <button
                onClick={openAddDeptModal}
                className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all whitespace-nowrap"
              >
                <Plus size={18} />
                <span>{t('addDepartment')}</span>
              </button>
            </div>
          </div>

          {deptError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm font-medium text-red-700 dark:text-red-400">
              {deptError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredDepartments.map((dept) => (
              <motion.div
                layout
                key={dept.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -3 }}
                className="glass-1 rounded-xl p-4 border border-slate-200/50 dark:border-white/5 flex flex-col transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                      style={{ backgroundColor: `${dept.color || '#6366f1'}20`, color: dept.color || '#6366f1' }}
                    >
                      <Building2 size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate" title={dept.name}>
                        {dept.name}
                      </h3>
                      {dept.nameEn && (
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate" title={dept.nameEn}>
                          {dept.nameEn}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => openEditDeptModal(dept)}
                      title={t('edit')}
                      className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 rounded-lg transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setShowDeptDeleteConfirm(dept)}
                      title={t('delete')}
                      className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span
                    className="inline-block w-3 h-3 rounded-full border border-slate-200 dark:border-slate-700"
                    style={{ backgroundColor: dept.color || '#6366f1' }}
                  />
                  <span className="text-xs font-mono font-medium text-slate-400">
                    {dept.color || '#6366f1'}
                  </span>
                </div>
              </motion.div>
            ))}

            {filteredDepartments.length === 0 && (
              <div className="col-span-full p-12 text-center glass-1 rounded-xl border border-slate-200/50 dark:border-white/5">
                <div className="bg-slate-100 dark:bg-slate-800 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="text-slate-300 dark:text-slate-600" size={24} />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{t('noDepartments')}</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{t('noDepartmentsHint')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-6 border border-slate-200 dark:border-slate-700 text-center"
            >
              <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-red-600">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{t('confirmDelete')}</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
                {isRTL ? 'هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this user? This action cannot be undone.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-sm font-medium hover:bg-slate-200 transition-all"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={() => {
                    onDeleteUser(showDeleteConfirm);
                    setShowDeleteConfirm(null);
                  }}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-all"
                >
                  {t('delete')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Category Modal */}
      <AnimatePresence>
        {isAddingCategory && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingCategory(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-5 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-indigo-600/10 p-2.5 rounded-lg border border-indigo-600/20">
                  <Plus className="text-indigo-600" size={18} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {isRTL ? 'إضافة فئة جديدة' : 'Add New Category'}
                </h3>
              </div>

              <form onSubmit={handleAddCategory} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{isRTL ? 'اسم الفئة (بالعربي)' : 'Category Name (Arabic)'}</label>
                  <input
                    type="text"
                    value={newCategoryLabelAr}
                    onChange={(e) => setNewCategoryLabelAr(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{isRTL ? 'اسم الفئة (بالإنجليزي)' : 'Category Name (English)'}</label>
                  <input
                    type="text"
                    value={newCategoryLabelEn}
                    onChange={(e) => setNewCategoryLabelEn(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(false)}
                    className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-sm font-medium hover:bg-slate-200 transition-all"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all"
                  >
                    {t('add')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Role Modal */}
      <AnimatePresence>
        {isRoleModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRoleModalOpen(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
            >
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-600/10 p-2.5 rounded-lg border border-indigo-600/20">
                      <Shield className="text-indigo-600" size={18} />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {editingRole ? (isRTL ? 'تعديل الدور' : 'Edit Role') : (isRTL ? 'إضافة دور جديد' : 'Add New Role')}
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsRoleModalOpen(false)}
                    className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleRoleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{isRTL ? 'اسم الدور (بالعربي)' : 'Role Name (Arabic)'}</label>
                      <input
                        type="text"
                        value={roleFormData.nameAr}
                        onChange={(e) => setRoleFormData({ ...roleFormData, nameAr: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{isRTL ? 'اسم الدور (بالإنجليزي)' : 'Role Name (English)'}</label>
                      <input
                        type="text"
                        value={roleFormData.nameEn}
                        onChange={(e) => setRoleFormData({ ...roleFormData, nameEn: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('permissions')}</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                      {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-500 cursor-pointer transition-all">
                          <input
                            type="checkbox"
                            checked={roleFormData.permissions.includes(key)}
                            onChange={() => {
                              const newPerms = roleFormData.permissions.includes(key)
                                ? roleFormData.permissions.filter(p => p !== key)
                                : [...roleFormData.permissions, key];
                              setRoleFormData({ ...roleFormData, permissions: newPerms });
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-slate-900 dark:text-white">{label[isRTL ? 'ar' : 'en']}</span>
                            <span className="text-xs font-medium text-slate-400">{key}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsRoleModalOpen(false)}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-sm font-medium hover:bg-slate-200 transition-all"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all"
                    >
                      {t('save')}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Department Modal */}
      <AnimatePresence>
        {isDeptModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeptModalOpen(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
            >
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-600/10 p-2.5 rounded-lg border border-indigo-600/20">
                      <Building2 className="text-indigo-600" size={18} />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {editingDept ? t('editDepartment') : t('addDepartment')}
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsDeptModalOpen(false)}
                    className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleDeptSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('departmentNameAr')}</label>
                    <input
                      type="text"
                      value={deptFormData.nameAr}
                      onChange={(e) => setDeptFormData({ ...deptFormData, nameAr: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      required
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('departmentNameEn')}</label>
                    <input
                      type="text"
                      value={deptFormData.nameEn}
                      onChange={(e) => setDeptFormData({ ...deptFormData, nameEn: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('departmentColor')}</label>
                    <div className="flex flex-wrap gap-2">
                      {DEPARTMENT_COLORS.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setDeptFormData({ ...deptFormData, color })}
                          className={`w-9 h-9 rounded-lg border-2 transition-all ${deptFormData.color === color ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent hover:scale-105'}`}
                          style={{ backgroundColor: color }}
                          aria-label={color}
                        />
                      ))}
                    </div>
                  </div>

                  {deptError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm font-medium text-red-700 dark:text-red-400">
                      {deptError}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsDeptModalOpen(false)}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-sm font-medium hover:bg-slate-200 transition-all"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all"
                    >
                      {t('save')}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Department Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeptDeleteConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeptDeleteConfirm(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-6 border border-slate-200 dark:border-slate-700 text-center"
            >
              <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-red-600">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{t('deleteDepartment')}</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-2 text-sm">
                {t('confirmDeleteDepartment')}
              </p>
              <p className="text-slate-700 dark:text-slate-300 mb-6 text-sm font-semibold">
                {showDeptDeleteConfirm.name}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeptDeleteConfirm(null)}
                  className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-sm font-medium hover:bg-slate-200 transition-all"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleDeptDelete}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-all"
                >
                  {t('delete')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Permissions Matrix */}
      {activeTab !== 'departments' && (
      <div className="glass-1 rounded-xl border border-slate-200/50 dark:border-white/5 overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600/10 p-2.5 rounded-lg border border-indigo-600/20">
                <Settings2 className="text-indigo-600" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">مصفوفة الصلاحيات الذكية</h2>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Smart Permissions Matrix</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAddingCategory(true)}
                className="hidden md:flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 transition-all"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  {isRTL ? 'إضافة فئة جديدة' : 'Add New Category'}
                </span>
              </button>
              <div className="hidden md:flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs font-medium text-slate-400">Active System</span>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className={`w-full ${isRTL ? 'text-right' : 'text-left'} border-collapse`}>
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-medium">
                <th className="px-5 py-3 min-w-[200px]">الصلاحية / Permission</th>
                {ROLE_OPTIONS.map(role => (
                  <th key={role.value} className="px-5 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${role.color.replace('bg-', 'bg-opacity-20 bg-')}`}>
                        {role.label[i18n.language as 'ar' | 'en']}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="px-5 py-3 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="inline-block px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                      {t('customRole')}
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {categories.map((category) => (
                <React.Fragment key={category.id}>
                  <tr className="bg-indigo-50/30 dark:bg-indigo-900/10">
                    <td colSpan={ROLE_OPTIONS.length + 2} className="px-5 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                          {category.label[i18n.language as 'ar' | 'en']}
                        </span>
                      </div>
                    </td>
                  </tr>
                  {category.permissions.map((key) => {
                    const label = PERMISSION_LABELS[key];
                    return (
                      <tr key={key} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 group/row">
                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900 dark:text-white">{label.ar}</span>
                            <span className="text-xs font-medium text-slate-400">{label.en}</span>
                          </div>
                        </td>
                        {ROLE_OPTIONS.map(role => {
                          const hasPermission = (PERMISSIONS as any)[role.value]?.includes(key);
                          return (
                            <td key={role.value} className="px-10 py-6 text-center">
                              <div className="flex justify-center">
                                {hasPermission ? (
                                  <div className="w-10 h-10 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400 shadow-sm border border-green-100 dark:border-green-900/50 group-hover/row:scale-110 transition-transform">
                                    <Check size={20} strokeWidth={3} />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-navy-surface/50 flex items-center justify-center text-gray-300 dark:text-gray-700 border border-transparent">
                                    <X size={20} strokeWidth={3} />
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                        <td className="px-10 py-6 text-center">
                          <div className="flex justify-center">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-900/50">
                              <Settings2 size={20} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-8 bg-gray-50/50 dark:bg-navy-surface/50 border-t border-gray-100 dark:border-gray-800">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">
            * يمكن إضافة فئات صلاحيات جديدة برمجياً من خلال ملف الإعدادات لضمان مرونة النظام
          </p>
        </div>
      </div>
      )}
    </div>
  );
}
