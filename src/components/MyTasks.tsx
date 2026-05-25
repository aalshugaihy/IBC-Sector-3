import React, { useState } from 'react';
import { Task, User } from '../types';
import { useTranslation } from 'react-i18next';
import { STATUS_OPTIONS } from '../constants';
import { CheckCircle2, Clock, AlertCircle, Calendar, Eye, Loader2 } from 'lucide-react';
import { TaskModal } from './TaskModal';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface MyTasksProps {
  tasks: Task[];
  currentUser: User | null;
  onUpdateTask: (task: Task) => void;
  users: User[];
}

export function MyTasks({ tasks, currentUser, onUpdateTask, users }: MyTasksProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const myTasks = tasks.filter(task => 
    (task.assignedTo === currentUser?.uid || 
    task.teamMembers?.some(m => m.userId === currentUser?.uid)) &&
    !task.parentTaskId
  );

  const stats = {
    total: myTasks.length,
    completed: myTasks.filter(t => t.status === 'completed').length,
    ongoing: myTasks.filter(t => t.status === 'ongoing').length,
    overdue: myTasks.filter(t => t.status === 'overdue').length,
  };

  const openDetails = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-1000 relative">

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<CheckCircle2 className="text-gold" size={32} />} 
          label={t('completedTasks')} 
          value={stats.completed} 
          color="gold" 
        />
        <StatCard 
          icon={<Clock className="text-gold" size={32} />} 
          label={t('ongoingTasks')} 
          value={stats.ongoing} 
          color="navy" 
        />
        <StatCard 
          icon={<AlertCircle className="text-rose-400" size={32} />} 
          label={t('overdueTasks')} 
          value={stats.overdue} 
          color="rose" 
        />
        <StatCard 
          icon={<Calendar className="text-gold" size={32} />} 
          label={t('totalTasks')} 
          value={stats.total} 
          color="gold" 
        />
      </div>

      {/* Task List */}
      <div className="grid grid-cols-1 gap-6">
        {myTasks.length === 0 ? (
          <div className="glass-1 p-12 rounded-xl border border-slate-200/50 dark:border-white/5 text-center">
            <div className="bg-gold/10 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 border border-gold/20">
              <CheckCircle2 className="text-gold/40" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{t('noTasksFound')}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{t('noTasksFound') || 'No tasks assigned'}</p>
          </div>
        ) : (
          myTasks.map((task) => (
            <div key={task.id} className="glass-1 p-5 rounded-xl border border-slate-200/50 dark:border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-all duration-300">

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-4 mb-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded-md text-xs font-medium border",
                    task.status === 'completed' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                    task.status === 'ongoing' ? "bg-gold/10 text-gold border-gold/20" :
                    task.status === 'overdue' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                    "bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/40 border-slate-200 dark:border-white/10"
                  )}>
                    {STATUS_OPTIONS.find(s => s.value === task.status)?.label[i18n.language as 'ar' | 'en']}
                  </span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{task.department}</span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-tight mb-3">
                  {task.title}
                </h3>
                <div className="flex items-center gap-3">
                  {task.plannedDate && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10">
                      <Calendar size={13} className="text-gold" />
                      <span className="tabular-nums">{task.plannedDate}</span>
                    </div>
                  )}
                  <span className="text-xs font-medium text-slate-400 dark:text-white/40 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10">
                    {task.classification || 'General'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-8 shrink-0 relative z-10">
                <div className="flex flex-col items-end gap-2">
                  <div className="w-48 h-2 bg-slate-200 dark:bg-navy/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        task.completionPercentage === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-gold to-gold-light'
                      }`}
                      style={{ width: `${task.completionPercentage}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('completion')}</span>
                    <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{task.completionPercentage}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onUpdateTask({ ...task, status: 'completed', completionPercentage: 100 })}
                    className="p-3 bg-emerald-500/5 text-emerald-400 rounded-xl hover:bg-emerald-500/15 transition-all border border-emerald-500/20"
                    title={t('completedTasks')}
                  >
                    <CheckCircle2 size={20} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openDetails(task)}
                    className="p-3 bg-gradient-to-br from-gold via-gold-light to-gold text-navy rounded-xl hover:shadow-lg hover:shadow-gold/30 transition-all"
                    title={t('preview')}
                  >
                    <Eye size={20} />
                  </motion.button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={(updatedTask) => onUpdateTask(updatedTask as Task)} 
        task={selectedTask} 
        users={users} 
        tasks={tasks}
      />
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    navy: 'bg-navy/40 text-gold border-gold/20 shadow-navy/50',
    gold: 'bg-gold/10 text-gold border-gold/30 shadow-gold/10',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/10',
  };

  return (
    <div className="glass-1 p-5 rounded-xl border border-slate-200/50 dark:border-white/5 flex items-center gap-4 transition-all">
      <div className={`${colorMap[color] || colorMap.navy} p-3 rounded-lg border`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none tabular-nums">{value}</p>
      </div>
    </div>
  );
}
