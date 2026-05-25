import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Task, Committee, CommitteeStatus } from '../types';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp, CheckCircle2, Clock, AlertCircle,
  Calendar, BarChart3, PieChart as PieChartIcon, Activity, Loader2,
  Briefcase, Target, MailQuestion, ShieldCheck
} from 'lucide-react';
import {
  STATUS_OPTIONS, REQUEST_TYPE_OPTIONS, SECTOR_OPTIONS,
  PURPOSE_OPTIONS, DIRECTION_OPTIONS,
} from '../constants';
import { computeRequestMetrics } from '../lib/delayStatus';

interface DashboardProps {
  tasks: Task[];
  committees?: Committee[];
  isAdmin: boolean;
  onResetTasks: () => Promise<void>;
}

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export const Dashboard: React.FC<DashboardProps> = ({ tasks, committees = [], isAdmin, onResetTasks }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [resetting, setResetting] = React.useState(false);

  const handleReset = async () => {
    if (window.confirm(t('confirmResetTasks'))) {
      setResetting(true);
      try {
        await onResetTasks();
      } finally {
        setResetting(false);
      }
    }
  };

  // ===== Unified metrics (matches Excel "حالة التأخير" + Dashboard logic) =====
  const m = computeRequestMetrics(tasks);
  const totalTasks = m.total;
  const completedTasks = m.completed;
  const ongoingTasks = m.ongoing;
  const overdueTasks = m.overdue;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Data for Charts
  const tasksByDept = tasks.reduce((acc, task) => {
    acc[task.department] = (acc[task.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const deptData = Object.entries(tasksByDept).map(([name, value]) => ({ name, value }));

  const tasksByStatus = tasks.reduce((acc, task) => {
    const statusLabel = STATUS_OPTIONS.find(s => s.value === task.status)?.label[i18n.language as 'ar' | 'en'] || task.status;
    acc[statusLabel] = (acc[statusLabel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(tasksByStatus).map(([name, value]) => ({ name, value }));

  // Volume by Month
  const tasksByMonth = tasks.reduce((acc, task) => {
    acc[task.month] = (acc[task.month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Sort months properly if needed, for now just use keys
  const monthData = Object.entries(tasksByMonth).map(([name, value]) => ({ name, value }));

  // Planned vs Actual (simplified)
  const comparisonData = [
    { name: t('plannedDate'), value: tasks.filter(t => t.plannedDate).length },
    { name: t('actualDate'), value: tasks.filter(t => t.actualDate).length },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-1000 relative">
      {/* Reset Button */}
      {isAdmin && (
        <div className="flex justify-end">
          <button onClick={handleReset} disabled={resetting} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/15 transition-colors disabled:opacity-50">
            {resetting ? <Loader2 className="animate-spin" size={16} /> : <AlertCircle size={16} />}
            {t('resetTasks')}
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('totalTasks')}
          value={totalTasks}
          icon={<BarChart3 size={20} />}
          trend={String(totalTasks)}
          color="primary"
        />
        <StatCard
          title={t('completedTasks')}
          value={completedTasks}
          icon={<CheckCircle2 size={20} />}
          trend={`${completionRate.toFixed(0)}%`}
          color="emerald"
        />
        <StatCard
          title={t('ongoingTasks')}
          value={ongoingTasks}
          icon={<Activity size={20} />}
          trend={`${totalTasks > 0 ? Math.round((ongoingTasks/totalTasks)*100) : 0}%`}
          color="amber"
        />
        <StatCard
          title={t('overdueRequests')}
          value={overdueTasks}
          icon={<AlertCircle size={20} />}
          trend={`${totalTasks > 0 ? Math.round((overdueTasks/totalTasks)*100) : 0}%`}
          color="rose"
        />
      </div>

      {/* ===== Request-Tracker SLA strip (auto-computed from due/close dates) ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('slaCompliance')}
          value={Math.round(m.slaCompliance)}
          icon={<ShieldCheck size={20} />}
          trend={`${m.completedOnTime}/${m.completed}`}
          color="emerald"
          suffix="%"
        />
        <StatCard
          title={t('onTimeRequests')}
          value={m.onTime}
          icon={<Target size={20} />}
          trend={`${totalTasks > 0 ? Math.round((m.onTime/totalTasks)*100) : 0}%`}
          color="primary"
        />
        <StatCard
          title={t('awaitingReply')}
          value={m.awaitingReply}
          icon={<MailQuestion size={20} />}
          trend={String(m.awaitingReply)}
          color="amber"
        />
        <StatCard
          title={t('needsFollowUp')}
          value={m.needsFollowUp}
          icon={<Clock size={20} />}
          trend={`${m.missingDate} ${t('missingDates')}`}
          color="rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <ChartContainer title={t('taskDistributionByDepartment')} icon={<BarChart3 size={18} />}>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={deptData} layout={isRTL ? 'vertical' : 'horizontal'} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
              <XAxis 
                dataKey={isRTL ? 'value' : 'name'} 
                type={isRTL ? 'number' : 'category'} 
                tick={{ fontSize: 11, fontWeight: 500, fill: 'currentColor' }} 
                axisLine={false}
                tickLine={false}
                className="text-slate-400"
              />
              <YAxis 
                dataKey={isRTL ? 'name' : 'value'} 
                type={isRTL ? 'category' : 'number'} 
                width={isRTL ? 140 : 50} 
                tick={{ fontSize: 11, fontWeight: 500, fill: 'currentColor' }} 
                axisLine={false}
                tickLine={false}
                orientation={isRTL ? 'right' : 'left'}
                className="text-slate-400"
              />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--tooltip-bg)', color: 'var(--tooltip-text)', border: '1px solid var(--tooltip-border)', borderRadius: '12px', fontSize: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                itemStyle={{ color: '#6366f1' }}
                cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
              />
              <Bar dataKey="value" fill="url(#barGradient)" radius={isRTL ? [0, 10, 10, 0] : [10, 10, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Status Distribution */}
        <ChartContainer title={t('taskStatusDistribution')} icon={<PieChartIcon size={18} />}>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={90}
                outerRadius={130}
                paddingAngle={8}
                dataKey="value"
                stroke="none"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--tooltip-bg)', color: 'var(--tooltip-text)', border: '1px solid var(--tooltip-border)', borderRadius: '12px', fontSize: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
              />
              <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ color: 'currentColor', fontWeight: '700', fontSize: '12px', paddingTop: '20px' }} className="text-slate-500" />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Volume by Month */}
        <ChartContainer title={t('eventDistributionByMonth')} icon={<TrendingUp size={18} />}>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={monthData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 500, fill: 'currentColor' }} axisLine={false} tickLine={false} className="text-slate-400" />
              <YAxis tick={{ fontSize: 11, fontWeight: 500, fill: 'currentColor' }} axisLine={false} tickLine={false} orientation={isRTL ? 'right' : 'left'} className="text-slate-400" />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--tooltip-bg)', color: 'var(--tooltip-text)', border: '1px solid var(--tooltip-border)', borderRadius: '12px', fontSize: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
              />
              <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Planned vs Actual */}
        <ChartContainer title={t('plannedVsActual')} icon={<Calendar size={18} />}>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
              <XAxis dataKey="name" tick={{ fontSize: 13, fontWeight: 500, fill: 'currentColor' }} axisLine={false} tickLine={false} className="text-slate-400" />
              <YAxis tick={{ fontSize: 13, fontWeight: 500, fill: 'currentColor' }} axisLine={false} tickLine={false} orientation={isRTL ? 'right' : 'left'} className="text-slate-400" />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--tooltip-bg)', color: 'var(--tooltip-text)', border: '1px solid var(--tooltip-border)', borderRadius: '12px', fontSize: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                itemStyle={{ color: '#6366f1' }}
              />
              <Bar dataKey="value" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ===== Request-Tracker Charts ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests by Sector */}
        <ChartContainer title={t('requestsBySector')} icon={<BarChart3 size={18} />}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={(() => {
                const map = tasks.reduce((acc, task) => {
                  if (!task.sector) return acc;
                  const lbl = SECTOR_OPTIONS.find(o => o.value === task.sector)?.label[i18n.language as 'ar' | 'en'] || task.sector;
                  acc[lbl] = (acc[lbl] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>);
                return Object.entries(map).map(([name, value]) => ({ name, value }));
              })()}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
              <XAxis type="number" tick={{ fontSize: 11, fontWeight: 500, fill: 'currentColor' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11, fontWeight: 500, fill: 'currentColor' }} axisLine={false} tickLine={false} orientation={isRTL ? 'right' : 'left'} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--tooltip-bg)', color: 'var(--tooltip-text)', border: '1px solid var(--tooltip-border)', borderRadius: '12px', fontSize: '12px' }}
                cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
              />
              <Bar dataKey="value" fill="#6366f1" radius={isRTL ? [0, 10, 10, 0] : [10, 10, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Requests by Type */}
        <ChartContainer title={t('requestsByType')} icon={<PieChartIcon size={18} />}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={(() => {
                  const map = tasks.reduce((acc, task) => {
                    if (!task.requestType) return acc;
                    const lbl = REQUEST_TYPE_OPTIONS.find(o => o.value === task.requestType)?.label[i18n.language as 'ar' | 'en'] || task.requestType;
                    acc[lbl] = (acc[lbl] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);
                  return Object.entries(map).map(([name, value]) => ({ name, value }));
                })()}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {REQUEST_TYPE_OPTIONS.map((_, i) => (
                  <Cell key={`rt-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'var(--tooltip-bg)', color: 'var(--tooltip-text)', border: '1px solid var(--tooltip-border)', borderRadius: '12px', fontSize: '12px' }} />
              <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ color: 'currentColor', fontWeight: '700', fontSize: '11px', paddingTop: '15px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Delay distribution */}
        <ChartContainer title={t('delayDistribution')} icon={<AlertCircle size={18} />}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: t('delayOnTime'), value: m.onTime, color: '#10b981' },
                  { name: t('delayOverdue'), value: m.overdue, color: '#ef4444' },
                  { name: t('delayMissingDate'), value: m.missingDate, color: '#f59e0b' },
                ]}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {['#10b981', '#ef4444', '#f59e0b'].map((c, i) => (
                  <Cell key={`d-${i}`} fill={c} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'var(--tooltip-bg)', color: 'var(--tooltip-text)', border: '1px solid var(--tooltip-border)', borderRadius: '12px', fontSize: '12px' }} />
              <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ color: 'currentColor', fontWeight: '700', fontSize: '12px', paddingTop: '15px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Direction + Purpose dual */}
        <ChartContainer title={`${t('requestsByDirection')} • ${t('requestsByPurpose')}`} icon={<Activity size={18} />}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={(() => {
                const dir = DIRECTION_OPTIONS.map(opt => ({
                  name: opt.label[i18n.language as 'ar' | 'en'],
                  value: tasks.filter(t => t.direction === opt.value).length,
                  group: t('requestsByDirection'),
                }));
                const pur = PURPOSE_OPTIONS.map(opt => ({
                  name: opt.label[i18n.language as 'ar' | 'en'],
                  value: tasks.filter(t => t.purpose === opt.value).length,
                  group: t('requestsByPurpose'),
                }));
                return [...dir, ...pur];
              })()}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 500, fill: 'currentColor' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fontWeight: 500, fill: 'currentColor' }} axisLine={false} tickLine={false} orientation={isRTL ? 'right' : 'left'} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--tooltip-bg)', color: 'var(--tooltip-text)', border: '1px solid var(--tooltip-border)', borderRadius: '12px', fontSize: '12px' }} />
              <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Committees Charts */}
      {committees.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer title={t('committeesByStatus')} icon={<Briefcase size={18} />}>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={(() => {
                    const map = committees.reduce((acc, c) => {
                      const s = (c.status || 'forming') as CommitteeStatus;
                      acc[s] = (acc[s] || 0) + 1;
                      return acc;
                    }, {} as Record<CommitteeStatus, number>);
                    const labelMap: Record<CommitteeStatus, string> = {
                      forming: t('committeeStatusForming'),
                      active: t('committeeStatusActive'),
                      frozen: t('committeeStatusFrozen'),
                      ended: t('committeeStatusEnded'),
                    };
                    return Object.entries(map).map(([k, v]) => ({ name: labelMap[k as CommitteeStatus], value: v }));
                  })()}
                  cx="50%"
                  cy="50%"
                  innerRadius={90}
                  outerRadius={130}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {committees.map((_, index) => (
                    <Cell key={`cm-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--tooltip-bg)', color: 'var(--tooltip-text)', border: '1px solid var(--tooltip-border)', borderRadius: '12px', fontSize: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                />
                <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ color: 'currentColor', fontWeight: '700', fontSize: '12px', paddingTop: '20px' }} className="text-slate-500" />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>

          <ChartContainer title={t('committeesByDepartment')} icon={<Briefcase size={18} />}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={(() => {
                  const map = committees.reduce((acc, c) => {
                    const d = c.department || (isRTL ? 'بدون إدارة' : 'No Department');
                    acc[d] = (acc[d] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);
                  return Object.entries(map).map(([name, value]) => ({ name, value }));
                })()}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="cmtBarGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
                <XAxis type="number" tick={{ fontSize: 11, fontWeight: 500, fill: 'currentColor' }} axisLine={false} tickLine={false} className="text-slate-400" />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11, fontWeight: 500, fill: 'currentColor' }} axisLine={false} tickLine={false} orientation={isRTL ? 'right' : 'left'} className="text-slate-400" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--tooltip-bg)', color: 'var(--tooltip-text)', border: '1px solid var(--tooltip-border)', borderRadius: '12px', fontSize: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                  cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }}
                />
                <Bar dataKey="value" fill="url(#cmtBarGradient)" radius={isRTL ? [0, 10, 10, 0] : [10, 10, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      )}
    </div>
  );
};

function StatCard({ title, value, icon, trend, color, suffix }: { title: string, value: number, icon: React.ReactNode, trend: string, color: string, suffix?: string }) {
  const colorMap: Record<string, string> = {
    primary: 'bg-primary/5 text-primary border-primary/10 dark:bg-primary/10 dark:border-primary/20',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    amber: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    rose: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
  };

  return (
    <div className="glass-1 rounded-xl p-5 border border-slate-200/50 dark:border-white/5 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${colorMap[color] || colorMap.primary} transition-all group-hover:scale-110 duration-300 border`}>
          {icon}
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${colorMap[color] || colorMap.primary} border`}>
          {trend}
        </span>
      </div>
      <div>
        <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums leading-none">
          {value}{suffix && <span className="text-base font-semibold text-slate-500 dark:text-slate-400 ms-0.5">{suffix}</span>}
        </p>
      </div>
    </div>
  );
}

function ChartContainer({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <div className="glass-1 rounded-xl p-5 border border-slate-200/50 dark:border-white/5">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-primary/5 p-2 rounded-lg text-primary border border-primary/10">
          {icon}
        </div>
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">{title}</h3>
      </div>
      {children}
    </div>
  );
}
