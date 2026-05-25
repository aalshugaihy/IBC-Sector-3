import { Task } from '../types';
import { STATUS_OPTIONS } from '../constants';
import { isBefore, parseISO, startOfDay } from 'date-fns';

interface ReportData {
  title: string;
  period: string;
  summary: string;
  metrics: {
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    overdueTasks: number;
  };
  sections: {
    title: string;
    content: string;
    type?: string;
    chartData?: { name: string; value: number }[];
  }[];
}

export function generateLocalReport(tasks: Task[], period: string, lang: 'ar' | 'en' = 'ar'): ReportData {
  const isAr = lang === 'ar';
  const today = startOfDay(new Date());

  // Calculate metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const ongoingTasks = tasks.filter(t => t.status === 'ongoing').length;
  const notStartedTasks = tasks.filter(t => t.status === 'not-started').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const overdueTasks = tasks.filter(t => {
    if (t.status === 'completed') return false;
    if (!t.endDate) return false;
    return isBefore(startOfDay(parseISO(t.endDate)), today);
  }).length;
  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;
  const avgCompletion = totalTasks > 0 ? Math.round(tasks.reduce((sum, t) => sum + (t.completionPercentage || 0), 0) / totalTasks) : 0;

  // Department breakdown
  const byDept: Record<string, { total: number; completed: number; ongoing: number }> = {};
  tasks.forEach(t => {
    if (!byDept[t.department]) byDept[t.department] = { total: 0, completed: 0, ongoing: 0 };
    byDept[t.department].total++;
    if (t.status === 'completed') byDept[t.department].completed++;
    if (t.status === 'ongoing') byDept[t.department].ongoing++;
  });

  // Status breakdown
  const byStatus: Record<string, number> = {};
  tasks.forEach(t => {
    const label = STATUS_OPTIONS.find(s => s.value === t.status)?.label[lang] || t.status;
    byStatus[label] = (byStatus[label] || 0) + 1;
  });

  // Priority breakdown
  const byPriority: Record<string, number> = {};
  tasks.forEach(t => {
    const pLabel = t.priority === 'urgent' ? (isAr ? 'عاجل' : 'Urgent') :
                   t.priority === 'high' ? (isAr ? 'مرتفع' : 'High') :
                   t.priority === 'medium' ? (isAr ? 'متوسط' : 'Medium') :
                   (isAr ? 'منخفض' : 'Low');
    byPriority[pLabel] = (byPriority[pLabel] || 0) + 1;
  });

  // Classification breakdown
  const byClassification: Record<string, number> = {};
  tasks.forEach(t => {
    if (t.classification) {
      byClassification[t.classification] = (byClassification[t.classification] || 0) + 1;
    }
  });

  // Month breakdown
  const byMonth: Record<string, number> = {};
  tasks.forEach(t => {
    if (t.month) byMonth[t.month] = (byMonth[t.month] || 0) + 1;
  });

  // Obstacles
  const tasksWithObstacles = tasks.filter(t => t.obstacles && t.obstacles.trim().length > 0);

  // Build title
  const title = isAr
    ? `التقرير التنفيذي - ${period}`
    : `Executive Report - ${period}`;

  // Build summary
  const summary = isAr
    ? `خلال الفترة ${period}، تم تسجيل ${totalTasks} مهمة. تم إنجاز ${completedTasks} مهمة بنسبة إنجاز ${completionRate}%. يوجد ${ongoingTasks} مهمة قيد التنفيذ و${overdueTasks} مهمة متأخرة. متوسط نسبة الإنجاز الإجمالي ${avgCompletion}%.${urgentTasks > 0 ? ` يوجد ${urgentTasks} مهمة عاجلة تتطلب اهتماماً فورياً.` : ''}`
    : `During ${period}, ${totalTasks} tasks were recorded. ${completedTasks} tasks completed with a ${completionRate}% completion rate. ${ongoingTasks} tasks are ongoing and ${overdueTasks} are overdue. Average completion is ${avgCompletion}%.${urgentTasks > 0 ? ` ${urgentTasks} urgent tasks require immediate attention.` : ''}`;

  // Build sections
  const sections: ReportData['sections'] = [];

  // 1. Status Distribution
  sections.push({
    title: isAr ? 'توزيع حالات المهام' : 'Task Status Distribution',
    content: isAr
      ? `إجمالي المهام: ${totalTasks}\n- مكتملة: ${completedTasks} (${completionRate}%)\n- قيد التنفيذ: ${ongoingTasks}\n- لم تبدأ: ${notStartedTasks}\n- متأخرة: ${overdueTasks}`
      : `Total tasks: ${totalTasks}\n- Completed: ${completedTasks} (${completionRate}%)\n- Ongoing: ${ongoingTasks}\n- Not Started: ${notStartedTasks}\n- Overdue: ${overdueTasks}`,
    type: 'chart',
    chartData: Object.entries(byStatus).map(([name, value]) => ({ name, value }))
  });

  // 2. Department Breakdown
  const deptLines = Object.entries(byDept).map(([dept, data]) => {
    const rate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
    return isAr
      ? `- ${dept}: ${data.total} مهمة (${data.completed} مكتملة، ${data.ongoing} قيد التنفيذ) — نسبة الإنجاز ${rate}%`
      : `- ${dept}: ${data.total} tasks (${data.completed} completed, ${data.ongoing} ongoing) — ${rate}% completion`;
  }).join('\n');

  sections.push({
    title: isAr ? 'التوزيع حسب الإدارات' : 'Distribution by Department',
    content: deptLines || (isAr ? 'لا توجد بيانات' : 'No data available'),
    type: 'chart',
    chartData: Object.entries(byDept).map(([name, data]) => ({ name, value: data.total }))
  });

  // 3. Priority Analysis
  sections.push({
    title: isAr ? 'تحليل الأولويات' : 'Priority Analysis',
    content: Object.entries(byPriority).map(([p, count]) => `- ${p}: ${count}`).join('\n') || (isAr ? 'لا توجد بيانات' : 'No data'),
    type: 'chart',
    chartData: Object.entries(byPriority).map(([name, value]) => ({ name, value }))
  });

  // 4. Monthly Distribution
  if (Object.keys(byMonth).length > 0) {
    sections.push({
      title: isAr ? 'التوزيع الشهري' : 'Monthly Distribution',
      content: Object.entries(byMonth).map(([month, count]) => `- ${month}: ${count}`).join('\n'),
      type: 'chart',
      chartData: Object.entries(byMonth).map(([name, value]) => ({ name, value }))
    });
  }

  // 5. Classification
  if (Object.keys(byClassification).length > 0) {
    sections.push({
      title: isAr ? 'التصنيفات' : 'Classifications',
      content: Object.entries(byClassification).map(([cls, count]) => `- ${cls}: ${count}`).join('\n'),
      type: 'chart',
      chartData: Object.entries(byClassification).map(([name, value]) => ({ name, value }))
    });
  }

  // 6. Risk Assessment
  if (overdueTasks > 0 || urgentTasks > 0 || tasksWithObstacles.length > 0) {
    let riskContent = '';
    if (isAr) {
      if (overdueTasks > 0) riskContent += `- عدد المهام المتأخرة: ${overdueTasks}\n`;
      if (urgentTasks > 0) riskContent += `- مهام عاجلة لم تكتمل: ${urgentTasks}\n`;
      if (tasksWithObstacles.length > 0) {
        riskContent += `\nالمعوقات المسجلة:\n`;
        tasksWithObstacles.slice(0, 10).forEach(t => {
          riskContent += `- ${t.title}: ${t.obstacles}\n`;
        });
      }
    } else {
      if (overdueTasks > 0) riskContent += `- Overdue tasks: ${overdueTasks}\n`;
      if (urgentTasks > 0) riskContent += `- Unfinished urgent tasks: ${urgentTasks}\n`;
      if (tasksWithObstacles.length > 0) {
        riskContent += `\nRecorded obstacles:\n`;
        tasksWithObstacles.slice(0, 10).forEach(t => {
          riskContent += `- ${t.title}: ${t.obstacles}\n`;
        });
      }
    }
    sections.push({
      title: isAr ? 'تقييم المخاطر والمعوقات' : 'Risk Assessment & Obstacles',
      content: riskContent,
      type: 'text'
    });
  }

  // 7. Recommendations
  const recommendations: string[] = [];
  if (isAr) {
    if (completionRate < 50) recommendations.push('نسبة الإنجاز أقل من 50% — يُوصى بمراجعة خطة العمل وتوزيع الموارد');
    if (overdueTasks > totalTasks * 0.2) recommendations.push('نسبة المهام المتأخرة مرتفعة — يُوصى بإعادة جدولة المهام وتحديد الأولويات');
    if (urgentTasks > 3) recommendations.push(`يوجد ${urgentTasks} مهمة عاجلة — يُوصى بتخصيص فريق طوارئ للمتابعة`);
    if (tasksWithObstacles.length > 0) recommendations.push('معالجة المعوقات المسجلة بشكل فوري لتجنب التأخير المتراكم');
    if (recommendations.length === 0) recommendations.push('الأداء جيد — يُوصى بالاستمرار على نفس الوتيرة مع التركيز على المهام المتبقية');
  } else {
    if (completionRate < 50) recommendations.push('Completion rate below 50% — review work plan and resource allocation');
    if (overdueTasks > totalTasks * 0.2) recommendations.push('High overdue rate — reschedule tasks and reprioritize');
    if (urgentTasks > 3) recommendations.push(`${urgentTasks} urgent tasks pending — assign dedicated follow-up team`);
    if (tasksWithObstacles.length > 0) recommendations.push('Address recorded obstacles immediately to prevent cascading delays');
    if (recommendations.length === 0) recommendations.push('Performance is good — maintain current pace and focus on remaining tasks');
  }
  sections.push({
    title: isAr ? 'التوصيات' : 'Recommendations',
    content: recommendations.map(r => `- ${r}`).join('\n'),
    type: 'text'
  });

  return {
    title,
    period,
    summary,
    metrics: { totalTasks, completedTasks, completionRate, overdueTasks },
    sections
  };
}
