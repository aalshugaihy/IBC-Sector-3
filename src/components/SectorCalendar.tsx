import React, { useState, useMemo } from 'react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, 
  parseISO, isWithinInterval, startOfDay, endOfDay, isBefore
} from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, CheckCircle2, PlayCircle, AlertCircle, Filter, X, Plus,
  Info, Link as LinkIcon, ListTree, Trash2, Search, Check
} from 'lucide-react';
import { STATUS_OPTIONS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { Task, User } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SectorCalendarProps {
  tasks: Task[];
  users: User[];
  onTaskClick: (task: Task) => void;
  onOpenAddModal: () => void;
  onUpdateTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onSaveTask?: (task: Omit<Task, 'id'> | Task) => void;
}

export const SectorCalendar: React.FC<SectorCalendarProps> = ({ 
  tasks, 
  users, 
  onTaskClick, 
  onOpenAddModal,
  onUpdateTask,
  onDeleteTask,
  onSaveTask
}) => {
  const { t, i18n } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');

  const isRTL = i18n.language === 'ar';
  const locale = isRTL ? ar : enUS;

  const departments = useMemo(() => {
    const deps = new Set(tasks.map(t => t.department).filter(Boolean));
    return ['all', ...Array.from(deps)];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filterDepartment !== 'all' && task.department !== filterDepartment) return false;
      if (filterStatus !== 'all' && task.status !== filterStatus) return false;
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [tasks, filterDepartment, filterStatus, searchQuery]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const renderHeader = () => {
    return (
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
            <CalendarIcon className="text-primary" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {format(currentMonth, 'MMMM yyyy', { locale })}
            </h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('sectorCalendar')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          {/* Navigation Controls */}
          <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all text-slate-600 dark:text-slate-300"
              title={t('previousMonth')}
            >
              {isRTL ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-2 text-sm font-medium text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
            >
              {t('today')}
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all text-slate-600 dark:text-slate-300"
              title={t('nextMonth')}
            >
              {isRTL ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchTasks') || 'Search...'}
                className="bg-transparent text-sm text-slate-900 dark:text-slate-100 focus:outline-none placeholder:text-slate-400 w-36"
              />
            </div>

            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
              <Filter size={16} className="text-slate-400" />
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="bg-transparent text-sm text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-white dark:bg-slate-900">{t('allDepartments') || t('all')}</option>
                {departments.filter(d => d !== 'all').map(dep => (
                  <option key={dep} value={dep} className="bg-white dark:bg-slate-900">{dep}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
              <CheckCircle2 size={16} className="text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent text-sm text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-white dark:bg-slate-900">{t('allStatuses') || t('all')}</option>
                <option value="not-started" className="bg-white dark:bg-slate-900">{t('notStarted')}</option>
                <option value="ongoing" className="bg-white dark:bg-slate-900">{t('ongoing')}</option>
                <option value="completed" className="bg-white dark:bg-slate-900">{t('completed')}</option>
                <option value="overdue" className="bg-white dark:bg-slate-900">{t('overdue')}</option>
                <option value="postponed" className="bg-white dark:bg-slate-900">{t('postponed')}</option>
                <option value="cancelled" className="bg-white dark:bg-slate-900">{t('cancelled')}</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentMonth, { weekStartsOn: 0 }); // Sunday

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 py-4 border-r border-slate-200 dark:border-gold/10 last:border-r-0">
          {format(addDays(startDate, i), 'EEE', { locale })}
        </div>
      );
    }

    return <div className="grid grid-cols-7 border-b border-slate-200 dark:border-gold/20 bg-slate-50 dark:bg-slate-900/20">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;
        
        // Find tasks for this day
        const dayTasks = filteredTasks.filter(task => {
          const planned = task.plannedDate ? parseISO(task.plannedDate) : null;
          const started = task.startDate ? parseISO(task.startDate) : null;
          const actual = task.actualDate ? parseISO(task.actualDate) : null;
          const end = task.endDate ? parseISO(task.endDate) : null;

          const hasSpecificDate = planned || started || actual || end;
          const isMidMonth = format(cloneDay, 'd') === '15';
          
          // If task has a specific date, check if it matches today
          if (hasSpecificDate) {
            return (planned && isSameDay(planned, cloneDay)) ||
                   (started && isSameDay(started, cloneDay)) ||
                   (actual && isSameDay(actual, cloneDay)) ||
                   (end && isSameDay(end, cloneDay));
          }

          // If task has no specific date, check if it belongs to this month and it's the 15th
          if (isMidMonth && task.month) {
            const currentMonthName = format(currentMonth, 'MMMM', { locale: enUS }); // Month names in constants are likely English
            const currentMonthNameAr = format(currentMonth, 'MMMM', { locale: ar });
            return task.month === currentMonthName || task.month === currentMonthNameAr;
          }

          return false;
        });

        days.push(
          <div
            key={day.toString()}
            className={cn(
              "min-h-[160px] p-6 border-r border-b border-slate-200 dark:border-gold/10 transition-all relative group/cell cursor-pointer overflow-hidden",
              !isSameMonth(day, monthStart) ? "bg-slate-50/50 dark:bg-navy/10 opacity-20" : "bg-white dark:bg-navy/20",
              isSameDay(day, new Date()) && "bg-primary/5 dark:bg-gold/5"
            )}
            onClick={() => setSelectedDate(cloneDay)}
          >
            <div className="flex justify-between items-start mb-3">
              <span className={cn(
                "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-lg transition-all",
                isSameDay(day, new Date())
                  ? "bg-primary text-white dark:bg-gold dark:text-navy"
                  : "text-slate-500 dark:text-white/40 hover:bg-slate-100 dark:hover:bg-white/5"
              )}>
                {formattedDate}
              </span>
              {dayTasks.length > 0 && (
                <div className="flex gap-1.5">
                  {dayTasks.some(t => t.status === 'completed') && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                  {dayTasks.some(t => t.status === 'ongoing') && <div className="w-2 h-2 rounded-full bg-primary dark:bg-gold" />}
                  {dayTasks.some(t => t.status === 'overdue' || isUrgent(t)) && <div className="w-2 h-2 rounded-full bg-rose-500" />}
                </div>
              )}
            </div>

            <div className="space-y-2.5 max-h-[110px] overflow-y-auto scrollbar-hide">
              {dayTasks.slice(0, 3).map((task, idx) => (
                <motion.div
                  key={task.id}
                  whileHover={{ scale: 1.05, x: isRTL ? -5 : 5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTask(task);
                  }}
                  className={cn(
                    "text-xs px-2 py-1 rounded-md truncate cursor-pointer transition-all font-medium border",
                    task.status === 'completed' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
                    task.status === 'ongoing' ? "bg-primary/10 dark:bg-gold/10 text-primary dark:text-gold border-primary/20 dark:border-gold/20" :
                    (task.status === 'overdue' || isUrgent(task)) ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" :
                    "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/50 border-slate-200 dark:border-white/10"
                  )}
                >
                  <span>{task.title}</span>
                </motion.div>
              ))}
              {dayTasks.length > 3 && (
                <div className="text-xs font-medium text-slate-400 dark:text-slate-500 text-center py-1">
                  + {dayTasks.length - 3} {t('tasks')}
                </div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="bg-white dark:bg-slate-900/30 rounded-b-2xl overflow-hidden border-l border-t border-slate-200 dark:border-gold/10 shadow-xl">{rows}</div>;
  };

  const isUrgent = (task: Task) => {
    if (task.status === 'completed') return false;
    if (task.status === 'overdue') return true;
    if (task.priority === 'urgent') return true;
    
    const today = startOfDay(new Date());
    const endDate = task.endDate ? parseISO(task.endDate) : null;
    if (endDate && isBefore(endDate, today)) return true;
    
    return false;
  };

  const renderTaskDetails = () => {
    if (!selectedDate) return null;

    const dayTasks = filteredTasks.filter(task => {
      const planned = task.plannedDate ? parseISO(task.plannedDate) : null;
      const started = task.startDate ? parseISO(task.startDate) : null;
      const actual = task.actualDate ? parseISO(task.actualDate) : null;
      const end = task.endDate ? parseISO(task.endDate) : null;

      const hasSpecificDate = planned || started || actual || end;
      const isMidMonth = format(selectedDate, 'd') === '15';
      
      if (hasSpecificDate) {
        return (planned && isSameDay(planned, selectedDate)) ||
               (started && isSameDay(started, selectedDate)) ||
               (actual && isSameDay(actual, selectedDate)) ||
               (end && isSameDay(end, selectedDate));
      }

      if (isMidMonth && task.month) {
        const currentMonthName = format(currentMonth, 'MMMM', { locale: enUS });
        const currentMonthNameAr = format(currentMonth, 'MMMM', { locale: ar });
        return task.month === currentMonthName || task.month === currentMonthNameAr;
      }

      return false;
    });

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-navy/90 backdrop-blur-xl"
        onClick={() => setSelectedDate(null)}
      >
        <div 
          className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {format(selectedDate, 'EEEE, d MMMM', { locale })}
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                {dayTasks.length} {t('tasks')} {t('scheduled')}
              </p>
            </div>
            <button
              onClick={() => setSelectedDate(null)}
              className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          <div className="relative p-6 max-h-[65vh] overflow-y-auto space-y-8 custom-scrollbar bg-slate-50/50 dark:bg-navy/20">
            {dayTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-slate-100 dark:bg-white/5 w-14 h-14 rounded-xl flex items-center justify-center mb-4 border border-slate-200 dark:border-white/10">
                  <CalendarIcon className="text-slate-300 dark:text-white/20" size={24} />
                </div>
                <h4 className="text-sm font-semibold text-slate-400 dark:text-slate-500">{t('noTasksFound')}</h4>
              </div>
            ) : (
              dayTasks.map(task => (
                <motion.div
                  key={task.id}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedTask(task);
                    setSelectedDate(null);
                  }}
                  className="glass-1 rounded-xl border border-slate-200/50 dark:border-white/5 p-4 cursor-pointer transition-all hover:border-primary/30 dark:hover:border-gold/30"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 dark:bg-gold/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-1000" />
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-8">
                      <h4 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-primary dark:group-hover:text-gold transition-colors leading-tight tracking-tighter">
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-3">
                        {isUrgent(task) && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-500 text-white rounded-md text-xs font-medium animate-pulse">
                            <AlertCircle size={11} />
                            {t('urgent')}
                          </div>
                        )}
                        <span className={cn(
                          "px-2 py-0.5 rounded-md text-xs font-medium border",
                          task.priority === 'urgent' ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" :
                          task.priority === 'high' ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20" :
                          task.priority === 'medium' ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" :
                          "bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-white/40 border-slate-200 dark:border-white/10"
                        )}>
                          {t(task.priority || 'medium')}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10">
                        <Clock size={14} className="text-primary dark:text-gold shrink-0" />
                        <span className="tabular-nums">{task.plannedDate ? format(parseISO(task.plannedDate), 'PP', { locale }) : '-'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                        <span>{task.completionPercentage}%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-4 rtl:space-x-reverse">
                        {task.teamMembers?.slice(0, 4).map(m => {
                          const member = users.find(u => u.uid === m.userId);
                          return (
                            <div key={m.userId} className="relative">
                              <img
                                src={member?.photoURL || `https://ui-avatars.com/api/?name=${m.userId}`}
                                alt=""
                                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-600 object-cover"
                              />
                            </div>
                          );
                        })}
                        {(task.teamMembers?.length || 0) > 4 && (
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-xs font-medium text-slate-500 dark:text-slate-300">
                            +{(task.teamMembers?.length || 0) - 4}
                          </div>
                        )}
                      </div>
                      <div className={cn(
                        "flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border",
                        task.status === 'completed' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        task.status === 'ongoing' ? "bg-gold/10 text-gold border-gold/20" :
                        task.status === 'overdue' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                        "bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/40 border-slate-200 dark:border-white/10"
                      )}>
                        {task.status === 'completed' && <CheckCircle2 size={12} />}
                        {task.status === 'ongoing' && <PlayCircle size={12} />}
                        {task.status === 'overdue' && <AlertCircle size={12} />}
                        {t(task.status || 'not-started')}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderTaskDetailsModal = () => {
    if (!selectedTask) return null;

    const subtasks = tasks.filter(t => t.parentTaskId === selectedTask.id);
    const dependencies = tasks.filter(t => selectedTask.dependencies?.includes(t.id!));

    const handleAddSubtask = (e: React.FormEvent) => {
      e.preventDefault();
      if (!subtaskTitle.trim() || !onSaveTask) return;

      const newSubtask: Omit<Task, 'id'> = {
        title: subtaskTitle,
        department: selectedTask.department,
        month: selectedTask.month,
        status: 'not-started',
        priority: 'medium',
        completionPercentage: 0,
        parentTaskId: selectedTask.id,
        assignedTo: selectedTask.assignedTo,
        teamMembers: [],
        startDate: selectedTask.startDate,
        endDate: selectedTask.endDate,
        plannedDate: selectedTask.plannedDate,
        refNo: `${selectedTask.refNo || 'TSK'}-SUB-${subtasks.length + 1}`
      };

      onSaveTask(newSubtask);
      setSubtaskTitle('');
      setIsAddingSubtask(false);
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-navy/95 backdrop-blur-3xl"
        onClick={() => setSelectedTask(null)}
      >
        <motion.div
          initial={{ scale: 0.9, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 50, opacity: 0 }}
          className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative flex flex-col max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-primary/10 dark:bg-gold/10 rounded-lg border border-primary/20 dark:border-gold/20">
                <CalendarIcon className="text-primary dark:text-gold" size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{selectedTask.refNo}</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-md text-xs font-medium border",
                    selectedTask.priority === 'urgent' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                    selectedTask.priority === 'high' ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                    "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  )}>
                    {t(selectedTask.priority || 'medium')}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {selectedTask.title}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onTaskClick(selectedTask);
                  setSelectedTask(null);
                }}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-gold/10 text-gold hover:bg-gold hover:text-navy transition-all border border-gold/30"
                title={t('edit')}
              >
                <Plus size={18} />
              </button>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="relative flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {/* Status and Progress */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-1 p-4 rounded-xl border border-slate-200/50 dark:border-white/5">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">{t('status')}</p>
                <div className={cn(
                  "flex items-center gap-2 text-sm font-semibold",
                  selectedTask.status === 'completed' ? "text-emerald-400" :
                  selectedTask.status === 'ongoing' ? "text-gold" :
                  "text-slate-500 dark:text-white/60"
                )}>
                  {selectedTask.status === 'completed' && <CheckCircle2 size={24} />}
                  {selectedTask.status === 'ongoing' && <PlayCircle size={24} />}
                  {t(selectedTask.status || 'not-started')}
                </div>
              </div>
              <div className="glass-1 p-4 rounded-xl border border-slate-200/50 dark:border-white/5 md:col-span-2">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('completionPercentage')}</p>
                  <span className="text-sm font-semibold text-gold">{selectedTask.completionPercentage}%</span>
                </div>
                <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/10 p-1">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${selectedTask.completionPercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-gold via-gold-light to-gold rounded-full shadow-[0_0_15px_rgba(212,175,55,0.5)]"
                  />
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div>
                  <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                    <Info size={14} />
                    {t('notes')}
                  </h4>
                  <div className="glass-1 p-4 rounded-xl border border-slate-200/50 dark:border-white/5 text-slate-600 dark:text-white/70 text-sm leading-relaxed min-h-[100px]">
                    {selectedTask.notes || t('noNotes')}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-rose-400 mb-3 flex items-center gap-2">
                    <AlertCircle size={14} />
                    {t('obstacles')}
                  </h4>
                  <div className="bg-rose-500/5 p-4 rounded-xl border border-rose-500/20 text-rose-400/70 text-sm leading-relaxed min-h-[100px]">
                    {selectedTask.obstacles || t('noObstacles')}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                    <LinkIcon size={14} />
                    {t('dependencies')}
                  </h4>
                  <div className="space-y-2">
                    {dependencies.length > 0 ? dependencies.map(dep => (
                      <div
                        key={dep.id}
                        onClick={() => setSelectedTask(dep)}
                        className="flex items-center gap-3 p-3 glass-1 rounded-lg border border-slate-200/50 dark:border-white/5 hover:border-gold/30 transition-all cursor-pointer"
                      >
                        <div className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          dep.status === 'completed' ? "bg-emerald-500" : "bg-gold"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{dep.title}</p>
                          <p className="text-xs font-medium text-slate-400">{dep.refNo}</p>
                        </div>
                        <span className="text-xs font-medium text-gold">{dep.completionPercentage}%</span>
                      </div>
                    )) : (
                      <div className="text-center py-6 glass-1 rounded-lg border border-dashed border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/20 text-xs font-medium">
                        {t('noDependencies')}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <ListTree size={14} />
                      {t('subtasks')}
                    </h4>
                    <button
                      onClick={() => setIsAddingSubtask(!isAddingSubtask)}
                      className="p-3 bg-gold/10 rounded-xl text-gold hover:bg-gold hover:text-navy transition-all border border-gold/20"
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  <AnimatePresence>
                    {isAddingSubtask && (
                      <motion.form
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        onSubmit={handleAddSubtask}
                        className="mb-6 overflow-hidden"
                      >
                        <div className="p-3 bg-gold/5 rounded-lg border border-gold/20 flex gap-2">
                          <input
                            autoFocus
                            type="text"
                            value={subtaskTitle}
                            onChange={e => setSubtaskTitle(e.target.value)}
                            placeholder={t('addSubtask')}
                            className="flex-1 rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-gold outline-none"
                          />
                          <button
                            type="submit"
                            disabled={!subtaskTitle.trim()}
                            className="px-3 py-2 bg-gold text-navy rounded-lg text-sm font-medium disabled:opacity-50"
                          >
                            {t('add')}
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  <div className="space-y-4">
                    {subtasks.length > 0 ? subtasks.map(sub => (
                      <div key={sub.id} className="flex items-center gap-3 p-3 glass-1 rounded-lg border border-slate-200/50 dark:border-white/5 hover:border-gold/30 transition-all">
                        <button
                          onClick={() => onUpdateTask?.({ ...sub, status: sub.status === 'completed' ? 'ongoing' : 'completed' })}
                          className={cn(
                            "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all shrink-0",
                            sub.status === 'completed' ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 dark:border-gold/30 text-transparent hover:border-gold"
                          )}
                        >
                          <Check size={12} strokeWidth={3} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-slate-400">{sub.refNo}</span>
                            <p className={cn(
                              "text-xs font-medium truncate transition-all",
                              sub.status === 'completed' ? "text-slate-400 line-through" : "text-slate-900 dark:text-white"
                            )}>
                              {sub.title}
                            </p>
                          </div>
                          <div className="h-1 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${sub.status === 'completed' ? 100 : sub.completionPercentage}%` }}
                              className="h-full bg-gold"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => onDeleteTask?.(sub.id!)}
                          className="p-1.5 text-slate-300 dark:text-white/20 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )) : (
                      <div className="text-center py-6 glass-1 rounded-lg border border-dashed border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/20 text-xs font-medium">
                        {t('noSubtasks')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {renderHeader()}
      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md">
        {renderDays()}
        {renderCells()}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-5 px-4 py-3 glass-1 rounded-xl border border-slate-200/50 dark:border-white/5">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('taskIndicators')}:</span>
        <div className="flex items-center gap-2 cursor-help">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-white/20 border border-slate-200 dark:border-white/10" />
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('notStarted')}</span>
        </div>
        <div className="flex items-center gap-2 cursor-help">
          <div className="w-2.5 h-2.5 rounded-full bg-gold" />
          <span className="text-xs font-medium text-gold">{t('ongoing')}</span>
        </div>
        <div className="flex items-center gap-2 cursor-help">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-emerald-500">{t('completed')}</span>
        </div>
        <div className="flex items-center gap-2 cursor-help">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span className="text-xs font-medium text-rose-400">{t('overdue')}</span>
        </div>
      </div>

      <AnimatePresence>
        {selectedDate && renderTaskDetails()}
        {selectedTask && renderTaskDetailsModal()}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={onOpenAddModal}
        className="fixed bottom-12 right-12 w-16 h-16 bg-gradient-to-br from-gold via-gold-light to-gold rounded-2xl shadow-xl shadow-gold/40 flex items-center justify-center text-navy z-50 group overflow-hidden border-4 border-navy/30"
      >
        <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <Plus size={48} strokeWidth={4} className="relative z-10" />
      </motion.button>
    </div>
  );
};
