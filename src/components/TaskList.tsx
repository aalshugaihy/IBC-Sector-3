import React, { useState, useRef } from 'react';
import { Task, User, Department } from '../types';
import { 
  Trash2, Edit2, Plus, Filter, 
  Search, Calendar, ArrowUpDown, MoreVertical,
  CheckSquare, Square, UserPlus, History, Link as LinkIcon, RefreshCw, X,
  Archive, RotateCcw, ChevronDown, ChevronRight, Download, Upload, LayoutGrid, List as ListIcon,
  AlertCircle, Clock, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DEPARTMENTS, MONTHS, STATUS_OPTIONS, getStatusByMonth } from '../constants';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { isBefore, parseISO, startOfDay } from 'date-fns';
import { TaskModal } from './TaskModal';
import { TaskHistoryModal } from './TaskHistoryModal';
import { KanbanBoard } from './KanbanBoard';
import * as XLSX from 'xlsx';

interface TaskListProps {
  tasks: Task[];
  users: User[];
  currentUser?: User | null;
  departments?: Department[];
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onBulkUpdate: (taskIds: string[], updates: Partial<Task>) => void;
  onBulkDelete: (taskIds: string[]) => void;
  onSyncInitialTasks?: () => void;
  onEditTask: (task: Task) => void;
  onViewTask?: (task: Task) => void;
  onOpenHistory: (task: Task) => void;
  onOpenAddModal: () => void;
  defaultView?: 'table' | 'kanban';
}

const isUrgent = (task: Task) => {
  if (task.status === 'completed') return false;
  if (task.priority === 'urgent') return true;
  if (!task.endDate) return false;
  const today = startOfDay(new Date());
  const end = startOfDay(parseISO(task.endDate));
  return isBefore(end, today);
};

