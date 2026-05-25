import React from 'react';
import { Task, User } from '../types';
import { 
  Calendar, Clock, AlertCircle, CheckCircle2, 
  ArrowRight, Link as LinkIcon, User as UserIcon,
  MoreVertical, Edit2, Trash2, Eye
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { STATUS_OPTIONS } from '../constants';
import { isBefore, startOfDay, parseISO } from 'date-fns';

interface TaskCardProps {
  task: Task;
  users: User[];
  onEdit?: (task: Task) => void;
  onView?: (task: Task) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: Task['status']) => void;
  isRTL?: boolean;
  className?: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, users, onEdit, onView, onDelete, onStatusChange, isRTL, className 
}) => {
  const { t, i18n } = useTranslation();
  
  const today = startOfDay(new Date());
  const dueDate = task.endDate ? startOfDay(parseISO(task.endDate)) : null;
  const isOverdue = dueDate && task.status !== 'completed' && isBefore(dueDate, today);
  const isDueSoon = dueDate && task.status !== 'completed' && !isOverdue && 
                    isBefore(dueDate, startOfDay(new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)));

  const isUrgent = task.status !== 'completed' && (task.priority === 'urgent' || isOverdue);

  const assignedUser = users.find(u => u.uid === task.assignedTo);

  return (
    <div className={cn(
      "glassy-dark p-8 rounded-[3rem] border border-gold/20 shadow-2xl hover:shadow-gold/30 transition-all group relative overflow-hidden",
      task.isArchived && "opacity-60 grayscale bg-navy/40",
      className
    )}>
      {/* Arabesque Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]" />
      
      {/* Priority Indicator */}
      <div className={cn(
        "absolute top-0 w-2 h-full transition-all duration-500 group-hover:w-3",
        isRTL ? "right-0" : "left-0",
        task.priority === 'urgent' ? 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.6)]' :
        task.priority === 'high' ? 'bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.6)]' :
        task.priority === 'medium' ? 'bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)]' : 'bg-gold/20'
      )} />

      <div className="flex items-start justify-between mb-6 relative z-10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-black text-gold bg-gold/10 border border-gold/20 px-4 py-1.5 rounded-xl shadow-xl gold-glow uppercase tracking-[0.2em]">
            {task.refNo || 'TSK-000'}
          </span>
          {isOverdue && (
            <div className="flex items-center gap-2 bg-rose-500/10 text-rose-400 px-3 py-1.5 rounded-xl border border-rose-500/20 shadow-xl shadow-rose-500/10 animate-pulse">
              <AlertCircle size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">{t('overdue')}</span>
            </div>
          )}
        </div>
        <span className={cn(
          "text-[10px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-2xl border shadow-xl backdrop-blur-xl",
          task.priority === 'urgent' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/10' :
          task.priority === 'high' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-orange-500/10' :
          'bg-white/5 text-white/30 border-white/10'
        )}>
          {t(task.priority || 'low')}
        </span>
      </div>

      <h4 className="text-xl font-black text-white mb-6 line-clamp-2 group-hover:text-gold transition-all leading-tight flex items-center gap-3 relative z-10">
        {task.title}
        {isUrgent && (
          <AlertCircle size={18} className="text-rose-500 animate-pulse shadow-rose-500/40 shadow-lg shrink-0" />
        )}
      </h4>

      <div className="space-y-6 relative z-10">
        <div className="flex items-center gap-4 text-[12px] font-black text-white/40 uppercase tracking-[0.2em] bg-white/5 p-3 rounded-2xl border border-white/5">
          <Calendar size={18} className={isOverdue ? 'text-rose-400' : isDueSoon ? 'text-amber-400' : 'text-gold shadow-gold/40 shadow-lg'} />
          <span className={isOverdue ? 'text-rose-400' : isDueSoon ? 'text-amber-400' : 'text-white/60'}>{task.startDate || '-'}</span>
          <ArrowRight size={16} className="text-white/20" />
          <span className={isOverdue ? 'text-rose-400' : isDueSoon ? 'text-amber-400' : 'text-white/60'}>{task.endDate || '-'}</span>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-gold/10">
          <div className="flex items-center gap-4">
            {assignedUser && (
              <img 
                src={assignedUser.photoURL || undefined} 
                alt={assignedUser.displayName || ''} 
                className="w-10 h-10 rounded-full border-2 border-navy shadow-2xl ring-2 ring-gold/20" 
              />
            )}
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gold uppercase tracking-[0.3em]">
                {task.department}
              </span>
              <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">
                {STATUS_OPTIONS.find(s => s.value === task.status)?.label[i18n.language as 'ar' | 'en']}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <span className="text-[12px] font-black text-white tracking-tighter">{task.completionPercentage}%</span>
            <div className="w-20 h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/10 shadow-inner p-[1px]">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-1000 ease-out",
                  task.completionPercentage === 100 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]' : 'bg-gold shadow-[0_0_15px_rgba(212,175,55,0.6)]'
                )}
                style={{ width: `${task.completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hover Actions */}
      <div className="absolute inset-0 bg-navy/95 backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center gap-4 z-20">
        <button 
          onClick={() => onView?.(task)}
          className="p-5 bg-white/5 hover:bg-gold/10 text-white hover:text-gold rounded-[2rem] transition-all border border-white/10 hover:border-gold/30 shadow-2xl transform hover:scale-110"
          title={t('preview')}
        >
          <Eye size={28} />
        </button>
        <button 
          onClick={() => onEdit?.(task)}
          className="p-5 bg-gold text-navy rounded-[2rem] hover:scale-110 transition-all shadow-2xl shadow-gold/40 border border-gold/50"
          title={t('editEvent')}
        >
          <Edit2 size={28} />
        </button>
        <button 
          onClick={() => onDelete?.(task.id!)}
          className="p-5 bg-rose-500 text-white rounded-[2rem] hover:bg-rose-600 transition-all shadow-2xl shadow-rose-500/40 transform hover:scale-110 border border-rose-400/30"
          title={t('delete')}
        >
          <Trash2 size={28} />
        </button>
      </div>
    </div>
  );
};
