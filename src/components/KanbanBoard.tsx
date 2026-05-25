import React from 'react';
import { Task, User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MoreVertical, Calendar, CheckCircle2, Clock, 
  AlertCircle, User as UserIcon, ArrowRight, 
  ChevronRight, ChevronLeft, LayoutGrid, List as ListIcon,
  Plus, Edit2, Trash2, History, Link as LinkIcon, Archive, RotateCcw,
  GripVertical, Eye
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { STATUS_OPTIONS } from '../constants';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { isBefore, startOfDay, parseISO } from 'date-fns';

interface KanbanBoardProps {
  tasks: Task[];
  users: User[];
  onUpdateTask: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onViewTask?: (task: Task) => void;
  onDeleteTask?: (id: string) => void;
  onCopyTask?: (task: Task) => void;
  openHistoryModal?: (task: Task) => void;
  isMonitor?: boolean;
}

interface SortableTaskCardProps {
  task: Task;
  users: User[];
  tasks: Task[];
  onEditTask?: (task: Task) => void;
  onViewTask?: (task: Task) => void;
  onDeleteTask?: (id: string) => void;
  onUpdateTask: (task: Task) => void;
  openHistoryModal?: (task: Task) => void;
  isMonitor?: boolean;
  isRTL: boolean;
  t: any;
}

const SortableTaskCard: React.FC<SortableTaskCardProps> = ({ 
  task, users, tasks, onEditTask, onViewTask, onDeleteTask, onUpdateTask, openHistoryModal, isMonitor, isRTL, t 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: task.id!,
    data: {
      type: 'Task',
      task
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const today = startOfDay(new Date());
  const dueDate = task.endDate ? startOfDay(parseISO(task.endDate)) : null;
  const isOverdue = dueDate && task.status !== 'completed' && isBefore(dueDate, today);
  const isDueSoon = dueDate && task.status !== 'completed' && !isOverdue && 
                    isBefore(dueDate, startOfDay(new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)));

  const isUrgent = task.status !== 'completed' && (task.priority === 'urgent' || isOverdue);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
    >
      <motion.div
        layout
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{
          opacity: task.isArchived ? 0.6 : 1,
          y: 0,
          scale: 1,
          filter: task.isArchived ? 'grayscale(0.5)' : 'none'
        }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ y: -4, scale: 1.01 }}
        className={cn(
          "glass-1 p-5 rounded-xl border border-slate-200/50 dark:border-white/5 shadow-md transition-all cursor-pointer relative overflow-hidden group",
          task.isArchived && "opacity-60 grayscale"
        )}
      >
        {/* Drag Handle */}
        <div 
          {...attributes} 
          {...listeners}
          className="absolute top-4 right-4 p-2 text-gold/30 hover:text-gold cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 bg-gold/5 rounded-lg border border-gold/10"
        >
          <GripVertical size={20} />
        </div>

        {/* Priority Indicator */}
        <div className={cn(
          "absolute top-0 w-2 h-full transition-all duration-500 group-hover:w-3",
          isRTL ? "right-0" : "left-0",
          task.priority === 'urgent' ? 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.6)]' :
          task.priority === 'high' ? 'bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.6)]' :
          task.priority === 'medium' ? 'bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)]' : 'bg-gold/20'
        )} />

        <div className="flex items-start justify-between mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-gold bg-gold/10 border border-gold/20 px-2 py-0.5 rounded-md">
              {task.refNo || 'TSK-000'}
            </span>
            {task.isArchived && (
              <span className="text-xs font-medium bg-white/5 text-slate-400 dark:text-white/40 px-2 py-0.5 rounded-md border border-slate-200 dark:border-white/10">
                {t('archive')}
              </span>
            )}
            {isOverdue && (
              <div className="flex items-center gap-2 bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-md border border-rose-500/20 animate-pulse">
                <AlertCircle size={12} />
                <span className="text-xs font-medium">{t('overdue')}</span>
              </div>
            )}
          </div>
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-md border",
            task.priority === 'urgent' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
            task.priority === 'high' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
            'bg-white/5 text-slate-400 dark:text-white/30 border-slate-200 dark:border-white/10'
          )}>
            {t(task.priority || 'low')}
          </span>
        </div>

        <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-4 line-clamp-2 leading-tight flex items-center gap-2 pr-8">
          {task.title}
          {isUrgent && (
            <AlertCircle size={18} className="text-rose-500 animate-pulse shadow-rose-500/40 shadow-lg shrink-0" />
          )}
          {(task.dependencies?.length || 0) > 0 && (
            <LinkIcon size={18} className="text-gold animate-pulse shadow-gold/40 shadow-lg shrink-0" />
          )}
        </h4>

        <div className="space-y-6">
          {/* Dependencies Display */}
          {(task.dependencies?.length || 0) > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {task.dependencies?.map(depId => {
                const depTask = tasks.find(t => t.id === depId);
                return depTask ? (
                  <span key={`dep-${depId}`} className="px-2 py-0.5 bg-gold/5 border border-gold/10 text-gold/60 text-xs font-medium rounded-md truncate max-w-[140px]">
                    {depTask.title}
                  </span>
                ) : null;
              })}
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-white/40 bg-slate-100/60 dark:bg-white/5 p-3 rounded-lg border border-slate-200 dark:border-white/5">
            <Calendar size={18} className={isOverdue ? 'text-rose-400' : isDueSoon ? 'text-amber-400' : 'text-gold shadow-gold/40 shadow-lg'} />
            <span className={isOverdue ? 'text-rose-400' : isDueSoon ? 'text-amber-400' : 'text-slate-500 dark:text-white/60'}>{task.startDate || '-'}</span>
            <ArrowRight size={16} className="text-slate-300 dark:text-white/20" />
            <span className={isOverdue ? 'text-rose-400' : isDueSoon ? 'text-amber-400' : 'text-slate-500 dark:text-white/60'}>{task.endDate || '-'}</span>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-gold/10">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-4 overflow-hidden">
                {task.assignedTo && (
                  <img 
                    key={`assigned-${task.assignedTo}`}
                    src={users.find(u => u.uid === task.assignedTo)?.photoURL || undefined} 
                    alt="" 
                    className="w-10 h-10 rounded-full border-2 border-navy shadow-2xl ring-2 ring-gold/20" 
                  />
                )}
                {task.teamMembers?.slice(0, 2).map(m => (
                  <img 
                    key={`team-${m.userId}`}
                    src={users.find(u => u.uid === m.userId)?.photoURL || undefined} 
                    alt="" 
                    className="w-10 h-10 rounded-full border-2 border-navy shadow-2xl ring-2 ring-gold/20" 
                  />
                ))}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gold">
                  {task.department}
                </span>
                <span className="text-xs font-medium text-slate-400 dark:text-slate-400">
                  {task.classification || 'General'}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <span className="text-xs font-medium text-slate-900 dark:text-white">{task.completionPercentage}%</span>
              <div className="w-20 h-2.5 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 shadow-inner p-[1px]">
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
        <div className="absolute inset-0 bg-white/95 dark:bg-navy/95 backdrop-blur-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 z-20">
          <button
            onClick={(e) => { e.stopPropagation(); onViewTask?.(task); }}
            className="p-3 bg-slate-100 dark:bg-white/5 hover:bg-gold/10 text-slate-700 dark:text-white hover:text-gold rounded-xl transition-all border border-slate-200 dark:border-white/10 hover:border-gold/30 shadow-md transform hover:scale-105"
            title={t('preview')}
          >
            <Eye size={20} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); openHistoryModal?.(task); }}
            className="p-3 bg-slate-100 dark:bg-white/5 hover:bg-gold/10 text-slate-700 dark:text-white hover:text-gold rounded-xl transition-all border border-slate-200 dark:border-white/10 hover:border-gold/30 shadow-md transform hover:scale-105"
            title={t('history')}
          >
            <History size={20} />
          </button>
          {!isMonitor && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onEditTask?.(task); }}
                className="p-3 bg-gold text-navy rounded-xl hover:scale-105 transition-all shadow-md shadow-gold/30 border border-gold/50"
              >
                <Edit2 size={20} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onUpdateTask({ ...task, isArchived: !task.isArchived }); }}
                className="p-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all shadow-md transform hover:scale-105"
                title={task.isArchived ? t('unarchive') : t('archive')}
              >
                {task.isArchived ? <RotateCcw size={20} /> : <Archive size={20} />}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteTask?.(task.id!); }}
                className="p-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-all shadow-md transform hover:scale-105"
              >
                <Trash2 size={20} />
              </button>
            </>
          )}
        </div>
      </motion.div>

    </div>
  );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  tasks, users, onUpdateTask, onEditTask, onViewTask, onDeleteTask, onCopyTask, openHistoryModal, isMonitor 
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [visibleColumns, setVisibleColumns] = React.useState<string[]>(() => {
    const saved = localStorage.getItem('kanban_visible_columns');
    return saved ? JSON.parse(saved) : STATUS_OPTIONS.map(s => s.value);
  });
  const [showSettings, setShowSettings] = React.useState(false);
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = React.useState<any | null>(null);
  const [orderedColumns, setOrderedColumns] = React.useState(() => {
    const saved = localStorage.getItem('kanban_column_order');
    if (saved) {
      const order = JSON.parse(saved);
      return STATUS_OPTIONS.sort((a, b) => order.indexOf(a.value) - order.indexOf(b.value));
    }
    return STATUS_OPTIONS;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleColumn = (status: string) => {
    const newVisible = visibleColumns.includes(status)
      ? visibleColumns.filter(s => s !== status)
      : [...visibleColumns, status];
    setVisibleColumns(newVisible);
    localStorage.setItem('kanban_visible_columns', JSON.stringify(newVisible));
  };

  const getTasksByStatus = (status: string) => tasks.filter(t => t.status === status);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'Column') {
      setActiveColumn(active.data.current.column);
      return;
    }
    const task = tasks.find(t => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setActiveColumn(null);

    if (!over) return;

    // Handle Column Reordering
    if (active.data.current?.type === 'Column' && over.data.current?.type === 'Column') {
      if (active.id !== over.id) {
        const oldIndex = orderedColumns.findIndex(c => c.value === active.id);
        const newIndex = orderedColumns.findIndex(c => c.value === over.id);
        const newOrdered = arrayMove(orderedColumns, oldIndex, newIndex);
        setOrderedColumns(newOrdered);
        localStorage.setItem('kanban_column_order', JSON.stringify(newOrdered.map(c => c.value)));
      }
      return;
    }

    // Handle Task Reordering/Moving
    const taskId = active.id as string;
    const overId = over.id as string;

    let newStatus: string | null = null;
    
    const column = STATUS_OPTIONS.find(s => s.value === overId);
    if (column) {
      newStatus = column.value;
    } else {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
      }
    }

    if (newStatus) {
      const task = tasks.find(t => t.id === taskId);
      if (task && task.status !== newStatus) {
        onUpdateTask({ ...task, status: newStatus as any });
      }
    }
  };

  const SortableColumn = ({ column, children }: { column: any, children: React.ReactNode }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging
    } = useSortable({
      id: column.value,
      data: {
        type: 'Column',
        column
      }
    });

    const style = {
      transform: CSS.Translate.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex-shrink-0 w-[360px] flex flex-col bg-slate-50/80 dark:bg-navy/40 backdrop-blur-xl rounded-2xl border border-gold/20 p-5 shadow-lg relative group/column"
      >
        {/* Column Header */}
        <div
          {...attributes}
          {...listeners}
          className={cn(
            "flex items-center justify-between mb-5 p-4 rounded-xl border cursor-grab active:cursor-grabbing transition-all duration-300",
            column.value === 'completed' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
            column.value === 'ongoing' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
            column.value === 'not-started' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' :
            column.value === 'on-hold' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
            'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/60'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
              {column.value === 'completed' ? <CheckCircle2 size={20} /> :
               column.value === 'ongoing' ? <Clock size={20} /> :
               column.value === 'not-started' ? <AlertCircle size={20} /> :
               column.value === 'on-hold' ? <AlertCircle size={20} /> :
               <AlertCircle size={20} />}
            </div>
            <div>
              <h3 className="text-sm font-semibold leading-none mb-1">{column.label[i18n.language as 'ar' | 'en']}</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium opacity-60">
                  {getTasksByStatus(column.value).length} {t('tasks')}
                </span>
                <div className="w-1 h-1 bg-slate-300 dark:bg-white/20 rounded-full" />
                <span className="text-xs font-medium text-gold/60">
                  {Math.round((getTasksByStatus(column.value).length / tasks.length) * 100 || 0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
        {children}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-[600px]">
      <div className="flex justify-end mb-4 px-4">
        <div className="relative">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gold/30 text-sm font-medium text-gold hover:bg-gold/10 transition-all"
          >
            <LayoutGrid size={20} className="text-gold" />
            {t('kanban')} {t('settings')}
          </button>

          <AnimatePresence>
            {showSettings && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={`absolute top-full mt-3 ${isRTL ? 'left-0' : 'right-0'} w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 z-[60]`}
              >
                <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3 px-1">{t('kanban')} {t('settings')}</h4>
                <div className="space-y-1">
                  {STATUS_OPTIONS.map(status => (
                    <button
                      key={status.value}
                      onClick={() => toggleColumn(status.value)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                      <span className="text-sm font-medium text-slate-600 dark:text-white/70">
                        {status.label[i18n.language as 'ar' | 'en']}
                      </span>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        visibleColumns.includes(status.value)
                          ? 'bg-gold border-gold'
                          : 'border-slate-300 dark:border-white/10'
                      }`}>
                        {visibleColumns.includes(status.value) && <CheckCircle2 size={12} className="text-navy" />}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-6 flex-1 custom-scrollbar">
          <SortableContext 
            items={orderedColumns.filter(col => visibleColumns.includes(col.value)).map(c => c.value)}
          >
            {orderedColumns.filter(col => visibleColumns.includes(col.value)).map(column => (
              <SortableColumn key={column.value} column={column}>
                {/* Task List */}
                <SortableContext
                  id={column.value}
                  items={getTasksByStatus(column.value).map(t => t.id!)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar min-h-[150px]">
                    <AnimatePresence mode="popLayout">
                      {getTasksByStatus(column.value).map(task => (
                        <SortableTaskCard
                          key={task.id}
                          task={task}
                          users={users}
                          tasks={tasks}
                          onEditTask={onEditTask}
                          onViewTask={onViewTask}
                          onDeleteTask={onDeleteTask}
                          onUpdateTask={onUpdateTask}
                          openHistoryModal={openHistoryModal}
                          isMonitor={isMonitor}
                          isRTL={isRTL}
                          t={t}
                        />
                      ))}
                    </AnimatePresence>
                    
                    {!isMonitor && (
                      <button 
                        onClick={() => onEditTask?.({ status: column.value } as any)}
                        className="w-full py-3 border-2 border-dashed border-gold/20 rounded-lg text-gold/40 hover:text-gold hover:border-gold/50 hover:bg-gold/5 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <Plus size={20} />
                        {t('addEvent')}
                      </button>
                    )}
                  </div>
                </SortableContext>
              </SortableColumn>
            ))}
          </SortableContext>
        </div>

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
        }}>
          {activeTask ? (
            <div className="w-80 sm:w-96 rotate-3 scale-105 shadow-2xl">
              <SortableTaskCard
                task={activeTask}
                users={users}
                tasks={tasks}
                onEditTask={onEditTask}
                onViewTask={onViewTask}
                onDeleteTask={onDeleteTask}
                onUpdateTask={onUpdateTask}
                openHistoryModal={openHistoryModal}
                isMonitor={isMonitor}
                isRTL={isRTL}
                t={t}
              />
            </div>
          ) : activeColumn ? (
            <div className="w-80 sm:w-96 rotate-1 scale-105 shadow-2xl opacity-80">
              <div className={`flex items-center justify-between mb-6 p-4 rounded-2xl border ${activeColumn.color}`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    {activeColumn.value === 'completed' ? <CheckCircle2 size={20} /> : 
                     activeColumn.value === 'ongoing' ? <Clock size={20} /> : <AlertCircle size={20} />}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{activeColumn.label[i18n.language as 'ar' | 'en']}</h3>
                    <span className="text-[10px] font-bold opacity-70">
                      {getTasksByStatus(activeColumn.value).length} {t('tasks')}
                    </span>
                  </div>
                </div>
                <button className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

