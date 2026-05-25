import React, { useState } from 'react';
import { Task, Report } from '../types';
import { generateLocalReport } from '../services/localReportService';
import ReactMarkdown from 'react-markdown';
import {
  FileText, Download, Loader2, Send, Calendar,
  Presentation, FileJson, FileCode, BarChart3,
  CheckCircle2, AlertCircle, TrendingUp, PieChart as PieChartIcon,
  Sparkles, ChevronRight, ArrowLeft
} from 'lucide-react';
import { api } from '../api';
import { useTranslation } from 'react-i18next';
import pptxgen from 'pptxgenjs';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import 'jspdf-autotable';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { useRef } from 'react';


interface ReportGeneratorProps {
  tasks: Task[];
  onReportSaved: (report: Report) => void;
}

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

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ tasks, onReportSaved }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const reportRef = useRef<HTMLDivElement>(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<ReportData | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleGenerate = () => {
    if (!startDate || !endDate) return;
    setIsGenerating(true);
    try {
      const filteredTasks = tasks.filter(task => {
        const taskDate = task.startDate || task.endDate || task.plannedDate || task.actualDate;
        if (!taskDate) return false;
        return taskDate >= startDate && taskDate <= endDate;
      });
      const period = `${startDate} ${t('to')} ${endDate}`;
      const reportData = generateLocalReport(filteredTasks, period, i18n.language as 'ar' | 'en');
      setGeneratedReport(reportData);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedReport) return;
    try {
      const saved = await api.createReport({
        title: generatedReport.title,
        content: JSON.stringify(generatedReport),
        period: generatedReport.period,
      });
      onReportSaved(saved);
    } catch (error) {
      console.error('Save report error:', error);
    }
  };

  const downloadPPTX = () => {
    if (!generatedReport) return;
    setIsExporting(true);
    try {
      const pres = new pptxgen();
      pres.layout = 'LAYOUT_WIDE';
      pres.rtlMode = isRTL;

      // Title Slide
      const titleSlide = pres.addSlide();
      titleSlide.background = { color: '0f172a' };
      
      titleSlide.addText(generatedReport.title, {
        x: 1, y: 2, w: '80%', h: 1.5,
        fontSize: 44, color: '2563eb', bold: true, align: isRTL ? 'right' : 'left'
      });
      titleSlide.addText(generatedReport.period, {
        x: 1, y: 3.5, w: '80%', h: 1,
        fontSize: 24, color: 'FFFFFF', align: isRTL ? 'right' : 'left'
      });

      // Summary Slide
      const summarySlide = pres.addSlide();
      summarySlide.background = { color: '0f172a' };
      summarySlide.addText(t('executiveSummary'), {
        x: 0.5, y: 0.5, w: '90%', h: 1,
        fontSize: 32, color: '2563eb', bold: true, align: isRTL ? 'right' : 'left'
      });
      summarySlide.addText(generatedReport.summary, {
        x: 0.5, y: 1.5, w: '90%', h: 5,
        fontSize: 18, color: 'FFFFFF', align: isRTL ? 'right' : 'left',
        valign: 'top'
      });

      // Content Slides
      generatedReport.sections.forEach(section => {
        const slide = pres.addSlide();
        slide.background = { color: '0f172a' };
        slide.addText(section.title, {
          x: 0.5, y: 0.5, w: '90%', h: 1,
          fontSize: 32, color: '2563eb', bold: true, align: isRTL ? 'right' : 'left'
        });
        
        const cleanContent = section.content.replace(/[#*`]/g, '');
        slide.addText(cleanContent, {
          x: 0.5, y: 1.5, w: section.chartData ? '50%' : '90%', h: 5,
          fontSize: 16, color: 'FFFFFF', align: isRTL ? 'right' : 'left',
          valign: 'top'
        });

        if (section.chartData) {
          slide.addChart(pres.ChartType.bar, section.chartData.map(d => ({ name: d.name, labels: [d.name], values: [d.value] })), {
            x: 7, y: 1.5, w: 5.5, h: 4
          });
        }
      });

      pres.writeFile({ fileName: `${generatedReport.title}.pptx` });
    } catch (err) {
      console.error('PPTX export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const downloadDOCX = async () => {
    if (!generatedReport) return;
    setIsExporting(true);
    try {
      const children: any[] = [
        new Paragraph({
          text: generatedReport.title,
          heading: HeadingLevel.TITLE,
          alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
          bidirectional: isRTL,
        }),
        new Paragraph({
          text: generatedReport.period,
          alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
          bidirectional: isRTL,
        }),
        new Paragraph({ text: "" }),
      ];

      children.push(
        new Paragraph({
          text: t('executiveSummary'),
          heading: HeadingLevel.HEADING_1,
          alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
          bidirectional: isRTL,
        }),
        new Paragraph({
          text: generatedReport.summary,
          alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
          bidirectional: isRTL,
        }),
        ...generatedReport.sections.flatMap(section => [
          new Paragraph({ text: "" }),
          new Paragraph({
            text: section.title,
            heading: HeadingLevel.HEADING_2,
            alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
            bidirectional: isRTL,
          }),
          new Paragraph({
            text: section.content.replace(/[#*`]/g, ''),
            alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
            bidirectional: isRTL,
          })
        ])
      );

      const doc = new Document({
        sections: [{
          children,
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${generatedReport.title}.docx`;
      link.click();
    } catch (err) {
      console.error('DOCX export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const downloadPDF = async () => {
    if (!generatedReport || !reportRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: i18n.language === 'ar' ? '#ffffff' : null
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${generatedReport.title}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const downloadHTML = () => {
    if (!generatedReport) return;
    setIsExporting(true);
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="${i18n.language}" dir="${isRTL ? 'rtl' : 'ltr'}">
        <head>
          <meta charset="UTF-8">
          <title>${generatedReport.title}</title>
          <style>
            body { font-family: system-ui; padding: 40px; line-height: 1.6; color: #E0E7FF; max-width: 1000px; margin: 0 auto; background-color: #0f172a; }
            h1 { color: #2563eb; font-size: 3rem; margin-bottom: 0.5rem; }
            .period { color: #94A3B8; font-size: 1.25rem; margin-bottom: 2rem; }
            .cover-image { width: 100%; border-radius: 20px; margin-bottom: 3rem; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.5); border: 1px solid rgba(255,255,255,0.1); }
            h2 { color: #2563eb; border-bottom: 2px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-top: 40px; font-size: 2rem; }
            .summary { background: rgba(255,255,255,0.05); padding: 30px; border-radius: 20px; margin: 30px 0; font-size: 1.125rem; border: 1px solid rgba(255,255,255,0.1); }
            .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
            .metric-card { background: rgba(37,99,235,0.05); padding: 25px; border-radius: 20px; text-align: center; border: 1px solid rgba(37,99,235,0.2); }
            .metric-label { font-size: 0.875rem; font-weight: 600; color: #2563eb; text-transform: uppercase; letter-spacing: 0.05em; }
            .metric-value { font-size: 2.5rem; font-weight: 900; color: #FFFFFF; margin-top: 5px; }
            section { margin-bottom: 50px; }
            .section-content { font-size: 1.125rem; color: #CBD5E1; }
          </style>
        </head>
        <body>
          <h1>${generatedReport.title}</h1>
          <p class="period">${generatedReport.period}</p>
          

          <div class="metrics">
            <div class="metric-card"><div class="metric-label">${t('totalTasks')}</div><div class="metric-value">${generatedReport.metrics.totalTasks}</div></div>
            <div class="metric-card"><div class="metric-label">${t('completedTasks')}</div><div class="metric-value">${generatedReport.metrics.completedTasks}</div></div>
            <div class="metric-card"><div class="metric-label">${t('completionRate')}</div><div class="metric-value">${generatedReport.metrics.completionRate}%</div></div>
            <div class="metric-card"><div class="metric-label">${t('overdueTasks')}</div><div class="metric-value">${generatedReport.metrics.overdueTasks}</div></div>
          </div>

          <div class="summary">
            <h2>${t('executiveSummary')}</h2>
            <p>${generatedReport.summary}</p>
          </div>

          ${generatedReport.sections.map(s => `
            <section>
              <h2>${s.title}</h2>
              <div class="section-content">${s.content}</div>
            </section>
          `).join('')}
        </body>
        </html>
      `;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${generatedReport.title}.html`;
      link.click();
    } catch (err) {
      console.error('HTML export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glassy p-10 md:p-16 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -mr-48 -mt-48 blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-light/5 rounded-full -ml-32 -mb-32 blur-3xl opacity-50" />
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12 relative">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold uppercase">
              <Sparkles size={16} />
              AI Powered Reporting
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
              {t('generateReport')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-xl max-w-xl">
              {t('executiveDashboardDescription')}
            </p>
          </div>

          <div className="w-full lg:w-auto space-y-8 bg-slate-50 dark:bg-slate-900/50 p-10 rounded-2xl border border-slate-200 dark:border-slate-800 backdrop-blur-xl primary-glow">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-xs font-semibold text-primary uppercase ml-4">{t('startDate')}</label>
                <div className="relative group">
                  <Calendar className={`absolute ${isRTL ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-primary/50 group-focus-within:text-primary transition-colors`} size={20} />
                  <input
                    type="date"
                    className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl ${isRTL ? 'pr-14 pl-6' : 'pl-14 pr-6'} py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary text-slate-900 dark:text-white transition-all font-medium shadow-2xl outline-none`}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-semibold text-primary uppercase ml-4">{t('endDate')}</label>
                <div className="relative group">
                  <Calendar className={`absolute ${isRTL ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-primary/50 group-focus-within:text-primary transition-colors`} size={20} />
                  <input
                    type="date"
                    className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl ${isRTL ? 'pr-14 pl-6' : 'pl-14 pr-6'} py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary text-slate-900 dark:text-white transition-all font-medium shadow-2xl outline-none`}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !startDate || !endDate}
              className="w-full flex items-center justify-center gap-4 bg-primary text-white py-3 rounded-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed transition-all shadow-2xl shadow-primary/30 font-semibold text-sm group primary-glow"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={28} /> : <Send size={28} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
              <span>{t('generateReport')}</span>
            </button>
            {(!startDate || !endDate) && (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-2">{t('from')} - {t('to')}</p>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {!generatedReport ? (
          <div className="glassy rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 relative overflow-hidden group primary-glow">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            
            <div className="relative z-10">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-12 shadow-2xl shadow-primary/20 border border-primary/20 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
                <BarChart3 className="text-primary" size={80} />
              </div>
              <h3 className="text-4xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">{t('readyToAnalyze')}</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto text-xl font-medium leading-relaxed">
                {t('selectDateRange')}
              </p>
              
              <div className="mt-16 flex justify-center gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-3 h-3 rounded-full bg-primary/30 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <motion.div 
            key="report"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="space-y-16"
          >
            {/* Report Preview Container */}
            <div ref={reportRef} className="glassy rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              {/* Report Header Banner */}
              <div className="h-32 bg-gradient-to-r from-primary via-primary-dark to-accent rounded-xl mb-6 flex items-end p-6">
                <div>
                  <h2 className="text-white text-xl font-bold">{generatedReport.title}</h2>
                  <p className="text-white/70 text-sm">{generatedReport.period}</p>
                </div>
              </div>

              <div className="p-12 space-y-12">
                <div className="flex flex-wrap justify-between items-center gap-8 no-export">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 px-8 py-4 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold border border-slate-200 dark:border-slate-700"
                    >
                      <Download size={20} />
                      {t('saveReport')}
                    </button>
                    
                    <div className="relative">
                      <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        disabled={isExporting}
                        className="flex items-center gap-3 bg-primary text-white px-10 py-4 rounded-2xl hover:bg-primary-dark transition-all font-semibold shadow-xl shadow-primary/20 disabled:opacity-50"
                      >
                        {isExporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                        {t('export')}
                      </button>
                      
                      <AnimatePresence>
                        {showExportMenu && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-full mt-4 w-64 glassy rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden`}
                          >
                            <button onClick={() => { downloadPPTX(); setShowExportMenu(false); }} className="w-full flex items-center gap-4 px-8 py-5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold transition-all group">
                              <Presentation size={20} className="text-orange-500 group-hover:scale-110 transition-transform" /> PowerPoint
                            </button>
                            <button onClick={() => { downloadDOCX(); setShowExportMenu(false); }} className="w-full flex items-center gap-4 px-8 py-5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold transition-all border-t border-slate-100 dark:border-slate-800 group">
                              <FileText size={20} className="text-blue-500 group-hover:scale-110 transition-transform" /> Word
                            </button>
                            <button onClick={() => { downloadPDF(); setShowExportMenu(false); }} className="w-full flex items-center gap-4 px-8 py-5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold transition-all border-t border-slate-100 dark:border-slate-800 group">
                              <FileCode size={20} className="text-red-500 group-hover:scale-110 transition-transform" /> PDF
                            </button>
                            <button onClick={() => { downloadHTML(); setShowExportMenu(false); }} className="w-full flex items-center gap-4 px-8 py-5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold transition-all border-t border-slate-100 dark:border-slate-800 group">
                              <FileJson size={20} className="text-green-500 group-hover:scale-110 transition-transform" /> HTML
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="flex -space-x-3">
                    {tasks.slice(0, 5).map((t, i) => (
                      <div key={i} className="w-12 h-12 rounded-full border-4 border-white dark:border-slate-900 bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                        {t.title[0]}
                      </div>
                    ))}
                    {tasks.length > 5 && (
                      <div className="w-12 h-12 rounded-full border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                        +{tasks.length - 5}
                      </div>
                    )}
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  <MetricCard title={t('totalTasks')} value={generatedReport.metrics.totalTasks} icon={<FileText size={28} />} color="slate" />
                  <MetricCard title={t('completedTasks')} value={generatedReport.metrics.completedTasks} icon={<CheckCircle2 size={28} />} color="primary" />
                  <MetricCard title={t('completionRate')} value={`${generatedReport.metrics.completionRate}%`} icon={<TrendingUp size={28} />} color="blue" />
                  <MetricCard title={t('overdueTasks')} value={generatedReport.metrics.overdueTasks} icon={<AlertCircle size={28} />} color="red" />
                </div>

                {/* Summary Section */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 relative group">
                  <div className="absolute top-8 right-8 text-primary/5 group-hover:scale-110 transition-transform no-export">
                    <BarChart3 size={64} />
                  </div>
                  <h4 className="text-3xl font-bold text-primary mb-8 flex items-center gap-4">
                    <Sparkles size={32} />
                    {t('executiveSummary')}
                  </h4>
                  <div className={`prose prose-2xl dark:prose-invert max-w-none ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
                    <p className="font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic">{generatedReport.summary}</p>
                  </div>
                </div>

                {/* Sections Grid */}
                <div className="grid grid-cols-1 gap-16">
                  {generatedReport.sections.map((section, idx) => (
                    <div 
                      key={idx} 
                      className="glassy p-12 md:p-20 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl hover:shadow-2xl transition-all group relative"
                    >
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white w-16 h-16 rounded-3xl flex items-center justify-center text-2xl font-bold shadow-2xl shadow-primary/20 no-export">
                        {idx + 1}
                      </div>
                      
                      <div className="flex flex-col lg:flex-row gap-16">
                        <div className="flex-1 space-y-8">
                          <h4 className="text-4xl font-bold text-slate-900 dark:text-white">
                            {section.title}
                          </h4>
                          <div className={`prose prose-xl dark:prose-invert max-w-none ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
                            <ReactMarkdown>{section.content}</ReactMarkdown>
                          </div>
                        </div>
                        
                        {section.chartData && (
                          <div className="lg:w-[400px] h-[450px] bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-10 border border-slate-200 dark:border-slate-800 shadow-inner flex flex-col">
                            <div className="flex items-center justify-between mb-8">
                              <h5 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2">
                                <PieChartIcon size={16} />
                                {t('dataAnalysis')}
                              </h5>
                              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center shadow-sm">
                                <ChevronRight size={16} className="text-primary" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <ResponsiveContainer width="100%" height="100%">
                                {idx % 2 === 0 ? (
                                  <BarChart data={section.chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                    <XAxis dataKey="name" hide />
                                    <YAxis hide />
                                    <Tooltip 
                                      contentStyle={{ backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', padding: '20px' }}
                                    />
                                    <Bar dataKey="value" radius={[15, 15, 15, 15]}>
                                      {section.chartData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                ) : (
                                  <PieChart>
                                    <Pie
                                      data={section.chartData}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={80}
                                      outerRadius={110}
                                      paddingAngle={8}
                                      dataKey="value"
                                      stroke="none"
                                    >
                                      {section.chartData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                    </Pie>
                                    <Tooltip 
                                      contentStyle={{ backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', padding: '20px' }}
                                    />
                                  </PieChart>
                                )}
                              </ResponsiveContainer>
                            </div>
                            <div className="mt-8 grid grid-cols-2 gap-4">
                              {section.chartData.slice(0, 4).map((d, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase truncate">{d.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-10">
              <button 
                onClick={() => { setGeneratedReport(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:text-primary font-semibold uppercase transition-all group"
              >
                <ArrowLeft size={20} className="group-hover:-translate-x-2 transition-transform" />
                {t('generateAnother')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function MetricCard({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) {
  const colorClasses = {
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 shadow-slate-200/50 dark:shadow-slate-900/50',
    primary: 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light border-primary/20 dark:border-primary/30 shadow-primary/10',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800 shadow-blue-100/50 dark:shadow-blue-900/50',
    red: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800 shadow-rose-100/50 dark:shadow-rose-900/50',
  }[color as 'slate' | 'primary' | 'blue' | 'red'];

  return (
    <div className={`p-10 rounded-2xl border ${colorClasses} shadow-xl hover:shadow-2xl transition-all group`}>
      <div className="flex items-center justify-between mb-6">
        <div className="p-4 bg-white/50 dark:bg-black/20 rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
          {icon}
        </div>
      </div>
      <div className="text-4xl font-bold mb-2 text-slate-900 dark:text-white">{value}</div>
      <div className="text-xs font-semibold opacity-60 uppercase text-slate-500 dark:text-slate-400">{title}</div>
    </div>
  );
}
