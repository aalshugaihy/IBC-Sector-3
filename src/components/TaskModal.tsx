import React, { useState, useEffect } from 'react';
import { Task, User, Department, Committee } from '../types';
import { 
  X, Check, UserPlus, ListTree, History, 
  Link as LinkIcon, Info, Calendar, AlertCircle,
  ArrowRight, Clock, User as UserIcon, Edit2, Plus,
  ChevronRight, Search, Filter, Trash2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  DEPARTMENTS, MONTHS, STATUS_OPTIONS,
  REQUEST_TYPE_OPTIONS, ENTITY_CLASSIFICATION_OPTIONS, SECTOR_OPTIONS,
  OPERATIONAL_DEPARTMENT_OPTIONS, PURPOSE_OPTIONS, DIRECTION_OPTIONS,
  TRANSACTION_STATUS_OPTIONS, DELAY_STATUS_OPTIONS,
} from '../constants';
import { computeDelayStatus } from '../lib/delayStatus';
import { motion, AnimatePresence } from 'motion/react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id'> | Task) => void;
  onUpdateTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  task?: Task | null;
  users: User[];
  tasks: Task[];
  departments?: Department[];
  committees?: Committee[];
  initialMode?: 'view' | 'edit' | 'add';
}

type TabType = 'general' | 'dependencies' | 'subtasks' | 'history';

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen, onClose, onSave, onUpdateTask, onDeleteTask, task, users, tasks, departments, committees, initialMode = 'edit'
}) => {
  const departmentNames = (departments && departments.length > 0)
    ? departments.map(d => d.name)
    : DEPARTMENTS;
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [mode, setMode] = useState<'view' | 'edit' | 'add'>(initialMode);

  const emptyForm: Omit<Task, 'id'> = {
    title: '',
    department: departmentNames[0],
    month: MONTHS[0],
    status: 'not-started',
    priority: 'medium',
    classification: '',
    taskType: 'regular',
    completionPercentage: 0,
    teamMembers: [],
    assignedTo: '',
    plannedDate: '',
    startDate: '',
    endDate: '',
    actualDate: '',
    notes: '',
    obstacles: '',
    dependencies: [],
    parentTaskId: '',
    committeeId: '',
    refNo: '',
    // Request-tracker fields (merged from Excel)
    requestNo: '',
    requestType: null,
    requestingEntity: '',
    entityClassification: null,
    sector: '',
    purpose: null,
    direction: null,
    transactionNo: '',
    transactionName: '',
    transactionStatus: null,
    requestDate: '',
    dueDate: '',
    actualCloseDate: '',
  };
  const [formData, setFormData] = useState<Omit<Task, 'id'>>(emptyForm);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        department: task.department || departmentNames[0],
        month: task.month || MONTHS[0],
        status: task.status || 'not-started',
        priority: task.priority || 'medium',
        classification: task.classification || '',
        taskType: task.taskType || 'regular',
        completionPercentage: task.completionPercentage || 0,
        teamMembers: task.teamMembers || [],
        assignedTo: task.assignedTo || '',
        plannedDate: task.plannedDate || '',
        startDate: task.startDate || '',
        endDate: task.endDate || '',
        actualDate: task.actualDate || '',
        notes: task.notes || '',
        obstacles: task.obstacles || '',
        dependencies: task.dependencies || [],
        parentTaskId: task.parentTaskId || '',
        committeeId: task.committeeId || '',
        refNo: task.refNo || '',
        // Request-tracker fields
        requestNo: task.requestNo || '',
        requestType: task.requestType ?? null,
        requestingEntity: task.requestingEntity || '',
        entityClassification: task.entityClassification ?? null,
        sector: task.sector || '',
        purpose: task.purpose ?? null,
        direction: task.direction ?? null,
        transactionNo: task.transactionNo || '',
        transactionName: task.transactionName || '',
        transactionStatus: task.transactionStatus ?? null,
        requestDate: task.requestDate || '',
        dueDate: task.dueDate || '',
        actualCloseDate: task.actualCloseDate || '',
      });
      setMode(initialMode === 'add' ? 'edit' : initialMode);
    } else {
      setFormData(emptyForm);
      setMode('add');
    }
    setActiveTab('general');
  }, [task, isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (task?.id) {
      onSave({ ...formData, id: task.id } as Task);
    } else {
      onSave(formData);
    }
  };

  const toggleTeamMember = (userId: string) => {
    const currentMembers = formData.teamMembers || [];
    const isSelected = currentMembers.some(m => m.userId === userId);
    const newMembers = isSelected
      ? currentMembers.filter(m => m.userId !== userId)
      : [...currentMembers, { userId, role: 'member' }];
    setFormData({ ...formData, teamMembers: newMembers });
  };

  const updateMemberRole = (userId: string, role: string) => {
    const currentMembers = formData.teamMembers || [];
    const newMembers = currentMembers.map(m => 
      m.userId === userId ? { ...m, role } : m
    );
    setFormData({ ...formData, teamMembers: newMembers });
  };

  const toggleDependency = (taskId: string) => {
    const currentDeps = formData.dependencies || [];
    const newDeps = currentDeps.includes(taskId)
      ? currentDeps.filter(id => id !== taskId)
      : [...currentDeps, taskId];
    setFormData({ ...formData, dependencies: newDeps });
  };

  const formatHistoryValue = (field: string, value: any) => {
    if (!value) return '-';
    if (field === 'assignedTo') {
      const u = users.find(user => user.uid === value);
      return u ? (u.displayName || u.email) : value;
    }
    if (field === 'teamMembers' && Array.isArray(value)) {
      return value.map(m => {
        const uid = typeof m === 'string' ? m : m.userId;
        const role = typeof m === 'string' ? '' : ` (${m.role})`;
        const u = users.find(user => user.uid === uid);
        return u ? `${u.displayName || u.email}${role}` : uid;
      }).join(', ');
    }
    if (typeof value === 'boolean') return value ? t('yes') : t('no');
    return String(value);
  };

  const tabs: { id: TabType; label: string; icon: any; show: boolean }[] = [
    { id: 'general', label: t('general'), icon: Info, show: true },
    { id: 'dependencies', label: t('dependencies'), icon: LinkIcon, show: true },
    { id: 'subtasks', label: t('subtasks'), icon: ListTree, show: !!task?.id },
    { id: 'history', label: t('history'), icon: History, show: !!task?.id }
  ];

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtaskTitle.trim() || !task?.id) return;

    const newSubtask: Omit<Task, 'id'> = {
      title: subtaskTitle,
      department: formData.department,
      month: formData.month,
      status: 'not-started',
      priority: 'medium',
      completionPercentage: 0,
      parentTaskId: task.id,
      assignedTo: formData.assignedTo,
      teamMembers: [],
      startDate: formData.startDate,
      endDate: formData.endDate,
      plannedDate: formData.plannedDate,
      refNo: `${formData.refNo || 'TSK'}-SUB-${tasks.filter(t => t.parentTaskId === task.id).length + 1}`
    };

    onSave(newSubtask);
    setSubtaskTitle('');
    setIsAddingSubtask(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-500">
      <div className={`bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-500 flex flex-col relative ${isRTL ? 'text-right' : 'text-left'}`}>
        {/* Header */}
        <div className="sticky top-0 bg-slate-50 dark:bg-slate-800/50 px-6 py-4 rounded-t-2xl border-b border-slate-200 dark:border-slate-700 flex justify-between items-center z-10">
          <div className="flex items-center gap-4 relative">
            <div className={`p-3 rounded-xl shadow-sm ${task ? 'bg-gold/10 text-gold-dark' : 'bg-emerald-500/10 text-emerald-600'}`}>
              {task ? <Edit2 size={22} strokeWidth={2} /> : <Plus size={22} strokeWidth={2} />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-none mb-1">
                {mode === 'view' ? t('preview') : mode === 'edit' ? t('editEvent') : t('addEvent')}
              </h2>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em]">
                {formData.refNo || 'NEW-TASK'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {mode === 'view' && (
              <button
                onClick={() => setMode('edit')}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-semibold text-xs hover:bg-primary-dark transition-all"
              >
                <Edit2 size={16} />
                {t('editEvent')}
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex items-center gap-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 overflow-x-auto custom-scrollbar">
          {tabs.filter(tab => tab.show).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white dark:bg-slate-900/95">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                {activeTab === 'general' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Basic Info */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('eventName')}</label>
                  {mode === 'view' ? (
                    <div className="w-full bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-semibold text-sm">
                      {formData.title}
                    </div>
                  ) : (
                    <input
                      type="text"
                      required
                      className="w-full rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder={t('eventName')}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('refNo')}</label>
                  {mode === 'view' ? (
                    <div className="w-full bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm">
                      {formData.refNo}
                    </div>
                  ) : (
                    <input
                      type="text"
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary transition-all text-slate-900 dark:text-white text-sm shadow-sm"
                      value={formData.refNo}
                      onChange={(e) => setFormData({ ...formData, refNo: e.target.value })}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('classification')}</label>
                  {mode === 'view' ? (
                    <div className="w-full bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm">
                      {formData.classification}
                    </div>
                  ) : (
                    <input
                      type="text"
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary transition-all text-slate-900 dark:text-white text-sm shadow-sm"
                      value={formData.classification}
                      onChange={(e) => setFormData({ ...formData, classification: e.target.value })}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('taskType')}</label>
                  {mode === 'view' ? (
                    <div className="w-full bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm">
                      {t(`taskType${(formData.taskType || 'regular').charAt(0).toUpperCase() + (formData.taskType || 'regular').slice(1)}`)}
                    </div>
                  ) : (
                    <select
                      className="w-full rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors cursor-pointer"
                      value={formData.taskType || 'regular'}
                      onChange={(e) => setFormData({ ...formData, taskType: e.target.value as Task['taskType'] })}
                    >
                      <option value="regular">{t('taskTypeRegular')}</option>
                      <option value="recurring">{t('taskTypeRecurring')}</option>
                      <option value="committee">{t('taskTypeCommittee')}</option>
                    </select>
                  )}
                </div>

                {formData.taskType === 'committee' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('linkedCommittee')}</label>
                    {mode === 'view' ? (
                      <div className="w-full bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm">
                        {(committees || []).find(c => c.id === formData.committeeId)?.name || t('noCommittee')}
                      </div>
                    ) : (
                      <select
                        className="w-full rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors cursor-pointer"
                        value={formData.committeeId || ''}
                        onChange={(e) => setFormData({ ...formData, committeeId: e.target.value || null })}
                      >
                        <option value="">{t('noCommittee')}</option>
                        {(committees || []).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('priority')}</label>
                  {mode === 'view' ? (
                    <div className="w-full bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm">
                      {t(formData.priority || 'low')}
                    </div>
                  ) : (
                    <select
                      className="w-full rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors cursor-pointer"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                    >
                      <option value="low">{t('low')}</option>
                      <option value="medium">{t('medium')}</option>
                      <option value="high">{t('high')}</option>
                      <option value="urgent">{t('urgent')}</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('status')}</label>
                  {mode === 'view' ? (
                    <div className="w-full bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm">
                      {STATUS_OPTIONS.find(opt => opt.value === formData.status)?.label[i18n.language as 'ar' | 'en']}
                    </div>
                  ) : (
                    <select
                      className="w-full rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors cursor-pointer"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label[i18n.language as 'ar' | 'en']}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('department')}</label>
                  {mode === 'view' ? (
                    <div className="w-full bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm">
                      {formData.department}
                    </div>
                  ) : (
                    <select
                      className="w-full rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors cursor-pointer"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    >
                      {departmentNames.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('month')}</label>
                  {mode === 'view' ? (
                    <div className="w-full bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm">
                      {formData.month}
                    </div>
                  ) : (
                    <select
                      className="w-full rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors cursor-pointer"
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    >
                      {MONTHS.map(month => <option key={month} value={month}>{month}</option>)}
                    </select>
                  )}
                </div>

                {/* Dates */}
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('startDate')}</label>
                    {mode === 'view' ? (
                      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-black text-slate-900 dark:text-white">
                        {formData.startDate || '-'}
                      </div>
                    ) : (
                      <input
                        type="date"
                        className="w-full rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors cursor-pointer"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('endDate')}</label>
                    {mode === 'view' ? (
                      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-black text-slate-900 dark:text-white">
                        {formData.endDate || '-'}
                      </div>
                    ) : (
                      <input
                        type="date"
                        className="w-full rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors cursor-pointer"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('plannedDate')}</label>
                    {mode === 'view' ? (
                      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-black text-slate-900 dark:text-white">
                        {formData.plannedDate || '-'}
                      </div>
                    ) : (
                      <input
                        type="date"
                        className="w-full rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors cursor-pointer"
                        value={formData.plannedDate}
                        onChange={(e) => setFormData({ ...formData, plannedDate: e.target.value })}
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('actualDate')}</label>
                    {mode === 'view' ? (
                      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-black text-slate-900 dark:text-white">
                        {formData.actualDate || '-'}
                      </div>
                    ) : (
                      <input
                        type="date"
                        className="w-full rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors cursor-pointer"
                        value={formData.actualDate}
                        onChange={(e) => setFormData({ ...formData, actualDate: e.target.value })}
                      />
                    )}
                  </div>
                </div>

                {/* ===== Request Tracker — request details ===== */}
                <div className="md:col-span-2 p-5 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-xl border border-indigo-100 dark:border-indigo-500/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300">{t('requestDetails')}</h3>
                    {formData.requestNo && (
                      <span className="text-[10px] font-mono font-bold px-2 py-1 bg-white dark:bg-slate-900 rounded border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300">
                        {formData.requestNo}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{t('requestType')}</label>
                      {mode === 'view' ? (
                        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white">
                          {REQUEST_TYPE_OPTIONS.find(o => o.value === formData.requestType)?.label[i18n.language as 'ar' | 'en'] || '-'}
                        </div>
                      ) : (
                        <select
                          className="w-full rounded-lg px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                          value={formData.requestType || ''}
                          onChange={(e) => setFormData({ ...formData, requestType: (e.target.value || null) as any })}
                        >
                          <option value="">-</option>
                          {REQUEST_TYPE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label[i18n.language as 'ar' | 'en']}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{t('requestingEntity')}</label>
                      {mode === 'view' ? (
                        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white">
                          {formData.requestingEntity || '-'}
                        </div>
                      ) : (
                        <input
                          type="text"
                          className="w-full rounded-lg px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                          value={formData.requestingEntity || ''}
                          onChange={(e) => setFormData({ ...formData, requestingEntity: e.target.value })}
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{t('entityClassification')}</label>
                      {mode === 'view' ? (
                        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white">
                          {ENTITY_CLASSIFICATION_OPTIONS.find(o => o.value === formData.entityClassification)?.label[i18n.language as 'ar' | 'en'] || '-'}
                        </div>
                      ) : (
                        <select
                          className="w-full rounded-lg px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                          value={formData.entityClassification || ''}
                          onChange={(e) => setFormData({ ...formData, entityClassification: (e.target.value || null) as any })}
                        >
                          <option value="">-</option>
                          {ENTITY_CLASSIFICATION_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label[i18n.language as 'ar' | 'en']}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{t('sector')}</label>
                      {mode === 'view' ? (
                        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white">
                          {formData.sector || '-'}
                        </div>
                      ) : (
                        <select
                          className="w-full rounded-lg px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                          value={formData.sector || ''}
                          onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                        >
                          <option value="">-</option>
                          {SECTOR_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label[i18n.language as 'ar' | 'en']}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{t('purpose')}</label>
                      {mode === 'view' ? (
                        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white">
                          {PURPOSE_OPTIONS.find(o => o.value === formData.purpose)?.label[i18n.language as 'ar' | 'en'] || '-'}
                        </div>
                      ) : (
                        <select
                          className="w-full rounded-lg px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                          value={formData.purpose || ''}
                          onChange={(e) => setFormData({ ...formData, purpose: (e.target.value || null) as any })}
                        >
                          <option value="">-</option>
                          {PURPOSE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label[i18n.language as 'ar' | 'en']}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{t('direction')}</label>
                      {mode === 'view' ? (
                        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white">
                          {DIRECTION_OPTIONS.find(o => o.value === formData.direction)?.label[i18n.language as 'ar' | 'en'] || '-'}
                        </div>
                      ) : (
                        <select
                          className="w-full rounded-lg px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                          value={formData.direction || ''}
                          onChange={(e) => setFormData({ ...formData, direction: (e.target.value || null) as any })}
                        >
                          <option value="">-</option>
                          {DIRECTION_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label[i18n.language as 'ar' | 'en']}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Request timing */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-indigo-100 dark:border-indigo-500/20">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{t('requestDate')}</label>
                      {mode === 'view' ? (
                        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white">{formData.requestDate || '-'}</div>
                      ) : (
                        <input type="date" className="w-full rounded-lg px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                          value={formData.requestDate || ''} onChange={(e) => setFormData({ ...formData, requestDate: e.target.value })} />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{t('dueDate')}</label>
                      {mode === 'view' ? (
                        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white">{formData.dueDate || '-'}</div>
                      ) : (
                        <input type="date" className="w-full rounded-lg px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                          value={formData.dueDate || ''} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{t('actualCloseDate')}</label>
                      {mode === 'view' ? (
                        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white">{formData.actualCloseDate || '-'}</div>
                      ) : (
                        <input type="date" className="w-full rounded-lg px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                          value={formData.actualCloseDate || ''} onChange={(e) => setFormData({ ...formData, actualCloseDate: e.target.value })} />
                      )}
                    </div>
                  </div>

                  {/* Auto-computed delay status */}
                  {(() => {
                    const ds = computeDelayStatus(formData);
                    const opt = DELAY_STATUS_OPTIONS.find(o => o.value === ds);
                    return (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs text-slate-600 dark:text-slate-400">{t('delayStatus')}:</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${opt?.color || ''}`}>
                          {opt?.label[i18n.language as 'ar' | 'en']}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* ===== Transaction details (only when relevant) ===== */}
                <div className="md:col-span-2 p-5 bg-amber-50/50 dark:bg-amber-500/5 rounded-xl border border-amber-100 dark:border-amber-500/20 space-y-4">
                  <h3 className="text-sm font-bold text-amber-900 dark:text-amber-300">{t('transactionDetails')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{t('transactionNo')}</label>
                      {mode === 'view' ? (
                        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white">{formData.transactionNo || '-'}</div>
                      ) : (
                        <input type="text" className="w-full rounded-lg px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                          value={formData.transactionNo || ''} onChange={(e) => setFormData({ ...formData, transactionNo: e.target.value })} />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{t('transactionName')}</label>
                      {mode === 'view' ? (
                        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white">{formData.transactionName || '-'}</div>
                      ) : (
                        <input type="text" className="w-full rounded-lg px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                          value={formData.transactionName || ''} onChange={(e) => setFormData({ ...formData, transactionName: e.target.value })} />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{t('transactionStatus')}</label>
                      {mode === 'view' ? (
                        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white">
                          {TRANSACTION_STATUS_OPTIONS.find(o => o.value === formData.transactionStatus)?.label[i18n.language as 'ar' | 'en'] || '-'}
                        </div>
                      ) : (
                        <select className="w-full rounded-lg px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                          value={formData.transactionStatus || ''}
                          onChange={(e) => setFormData({ ...formData, transactionStatus: (e.target.value || null) as any })}>
                          <option value="">-</option>
                          {TRANSACTION_STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label[i18n.language as 'ar' | 'en']}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>

                {/* Assignment */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('responsible')}</label>
                  {mode === 'view' ? (
                    <div className="w-full bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm flex items-center gap-2">
                      {users.find(u => u.uid === formData.assignedTo)?.photoURL && (
                        <img src={users.find(u => u.uid === formData.assignedTo)?.photoURL} alt="" className="w-6 h-6 rounded-full" />
                      )}
                      {users.find(u => u.uid === formData.assignedTo)?.displayName || users.find(u => u.uid === formData.assignedTo)?.email || '-'}
                    </div>
                  ) : (
                    <select
                      className="w-full rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors cursor-pointer"
                      value={formData.assignedTo}
                      onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    >
                      <option value="">{t('all')}</option>
                      {users.map(user => (
                        <option key={user.uid} value={user.uid}>{user.displayName || user.email}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('parentTask')}</label>
                  {mode === 'view' ? (
                    <div className="w-full bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm">
                      {tasks.find(tItem => tItem.id === formData.parentTaskId)?.title || '-'}
                    </div>
                  ) : (
                    <select
                      className="w-full rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors cursor-pointer"
                      value={formData.parentTaskId}
                      onChange={(e) => setFormData({ ...formData, parentTaskId: e.target.value })}
                    >
                      <option value="">{t('none')}</option>
                      {tasks.filter(tItem => tItem.id !== task?.id && !tItem.parentTaskId).map(tItem => (
                        <option key={tItem.id} value={tItem.id}>{tItem.title}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('completionPercentage')}</label>
                  {mode === 'view' ? (
                    <div className="flex items-center gap-4 p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-700"
                          style={{ width: `${formData.completionPercentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-primary dark:text-white tabular-nums w-12 text-right">{formData.completionPercentage}%</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-primary"
                        value={formData.completionPercentage}
                        onChange={(e) => setFormData({ ...formData, completionPercentage: parseInt(e.target.value) })}
                      />
                      <span className="text-sm font-bold text-primary dark:text-white tabular-nums w-12 text-right">{formData.completionPercentage}%</span>
                    </div>
                  )}
                </div>

                {/* Team Members */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('teamMembers')}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.map(user => {
                      const member = formData.teamMembers?.find(m => m.userId === user.uid);
                      const isSelected = !!member;
                      return (
                        <div
                          key={user.uid}
                          className={`flex flex-col gap-3 p-4 rounded-xl border transition-all relative ${
                            isSelected
                              ? 'bg-primary/5 border-primary/30 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => toggleTeamMember(user.uid)}
                              className="relative shrink-0"
                            >
                              <img src={user.photoURL || undefined} alt="" className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm" />
                              {isSelected && (
                                <div className="absolute -top-1 -right-1 bg-primary text-white rounded-full p-1 shadow">
                                  <Check size={10} strokeWidth={3} />
                                </div>
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-semibold truncate block text-slate-900 dark:text-white">{user.displayName || user.email}</span>
                              <span className="text-[10px] text-slate-400 uppercase tracking-wide">{user.role}</span>
                            </div>
                          </div>

                          {isSelected && member && (
                            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-1">{t('taskRole') || 'Task Role'}</label>
                              {mode === 'view' ? (
                                <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300">
                                  {t(member.role)}
                                </div>
                              ) : (
                                <select
                                  value={member.role}
                                  onChange={(e) => updateMemberRole(user.uid, e.target.value)}
                                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary transition-all cursor-pointer"
                                >
                                  <option value="member">{t('member')}</option>
                                  <option value="editor">{t('editor')}</option>
                                  <option value="viewer">{t('viewer')}</option>
                                  <option value="supervisor">{t('supervisor')}</option>
                                </select>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">{t('dependencies')}</label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="text"
                        placeholder={t('search')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-900 focus:ring-2 focus:ring-gold transition-all shadow-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-64 overflow-y-auto pr-4 custom-scrollbar p-2">
                    {tasks
                      .filter(tItem => {
                        if (tItem.id === task?.id) return false;
                        if (tItem.parentTaskId === task?.id) return false;
                        if (searchQuery && !tItem.title.toLowerCase().includes(searchQuery.toLowerCase()) && !tItem.refNo?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                        return true;
                      })
                      .map(tItem => {
                        const isSelected = formData.dependencies?.includes(tItem.id!);
                        return (
                          <button
                            key={tItem.id}
                            type="button"
                            onClick={() => toggleDependency(tItem.id!)}
                            className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left group relative ${
                              isSelected 
                                ? 'bg-gold/5 border-gold shadow-md gold-glow' 
                                : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
                              isSelected ? 'bg-gold border-gold' : 'border-slate-200'
                            }`}>
                              {isSelected && <Check size={14} className="text-white" strokeWidth={4} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-1">{tItem.refNo}</span>
                              <h4 className={`font-black text-xs truncate uppercase tracking-tight ${isSelected ? 'text-gold-dark' : 'text-slate-900'}`}>
                                {tItem.title}
                              </h4>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Notes & Obstacles */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('notes')}</label>
                  {mode === 'view' ? (
                    <div className="w-full bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm min-h-[100px] whitespace-pre-wrap">
                      {formData.notes || '-'}
                    </div>
                  ) : (
                    <textarea
                      rows={4}
                      className="w-full rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder={t('notes')}
                    />
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('obstacles')}</label>
                  {mode === 'view' ? (
                    <div className="w-full bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm min-h-[100px] whitespace-pre-wrap">
                      {formData.obstacles || '-'}
                    </div>
                  ) : (
                    <textarea
                      rows={4}
                      className="w-full rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      value={formData.obstacles}
                      onChange={(e) => setFormData({ ...formData, obstacles: e.target.value })}
                      placeholder={t('obstacles')}
                    />
                  )}
                </div>
              </div>
            )}

            {activeTab === 'dependencies' && (
              <div className="space-y-6">
                <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 flex items-start gap-4">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    <LinkIcon className="text-indigo-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-indigo-900">{t('dependencies')}</h3>
                    <p className="text-sm text-indigo-700/70">{t('dependenciesDescription') || 'Select tasks that must be completed before this task can start.'}</p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder={t('search')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {tasks
                    .filter(tItem => {
                      if (tItem.id === task?.id) return false;
                      if (tItem.parentTaskId === task?.id) return false;
                      if (searchQuery && !tItem.title.toLowerCase().includes(searchQuery.toLowerCase()) && !tItem.refNo?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                      return true;
                    })
                    .map(tItem => {
                      const isSelected = formData.dependencies?.includes(tItem.id!);
                      const status = STATUS_OPTIONS.find(s => s.value === tItem.status);
                      const priorityColors = {
                        low: 'bg-slate-100 text-slate-600 border-slate-200',
                        medium: 'bg-blue-100 text-blue-600 border-blue-200',
                        high: 'bg-orange-100 text-orange-600 border-orange-200',
                        urgent: 'bg-red-100 text-red-600 border-red-200'
                      };
                      
                      return (
                        <button
                          key={tItem.id}
                          type="button"
                          onClick={() => toggleDependency(tItem.id!)}
                          className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group relative ${
                            isSelected 
                              ? 'bg-indigo-50 border-indigo-500' 
                              : 'bg-white border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
                            isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                          }`}>
                            {isSelected && <Check size={14} className="text-white" />}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tItem.refNo}</span>
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${priorityColors[tItem.priority]}`}>
                                {t(tItem.priority)}
                              </span>
                            </div>
                            <h4 className={`font-black text-sm truncate ${isSelected ? 'text-indigo-600' : 'text-slate-900'}`}>
                              {tItem.title}
                            </h4>
                          </div>

                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${status?.color}`}>
                              {status?.label[i18n.language as 'ar' | 'en']}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500" style={{ width: `${tItem.completionPercentage}%` }} />
                              </div>
                              <span className="text-[10px] font-black text-slate-500">{tItem.completionPercentage}%</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {activeTab === 'subtasks' && task?.id && (
              <div className="space-y-6">
                <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      <ListTree className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <h3 className="font-black text-blue-900">{t('subtasks')}</h3>
                      <p className="text-sm text-blue-700/70">{t('subtasksDescription') || 'View and manage smaller tasks that are part of this main task.'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddingSubtask(!isAddingSubtask)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                  >
                    <Plus size={16} />
                    {t('addSubtask') || 'Add Subtask'}
                  </button>
                </div>

                {isAddingSubtask && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 bg-white rounded-3xl border-2 border-blue-500/30 shadow-xl mb-6">
                      <div className="flex gap-4">
                        <input
                          type="text"
                          autoFocus
                          placeholder={t('subtaskTitle') || 'Enter subtask title...'}
                          className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold text-slate-900"
                          value={subtaskTitle}
                          onChange={(e) => setSubtaskTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask(e)}
                        />
                        <button
                          type="button"
                          onClick={handleAddSubtask}
                          disabled={!subtaskTitle.trim()}
                          className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-black disabled:opacity-50"
                        >
                          {t('add')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingSubtask(false)}
                          className="px-4 py-2 text-slate-500 font-bold text-xs"
                        >
                          {t('cancel')}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {tasks.filter(t => t.parentTaskId === task.id).map(subtask => {
                    const status = STATUS_OPTIONS.find(s => s.value === subtask.status);
                    return (
                      <div key={subtask.id} className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                            {subtask.refNo}
                          </span>
                          <div className="flex items-center gap-2">
                            <select
                              value={subtask.status}
                              onChange={(e) => onUpdateTask?.({ ...subtask, status: e.target.value as any })}
                              className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${status?.color}`}
                            >
                              {STATUS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label[i18n.language as 'ar' | 'en']}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => onDeleteTask?.(subtask.id!)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <h4 className="font-black text-slate-900 mb-4 group-hover:text-indigo-600 transition-colors">{subtask.title}</h4>
                        <div className="flex items-center gap-4">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: `${subtask.completionPercentage}%` }} />
                          </div>
                          <span className="text-xs font-black text-slate-900">{subtask.completionPercentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                  {tasks.filter(t => t.parentTaskId === task.id).length === 0 && (
                    <div className="col-span-2 text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                      <ListTree className="mx-auto text-slate-200 mb-4" size={48} />
                      <p className="text-slate-500 font-bold">{t('noTasksFound')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'history' && task?.id && (
              <div className="space-y-6">
                <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-4">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    <History className="text-amber-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-amber-900">{t('history')}</h3>
                    <p className="text-sm text-amber-700/70">{t('historyDescription') || 'Track all changes and updates made to this task.'}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-black text-amber-600 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-amber-100">
                    <Clock size={14} />
                    {task.history?.length || 0} {t('updates')}
                  </div>
                </div>

                <div className="space-y-4">
                  {(!task.history || task.history.length === 0) ? (
                    <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                      <Clock className="mx-auto text-slate-200 mb-4" size={48} />
                      <p className="text-slate-500 font-bold">{t('noHistory')}</p>
                    </div>
                  ) : (
                    <div className="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-100 before:to-transparent">
                      {task.history.slice().reverse().map((entry, idx) => {
                        const user = users.find(u => u.uid === entry.userId);
                        return (
                          <div key={idx} className="relative flex items-start gap-6">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-50 text-slate-500 shadow-sm shrink-0 z-10 overflow-hidden">
                              {user?.photoURL ? (
                                <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <UserIcon size={16} />
                              )}
                            </div>
                            <div className="flex-1 p-5 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-slate-900 text-sm">{user?.displayName || entry.userName}</span>
                                  <span className="text-[10px] text-slate-400 font-bold">•</span>
                                  <span className="text-[10px] text-slate-400 font-bold">{user?.role || t('member')}</span>
                                </div>
                                <time className="font-mono text-[10px] text-indigo-500 font-black bg-indigo-50 px-2 py-1 rounded-lg">
                                  {new Date(entry.timestamp).toLocaleString(i18n.language)}
                                </time>
                              </div>
                              <div className="space-y-2">
                                {entry.changes.map((change, cIdx) => (
                                  <div key={cIdx} className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                      <span className="font-black uppercase tracking-widest text-[9px] text-indigo-600">
                                        {t(change.field)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs">
                                      <div className="flex-1 min-w-0 px-3 py-1.5 bg-red-50/30 rounded-lg border border-red-100/30">
                                        <span className="line-through opacity-50 font-bold truncate block text-slate-500">{formatHistoryValue(change.field, change.oldValue)}</span>
                                      </div>
                                      <ArrowRight size={14} className={`text-slate-300 shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
                                      <div className="flex-1 min-w-0 px-3 py-1.5 bg-green-50/30 rounded-lg border border-green-100/30">
                                        <span className="font-black text-slate-700 truncate block">{formatHistoryValue(change.field, change.newValue)}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>
        </motion.div>
      </AnimatePresence>
    </div>

        {/* Footer */}
        {mode !== 'view' && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors"
            >
              {t('save')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