export const TaskList: React.FC<TaskListProps> = ({
  tasks, users, currentUser, departments, onUpdateTask, onDeleteTask, onAddTask, onBulkUpdate, onBulkDelete, onSyncInitialTasks,
  onEditTask, onViewTask, onOpenHistory, onOpenAddModal, defaultView = 'table'
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const isMonitor = currentUser?.role === 'monitor';
  const departmentNames = (departments && departments.length > 0)
    ? departments.map(d => d.name)
    : DEPARTMENTS;

  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterResponsible, setFilterResponsible] = useState<string>('all');
  const [filterTeamMember, setFilterTeamMember] = useState<string>('all');
  const [filterTaskType, setFilterTaskType] = useState<string>('all');
  const [dateFilterType, setDateFilterType] = useState<'plannedDate' | 'startDate' | 'endDate' | 'actualDate'>('plannedDate');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Task; direction: 'asc' | 'desc' } | null>({ key: 'createdAt', direction: 'desc' });
  
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>(defaultView);
  const [pendingUpdates, setPendingUpdates] = useState<{ task: Task; newStatus: string; newPercentage: number }[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [expandedParents, setExpandedParents] = useState<string[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      const updates: { task: Task; newStatus: string; newPercentage: number }[] = [];

      data.forEach(row => {
        const refNo = row['Reference No'] || row['رقم المرجع'];
        const title = row['Task Name'] || row['اسم المهمة'];
        const status = row['Status'] || row['الحالة'];
        const percentage = row['Completion %'] || row['نسبة الإنجاز'];

        const task = tasks.find(t => t.refNo === refNo || t.title === title);
        if (task) {
          updates.push({
            task,
            newStatus: status || task.status,
            newPercentage: percentage !== undefined ? Number(percentage) : task.completionPercentage
          });
        }
      });

      setPendingUpdates(updates);
      setIsReviewModalOpen(true);
    };
    reader.readAsBinaryString(file);
  };

  const approveUpdates = () => {
    pendingUpdates.forEach(update => {
      onUpdateTask({
        ...update.task,
        status: update.newStatus as any,
        completionPercentage: update.newPercentage
      });
    });
    setPendingUpdates([]);
    setIsReviewModalOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearFilters = () => {
    setFilterDept('all');
    setFilterMonth('all');
    setFilterStatus('all');
    setFilterResponsible('all');
    setFilterTeamMember('all');
    setFilterTaskType('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setSearchTerm('');
  };

  const handleExportCSV = () => {
    const headers = [
      t('refNo'), t('eventName'), t('department'), t('month'), t('status'), 
      t('priority'), t('responsible'), t('startDate'), t('endDate'), t('plannedDate'), t('completionPercentage')
    ];
    
    const csvRows = filteredTasks.map(task => [
      `"${task.refNo || ''}"`,
      `"${task.title.replace(/"/g, '""')}"`,
      `"${task.department}"`,
      `"${task.month}"`,
      `"${STATUS_OPTIONS.find(s => s.value === task.status)?.label[i18n.language as 'ar' | 'en']}"`,
      `"${t(task.priority || 'low')}"`,
      `"${users.find(u => u.uid === task.assignedTo)?.displayName || users.find(u => u.uid === task.assignedTo)?.email || ''}"`,
      `"${task.startDate || ''}"`,
      `"${task.endDate || ''}"`,
      `"${task.plannedDate || ''}"`,
      `"${task.completionPercentage}%"`
    ]);

    const csvContent = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tasks_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleParent = (parentId: string) => {
    setExpandedParents(prev => 
      prev.includes(parentId) ? prev.filter(id => id !== parentId) : [...prev, parentId]
    );
  };

  const handleSort = (key: keyof Task) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    
    let aValue: any = a[key] || '';
    let bValue: any = b[key] || '';

    // Handle priority sorting
    if (key === 'priority') {
      const priorityOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1, '': 0 };
      aValue = priorityOrder[a.priority || ''] || 0;
      bValue = priorityOrder[b.priority || ''] || 0;
    }

    // Handle timestamp sorting
    if (key === 'createdAt' || key === 'updatedAt') {
      aValue = aValue ? new Date(aValue).getTime() : 0;
      bValue = bValue ? new Date(bValue).getTime() : 0;
    }

    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredTasks = sortedTasks.filter(task => {
    const archiveMatch = showArchived ? task.isArchived : !task.isArchived;
    const deptMatch = filterDept === 'all' || task.department === filterDept;
    const monthMatch = filterMonth === 'all' || task.month === filterMonth;
    const statusMatch = filterStatus === 'all' || task.status === filterStatus;
    const responsibleMatch = filterResponsible === 'all' || task.assignedTo === filterResponsible;
    const teamMatch = filterTeamMember === 'all' || task.teamMembers?.some(m => m.userId === filterTeamMember);
    const taskTypeMatch = filterTaskType === 'all' || task.taskType === filterTaskType || (filterTaskType === 'regular' && !task.taskType);

    const taskDate = task[dateFilterType];
    const dateMatch = (!filterDateFrom || (taskDate && taskDate >= filterDateFrom)) &&
                     (!filterDateTo || (taskDate && taskDate <= filterDateTo));

    const searchMatch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       task.refNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       task.classification?.toLowerCase().includes(searchTerm.toLowerCase());
    return archiveMatch && deptMatch && monthMatch && statusMatch && responsibleMatch && teamMatch && taskTypeMatch && dateMatch && searchMatch;
  });

  // Group tasks into hierarchy
  const parentTasks = filteredTasks.filter(t => !t.parentTaskId);
  const subtasks = filteredTasks.filter(t => t.parentTaskId);

  const allSelected = filteredTasks.length > 0 && filteredTasks.every(t => selectedTaskIds.includes(t.id!));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedTaskIds(prev => prev.filter(id => !filteredTasks.some(t => t.id === id)));
    } else {
      const newIds = filteredTasks.map(t => t.id!).filter(id => !selectedTaskIds.includes(id));
      setSelectedTaskIds(prev => [...prev, ...newIds]);
    }
  };

  const toggleSelectTask = (id: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkStatusChange = (status: Task['status']) => {
    onBulkUpdate(selectedTaskIds, { status });
    setSelectedTaskIds([]);
  };

  const handleBulkAssign = (userId: string) => {
    onBulkUpdate(selectedTaskIds, { assignedTo: userId });
    setSelectedTaskIds([]);
  };

  const handleBulkDelete = () => {
    if (window.confirm(t('confirmDelete'))) {
      onBulkDelete(selectedTaskIds);
      setSelectedTaskIds([]);
    }
  };

  const handleSyncStatuses = () => {
    filteredTasks.forEach(task => {
      const newStatus = getStatusByMonth(task.month);
      if (task.status !== newStatus) {
        onBulkUpdate([task.id!], { 
          status: newStatus,
          completionPercentage: newStatus === 'completed' ? 100 : task.completionPercentage 
        });
      }
    });
  };

  const handleBulkArchive = () => {
    if (window.confirm(t('confirmBulkArchive'))) {
      onBulkUpdate(selectedTaskIds, { isArchived: true });
      setSelectedTaskIds([]);
    }
  };

  const handleBulkPriorityChange = (priority: Task['priority']) => {
    onBulkUpdate(selectedTaskIds, { priority });
    setSelectedTaskIds([]);
  };

  const handleBulkDepartmentChange = (department: string) => {
    onBulkUpdate(selectedTaskIds, { department });
    setSelectedTaskIds([]);
  };

  const handleCopyTask = (task: Task) => {
    const { id, createdAt, updatedAt, ...rest } = task;
    onAddTask({
      ...rest,
      title: `${task.title} (${t('copyTask')})`,
      createdAt: undefined,
      updatedAt: undefined
    } as any);
  };

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-500">
      {/* Filters & Search */}
      <div className="glass-1 p-4 rounded-xl shadow-xl border border-slate-200/50 dark:border-white/5 space-y-6 relative overflow-hidden">
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative">
          <div className="relative flex-1 w-full max-w-3xl">
            <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gold opacity-50`} size={18} />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full ${isRTL ? 'pr-16 pl-6' : 'pl-16 pr-6'} py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-gold dark:text-white transition-all text-sm placeholder:text-white/30`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-all duration-300 ${viewMode === 'table' ? 'bg-gradient-gold-premium text-navy shadow-md' : 'text-white/40 hover:text-white'}`}
              >
                <ListIcon size={18} />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded-lg transition-all duration-300 ${viewMode === 'kanban' ? 'bg-gradient-gold-premium text-navy shadow-md' : 'text-white/40 hover:text-white'}`}
              >
                <LayoutGrid size={18} />
              </button>
            </div>
            <div className="h-10 w-px bg-white/10 hidden lg:block" />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx, .xls"
              className="hidden"
            />
            <div className="flex flex-wrap gap-2">
              <ActionButton onClick={() => fileInputRef.current?.click()} icon={<Upload size={20} />} label={t('uploadExcel')} color="blue" />
              <ActionButton onClick={onSyncInitialTasks} icon={<RefreshCw size={20} />} label={t('syncWithSchedule')} color="purple" />
              <ActionButton onClick={handleSyncStatuses} icon={<RefreshCw size={20} />} label={t('syncStatuses')} color="navy" />
              <ActionButton onClick={handleExportCSV} icon={<Download size={20} />} label={t('exportToCSV')} color="emerald" />
              <ActionButton 
                onClick={() => setShowArchived(!showArchived)} 
                icon={<Archive size={20} />} 
                label={showArchived ? t('hideArchived') : t('showArchived')} 
                color={showArchived ? 'orange' : 'gray'} 
              />
              <ActionButton onClick={handleClearFilters} icon={<RotateCcw size={20} />} label={t('clearFilters')} color="rose" />
            </div>
            {!isMonitor && (
              <button
                onClick={onOpenAddModal}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
              >
                <Plus size={24} />
                <span>{t('addEvent')}</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <FilterSelect label={t('filterByDepartment')} value={filterDept} onChange={setFilterDept} options={departmentNames} allLabel={t('all')} />
          <FilterSelect label={t('filterByMonth')} value={filterMonth} onChange={setFilterMonth} options={MONTHS} allLabel={t('all')} />
          <FilterSelect label={t('filterByStatus')} value={filterStatus} onChange={setFilterStatus} options={STATUS_OPTIONS.map(s => s.value)} allLabel={t('all')} displayMap={Object.fromEntries(STATUS_OPTIONS.map(s => [s.value, s.label[i18n.language as 'ar' | 'en']]))} />
          <FilterSelect label={t('filterByResponsible')} value={filterResponsible} onChange={setFilterResponsible} options={users.map(u => u.uid)} allLabel={t('all')} displayMap={Object.fromEntries(users.map(u => [u.uid, u.displayName || u.email]))} />
          <FilterSelect label={t('filterByTeamMember')} value={filterTeamMember} onChange={setFilterTeamMember} options={users.map(u => u.uid)} allLabel={t('all')} displayMap={Object.fromEntries(users.map(u => [u.uid, u.displayName || u.email]))} />
          <FilterSelect
            label={t('filterByTaskType')}
            value={filterTaskType}
            onChange={setFilterTaskType}
            options={['regular', 'recurring', 'committee']}
            allLabel={t('allTaskTypes')}
            displayMap={{ regular: t('taskTypeRegular'), recurring: t('taskTypeRecurring'), committee: t('taskTypeCommittee') }}
          />

          <div className="lg:col-span-3 xl:col-span-1 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 px-1">{t('dateFilterType') || 'Date Filter Type'}</label>
              <select
                value={dateFilterType}
                onChange={(e) => setDateFilterType(e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-gold transition-all cursor-pointer"
              >
                <option value="plannedDate">{t('plannedDate')}</option>
                <option value="startDate">{t('startDate')}</option>
                <option value="endDate">{t('endDate')}</option>
                <option value="actualDate">{t('actualDate')}</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 px-1">{t('from')}</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-gold transition-all cursor-pointer"
              />
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 px-1">{t('to')}</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-gold transition-all cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedTaskIds.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-4 p-4 bg-primary/5 border border-primary/20 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-gold-premium rounded-lg flex items-center justify-center shadow-md">
                <CheckSquare size={16} className="text-navy" />
              </div>
              <span className="text-sm font-semibold text-gold">
                {selectedTaskIds.length} {t('selectTasks')}
              </span>
            </div>
            
            <div className="h-8 w-px bg-gold/20 hidden sm:block" />
            
            <div className="flex flex-wrap items-center gap-3">
              <select
                onChange={(e) => handleBulkStatusChange(e.target.value as Task['status'])}
                className="bg-navy/50 border border-gold/20 rounded-lg px-3 py-1.5 text-xs text-gold focus:ring-2 focus:ring-gold transition-all cursor-pointer"
                value=""
              >
                <option value="" disabled className="bg-navy">{t('changeStatus')}</option>
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-navy">{opt.label[i18n.language as 'ar' | 'en']}</option>
                ))}
              </select>

              <select
                onChange={(e) => handleBulkAssign(e.target.value)}
                className="bg-navy/50 border border-gold/20 rounded-lg px-3 py-1.5 text-xs text-gold focus:ring-2 focus:ring-gold transition-all cursor-pointer"
                value=""
              >
                <option value="" disabled className="bg-navy">{t('assignTo')}</option>
                {users.map(user => (
                  <option key={user.uid} value={user.uid} className="bg-navy">{user.displayName || user.email}</option>
                ))}
              </select>

              <button
                onClick={handleBulkArchive}
                className="flex items-center gap-2 bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3 py-1.5 rounded-lg hover:bg-orange-500/20 transition-all text-xs font-medium"
              >
                <Archive size={13} />
                {t('archiveSelected')}
              </button>

              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-lg hover:bg-rose-500/20 transition-all text-xs font-medium"
              >
                <Trash2 size={13} />
                {t('deleteSelected')}
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Table/Kanban View */}
      <div className="relative">
        {viewMode === 'kanban' ? (
          <KanbanBoard 
            tasks={filteredTasks} 
            users={users} 
            onUpdateTask={onUpdateTask}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            openHistoryModal={onOpenHistory}
            isMonitor={isMonitor}
          />
        ) : (
          <div className="glass-1 rounded-xl border border-slate-200/50 dark:border-white/5 overflow-hidden relative">
            <div className="overflow-x-auto custom-scrollbar">
              <table className={`w-full ${isRTL ? 'text-right' : 'text-left'} border-collapse min-w-[1200px]`}>
                <thead>
                  <tr className="bg-white/5 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase border-b border-white/10">
                    <th className="px-4 py-4 w-16">
                      <button onClick={toggleSelectAll} className="text-gold hover:scale-110 transition-transform duration-200">
                        {allSelected ? <CheckSquare size={18} /> : <Square size={18} className="opacity-40" />}
                      </button>
                    </th>
                    <th className="px-4 py-4 font-semibold cursor-pointer hover:text-white transition-all group" onClick={() => handleSort('refNo')}>
                      <div className="flex items-center gap-3">
                        {t('refNo')}
                        <div className="flex flex-col -space-y-1 opacity-20 group-hover:opacity-100 transition-opacity">
                          <ChevronDown size={14} className={`${sortConfig?.key === 'refNo' && sortConfig.direction === 'asc' ? 'text-gold opacity-100' : ''}`} />
                          <ChevronDown size={14} className={`rotate-180 ${sortConfig?.key === 'refNo' && sortConfig.direction === 'desc' ? 'text-gold opacity-100' : ''}`} />
                        </div>
                      </div>
                    </th>
                    <th className="px-4 py-4 font-semibold cursor-pointer hover:text-white transition-all group" onClick={() => handleSort('status')}>
                      <div className="flex items-center gap-3">
                        {t('status')}
                        <div className="flex flex-col -space-y-1 opacity-20 group-hover:opacity-100 transition-opacity">
                          <ChevronDown size={14} className={`${sortConfig?.key === 'status' && sortConfig.direction === 'asc' ? 'text-gold opacity-100' : ''}`} />
                          <ChevronDown size={14} className={`rotate-180 ${sortConfig?.key === 'status' && sortConfig.direction === 'desc' ? 'text-gold opacity-100' : ''}`} />
                        </div>
                      </div>
                    </th>
                    <th className="px-4 py-4 font-semibold cursor-pointer hover:text-white transition-all group" onClick={() => handleSort('title')}>
                      <div className="flex items-center gap-3">
                        {t('eventName')}
                        <div className="flex flex-col -space-y-1 opacity-20 group-hover:opacity-100 transition-opacity">
                          <ChevronDown size={14} className={`${sortConfig?.key === 'title' && sortConfig.direction === 'asc' ? 'text-gold opacity-100' : ''}`} />
                          <ChevronDown size={14} className={`rotate-180 ${sortConfig?.key === 'title' && sortConfig.direction === 'desc' ? 'text-gold opacity-100' : ''}`} />
                        </div>
                      </div>
                    </th>
                    <th className="px-4 py-4 font-semibold cursor-pointer hover:text-white transition-all group" onClick={() => handleSort('priority')}>
                      <div className="flex items-center gap-3">
                        {t('priority')}
                        <div className="flex flex-col -space-y-1 opacity-20 group-hover:opacity-100 transition-opacity">
                          <ChevronDown size={14} className={`${sortConfig?.key === 'priority' && sortConfig.direction === 'asc' ? 'text-gold opacity-100' : ''}`} />
                          <ChevronDown size={14} className={`rotate-180 ${sortConfig?.key === 'priority' && sortConfig.direction === 'desc' ? 'text-gold opacity-100' : ''}`} />
                        </div>
                      </div>
                    </th>
                    <th className="px-4 py-4 font-semibold">{t('responsible')}</th>
                    <th className="px-4 py-4 font-semibold cursor-pointer hover:text-white transition-all group" onClick={() => handleSort('startDate')}>
                      <div className="flex items-center gap-3">
                        {t('startDate')}
                        <div className="flex flex-col -space-y-1 opacity-20 group-hover:opacity-100 transition-opacity">
                          <ChevronDown size={14} className={`${sortConfig?.key === 'startDate' && sortConfig.direction === 'asc' ? 'text-gold opacity-100' : ''}`} />
                          <ChevronDown size={14} className={`rotate-180 ${sortConfig?.key === 'startDate' && sortConfig.direction === 'desc' ? 'text-gold opacity-100' : ''}`} />
                        </div>
                      </div>
                    </th>
                    <th className="px-4 py-4 font-semibold cursor-pointer hover:text-white transition-all group" onClick={() => handleSort('endDate')}>
                      <div className="flex items-center gap-3">
                        {t('endDate')}
                        <div className="flex flex-col -space-y-1 opacity-20 group-hover:opacity-100 transition-opacity">
                          <ChevronDown size={14} className={`${sortConfig?.key === 'endDate' && sortConfig.direction === 'asc' ? 'text-gold opacity-100' : ''}`} />
                          <ChevronDown size={14} className={`rotate-180 ${sortConfig?.key === 'endDate' && sortConfig.direction === 'desc' ? 'text-gold opacity-100' : ''}`} />
                        </div>
                      </div>
                    </th>
                    <th className="px-4 py-4 font-semibold cursor-pointer hover:text-white transition-all group" onClick={() => handleSort('plannedDate')}>
                      <div className="flex items-center gap-3">
                        {t('plannedDate')}
                        <div className="flex flex-col -space-y-1 opacity-20 group-hover:opacity-100 transition-opacity">
                          <ChevronDown size={14} className={`${sortConfig?.key === 'plannedDate' && sortConfig.direction === 'asc' ? 'text-gold opacity-100' : ''}`} />
                          <ChevronDown size={14} className={`rotate-180 ${sortConfig?.key === 'plannedDate' && sortConfig.direction === 'desc' ? 'text-gold opacity-100' : ''}`} />
                        </div>
                      </div>
                    </th>
                    <th className="px-4 py-4 font-semibold cursor-pointer hover:text-white transition-all group" onClick={() => handleSort('createdAt')}>
                      <div className="flex items-center gap-3">
                        {t('creationDate')}
                        <div className="flex flex-col -space-y-1 opacity-20 group-hover:opacity-100 transition-opacity">
                          <ChevronDown size={14} className={`${sortConfig?.key === 'createdAt' && sortConfig.direction === 'asc' ? 'text-gold opacity-100' : ''}`} />
                          <ChevronDown size={14} className={`rotate-180 ${sortConfig?.key === 'createdAt' && sortConfig.direction === 'desc' ? 'text-gold opacity-100' : ''}`} />
                        </div>
                      </div>
                    </th>
                    <th className="px-4 py-4 font-semibold cursor-pointer hover:text-white transition-all group" onClick={() => handleSort('updatedAt')}>
                      <div className="flex items-center gap-3">
                        {t('lastUpdated')}
                        <div className="flex flex-col -space-y-1 opacity-20 group-hover:opacity-100 transition-opacity">
                          <ChevronDown size={14} className={`${sortConfig?.key === 'updatedAt' && sortConfig.direction === 'asc' ? 'text-gold opacity-100' : ''}`} />
                          <ChevronDown size={14} className={`rotate-180 ${sortConfig?.key === 'updatedAt' && sortConfig.direction === 'desc' ? 'text-gold opacity-100' : ''}`} />
                        </div>
                      </div>
                    </th>
                    <th className="px-4 py-4 font-semibold">{t('dependencies')}</th>
                    <th className="px-4 py-4 font-semibold">{t('completionPercentage')}</th>
                    <th className="px-4 py-4 font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence mode="popLayout">
                    {parentTasks.flatMap((task) => [
                      <TaskRow 
                        key={task.id}
                        task={task}
                        users={users}
                        tasks={tasks}
                        selectedTaskIds={selectedTaskIds}
                        toggleSelectTask={toggleSelectTask}
                        openHistoryModal={onOpenHistory}
                        openEditModal={onEditTask}
                        openViewModal={onViewTask}
                        onDeleteTask={onDeleteTask}
                        onUpdateTask={onUpdateTask}
                        onCopyTask={handleCopyTask}
                        isRTL={isRTL}
                        t={t}
                        i18n={i18n}
                        hasSubtasks={subtasks.some(st => st.parentTaskId === task.id)}
                        isExpanded={expandedParents.includes(task.id!)}
                      onToggleExpand={() => toggleParent(task.id!)}
                      isMonitor={isMonitor}
                    />,
                    ...(expandedParents.includes(task.id!) 
                      ? subtasks.filter(st => st.parentTaskId === task.id).map(st => (
                          <TaskRow 
                            key={st.id}
                            task={st}
                            users={users}
                            tasks={tasks}
                            selectedTaskIds={selectedTaskIds}
                            toggleSelectTask={toggleSelectTask}
                            openHistoryModal={onOpenHistory}
                            openEditModal={onEditTask}
                            openViewModal={onViewTask}
                            onDeleteTask={onDeleteTask}
                            onUpdateTask={onUpdateTask}
                            onCopyTask={handleCopyTask}
                            isRTL={isRTL}
                            t={t}
                            i18n={i18n}
                            isSubtask
                            isMonitor={isMonitor}
                          />
                        ))
                      : [])
                  ])}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          {filteredTasks.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                <Search className="text-white/20" size={28} strokeWidth={1.5} />
              </div>
              <h4 className="text-lg font-semibold text-white/60 mb-2">{t('noTasksFound')}</h4>
              <p className="text-sm text-white/30">{t('noTasksFound') || 'No tasks match your filters'}</p>
            </div>
          )}
        </div>
      )}
    </div>

      {/* Excel Review Modal */}
      <AnimatePresence>
        {isReviewModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-navy rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col border border-white/10 relative"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div>
                  <h2 className="text-xl font-semibold text-white">{t('reviewExcelUpdates')}</h2>
                  <p className="text-xs text-white/40 mt-1">{t('reviewExcelUpdatesDesc')}</p>
                </div>
                <button onClick={() => setIsReviewModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/50 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <table className={`w-full ${isRTL ? 'text-right' : 'text-left'} border-collapse`}>
                  <thead>
                    <tr className="text-xs font-semibold uppercase tracking-wider text-white/40 border-b border-white/10">
                      <th className="px-4 py-3">{t('refNo')}</th>
                      <th className="px-4 py-3">{t('eventName')}</th>
                      <th className="px-4 py-3">{t('currentStatus')}</th>
                      <th className="px-4 py-3">{t('newStatus')}</th>
                      <th className="px-4 py-3">{t('newPercentage')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {pendingUpdates.map((update, idx) => (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-xs text-gold">
                          <span className="bg-gold/10 px-2 py-0.5 rounded border border-gold/20">{update.task.refNo}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-white font-medium">{update.task.title}</td>
                        <td className="px-4 py-3 text-xs text-white/40">{t(update.task.status)}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/20">
                            {t(update.newStatus)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-emerald-400 tabular-nums">{update.newPercentage}%</span>
                            <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${update.newPercentage}%` }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-5 border-t border-white/10 flex justify-end gap-3 bg-white/5">
                <button
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-5 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={approveUpdates}
                  className="px-5 py-2 bg-gradient-gold-premium text-navy rounded-xl font-semibold text-sm hover:scale-105 transition-all shadow-lg"
                >
                  {t('approveAndApply')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
};

function TaskRow({ 
  task, users, tasks, selectedTaskIds, toggleSelectTask, 
  openHistoryModal, openEditModal, openViewModal, onDeleteTask, onUpdateTask, onCopyTask,
  isRTL, t, i18n, isSubtask, hasSubtasks, isExpanded, onToggleExpand,
  isMonitor
}: { 
  task: Task, users: User[], tasks: Task[], selectedTaskIds: string[], 
  toggleSelectTask: (id: string) => void, openHistoryModal: (task: Task) => void, 
  openEditModal: (task: Task) => void, openViewModal?: (task: Task) => void, onDeleteTask: (id: string) => void,
  onUpdateTask: (task: Task) => void, onCopyTask: (task: Task) => void, isRTL: boolean, t: any, i18n: any,
  isSubtask?: boolean, hasSubtasks?: boolean, isExpanded?: boolean, onToggleExpand?: () => void,
  isMonitor?: boolean
}) {
  const isCompleted = task.status === 'completed' || task.completionPercentage === 100;
  
  const today = startOfDay(new Date());
  const dueDate = task.endDate ? startOfDay(parseISO(task.endDate)) : null;
  const isOverdue = dueDate && task.status !== 'completed' && isBefore(dueDate, today);
  const isDueSoon = dueDate && task.status !== 'completed' && !isOverdue && 
                    isBefore(dueDate, startOfDay(new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)));

  return (
    <motion.tr 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        backgroundColor: isCompleted ? 'rgba(212, 175, 55, 0.02)' : 'transparent',
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "hover:bg-white/5 transition-all duration-200 group border-b border-white/5 relative",
        selectedTaskIds.includes(task.id!) && "bg-gold/5",
        isSubtask && (isRTL ? "border-r-2 border-gold/30" : "border-l-2 border-gold/30"),
        isCompleted && "opacity-60",
        task.isArchived && "opacity-40 grayscale"
      )}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleSelectTask(task.id!)}
            className="text-gold/30 hover:text-gold transition-all duration-200"
          >
            {selectedTaskIds.includes(task.id!) ? <CheckSquare size={16} className="text-gold" /> : <Square size={16} />}
          </button>
          {hasSubtasks && (
            <button
              onClick={onToggleExpand}
              className={cn(
                "text-gold/30 hover:text-gold transition-all duration-200",
                isExpanded && "rotate-90"
              )}
            >
              {isRTL ? <ChevronRight size={16} className="rotate-180" /> : <ChevronRight size={16} />}
            </button>
          )}
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-xs font-semibold text-gold bg-gold/10 border border-gold/20 px-2 py-1 rounded-md uppercase tracking-wide">
          {task.refNo || '-'}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-4">
          <span className={cn(
            "px-2.5 py-1 rounded-md text-xs font-medium border",
            STATUS_OPTIONS.find(s => s.value === task.status)?.color || "bg-white/5 text-white/40 border-white/10"
          )}>
            {STATUS_OPTIONS.find(s => s.value === task.status)?.label[i18n.language as 'ar' | 'en']}
          </span>
          {isOverdue && (
            <div className="flex items-center gap-1 bg-rose-500/10 text-rose-400 px-2 py-1 rounded-md border border-rose-500/20 animate-pulse">
              <AlertCircle size={12} />
              <span className="text-[10px] font-medium">{t('overdue')}</span>
            </div>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <div className={cn(
            "text-sm font-semibold leading-snug max-w-xs flex items-center gap-2 transition-colors group-hover:text-gold",
            isCompleted ? "text-white/30 line-through" : "text-white"
          )}>
            {task.title}
            {isUrgent(task) && (
              <AlertCircle size={14} className="text-rose-500 animate-pulse shrink-0" />
            )}
            {(task.dependencies?.length || 0) > 0 && (
              <LinkIcon size={14} className="text-gold shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {task.taskType && task.taskType !== 'regular' && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                task.taskType === 'recurring'
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
              }`}>
                {t(`taskType${task.taskType.charAt(0).toUpperCase() + task.taskType.slice(1)}`)}
              </span>
            )}
            <span className="text-[11px] text-gold/50 font-medium">{task.classification || 'General'}</span>
            <div className="w-1 h-1 bg-white/20 rounded-full" />
            <span className="text-[11px] text-white/30">{task.department}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={cn(
          "text-xs font-medium px-2.5 py-1 rounded-md border",
          task.priority === 'urgent' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
          task.priority === 'high' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
          task.priority === 'medium' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
          'bg-white/5 text-white/30 border-white/10'
        )}>
          {t(task.priority || 'low')}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-3">
          {task.assignedTo ? (() => {
            const assignedUser = users.find(u => u.uid === task.assignedTo);
            const initials = (assignedUser?.displayName || assignedUser?.email || '?').slice(0, 2).toUpperCase();
            return (
              <div className="flex items-center gap-2 bg-white/5 p-1 pr-3 rounded-lg border border-white/10">
                {assignedUser?.photoURL ? (
                  <img
                    key={`assigned-${task.assignedTo}`}
                    src={assignedUser.photoURL}
                    alt=""
                    className="w-7 h-7 rounded-md border border-gold/20"
                  />
                ) : (
                  <div className="avatar-fallback w-7 h-7 rounded-md border border-gold/20 bg-gold/20 flex items-center justify-center text-[10px] font-semibold text-gold">
                    {initials}
                  </div>
                )}
                <span className="text-xs font-medium text-white">
                  {assignedUser?.displayName || assignedUser?.email}
                </span>
              </div>
            );
          })() : (
            <span className="text-xs text-white/20">{t('all')}</span>
          )}

          <div className="flex -space-x-2 overflow-hidden">
            {task.teamMembers?.slice(0, 3).map(m => {
              const u = users.find(user => user.uid === m.userId);
              if (!u) return null;
              const memberInitials = (u.displayName || u.email || '?').slice(0, 2).toUpperCase();
              return u.photoURL ? (
                <img key={`team-${m.userId}`} src={u.photoURL} alt="" className="inline-block h-7 w-7 rounded-md ring-2 ring-navy" title={`${u.displayName || ''} (${m.role})`} />
              ) : (
                <div key={`team-${m.userId}`} className="avatar-fallback inline-flex items-center justify-center h-7 w-7 rounded-md ring-2 ring-navy bg-gold/20 text-[10px] font-semibold text-gold" title={`${u.displayName || ''} (${m.role})`}>
                  {memberInitials}
                </div>
              );
            })}
            {(task.teamMembers?.length || 0) > 3 && (
              <span className="flex items-center justify-center h-7 w-7 rounded-md bg-white/5 text-[10px] font-medium text-gold ring-2 ring-navy border border-white/10">
                +{(task.teamMembers?.length || 0) - 3}
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className={isOverdue ? 'text-rose-400' : isDueSoon ? 'text-amber-400' : 'text-gold/50'} />
          <span className={`text-xs ${isOverdue ? 'text-rose-400' : isDueSoon ? 'text-amber-400' : 'text-white/70'}`}>
            {task.startDate || '---'}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className={isOverdue ? 'text-rose-400' : isDueSoon ? 'text-amber-400' : 'text-gold/50'} />
          <span className={`text-xs ${isOverdue ? 'text-rose-400' : isDueSoon ? 'text-amber-400' : 'text-white/70'}`}>
            {task.endDate || '---'}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className="text-gold/50" />
          <span className="text-xs text-gold/70">{task.plannedDate || '---'}</span>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-xs text-white/40">{task.createdAt ? new Date(task.createdAt).toLocaleDateString(i18n.language) : '---'}</span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-xs text-white/40">{task.updatedAt ? new Date(task.updatedAt).toLocaleDateString(i18n.language) : '---'}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1 max-w-[160px]">
          {task.dependencies?.map(depId => {
            const depTask = tasks.find(t => t.id === depId);
            return depTask ? (
              <span key={depId} className="px-2 py-0.5 bg-gold/10 text-gold text-[10px] font-medium rounded border border-gold/20 truncate" title={depTask.title}>
                {depTask.title}
              </span>
            ) : null;
          })}
          {(!task.dependencies || task.dependencies.length === 0) && (
            <span className="text-white/20 text-xs">---</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="w-28">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-white/70">{task.completionPercentage}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${task.completionPercentage}%` }}
              className={`h-full rounded-full ${
                task.completionPercentage === 100 ? 'bg-emerald-500' :
                task.completionPercentage > 50 ? 'bg-gradient-gold-premium' : 'bg-gold/50'
              }`}
            />
          </div>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-left">
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <button 
            onClick={() => openViewModal?.(task)}
            className="p-3 bg-white/5 text-white/40 hover:text-gold hover:bg-white/10 rounded-xl transition-all shadow-lg border border-white/5"
            title={t('preview')}
          >
            <Eye size={18} />
          </button>
          <button 
            onClick={() => openHistoryModal(task)}
            className="p-3 bg-white/5 text-white/40 hover:text-gold hover:bg-white/10 rounded-xl transition-all shadow-lg border border-white/5"
            title={t('history')}
          >
            <History size={18} />
          </button>
          {!isMonitor && (
            <>
              <button 
                onClick={() => onCopyTask(task)}
                className="p-3 bg-white/5 text-white/40 hover:text-gold hover:bg-white/10 rounded-xl transition-all shadow-lg border border-white/5"
                title={t('copyTask')}
              >
                <Plus size={18} />
              </button>
              <button 
                onClick={() => openEditModal(task)}
                className="p-3 bg-white/5 text-white/40 hover:text-gold hover:bg-white/10 rounded-xl transition-all shadow-lg border border-white/5"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={() => onUpdateTask({ ...task, isArchived: !task.isArchived })}
                className="p-3 bg-white/5 text-white/40 hover:text-orange-400 hover:bg-white/10 rounded-xl transition-all shadow-lg border border-white/5"
                title={task.isArchived ? t('unarchive') : t('archive')}
              >
                {task.isArchived ? <RotateCcw size={18} /> : <Archive size={18} />}
              </button>
              <button 
                onClick={() => onDeleteTask(task.id!)} 
                className="p-3 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-xl transition-all shadow-lg border border-rose-500/20"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>
      </td>
    </motion.tr>
  );
}

function ActionButton({ onClick, icon, label, color, title }: { onClick: () => void, icon: React.ReactNode, label: string, color: string, title?: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20',
    navy: 'bg-navy/40 text-gold border-gold/20 hover:bg-navy/60',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20',
    gray: 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20',
  };

  return (
    <button
      onClick={onClick}
      title={title || label}
      className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm font-medium shrink-0 ${colorMap[color] || colorMap.gray}`}
    >
      {icon}
      <span className="hidden xl:inline">{label}</span>
    </button>
  );
}

function FilterSelect({ label, value, onChange, options, allLabel, displayMap }: { label: string, value: string, onChange: (v: string) => void, options: string[], allLabel: string, displayMap?: Record<string, string> }) {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 px-1">{label}</label>
      <select
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-gold transition-all cursor-pointer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="all" className="bg-navy">{allLabel}</option>
        {options.map(opt => (
          <option key={opt} value={opt} className="bg-navy">{displayMap ? displayMap[opt] : opt}</option>
        ))}
      </select>
    </div>
  );
}
