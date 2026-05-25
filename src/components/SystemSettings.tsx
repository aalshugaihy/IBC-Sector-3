import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useTranslation } from 'react-i18next';
import {
  Settings as SettingsIcon, Key, Database, Server, Activity, Download,
  CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, Save, RefreshCw,
} from 'lucide-react';

interface SettingItem {
  key: string;
  value: unknown;
  isSecret: boolean;
  isSet: boolean;
  description: string | null;
  updatedAt: string | null;
}

interface SystemInfo {
  database: { connected: boolean; version: string; serverTime: string };
  counts: { users: number; tasks: number; committees: number };
  integrations: { gemini: { configured: boolean; source: string | null } };
  server: { nodeVersion: string; uptime: number; memoryMB: number; env: string };
}

const KNOWN_SETTINGS: Array<{
  key: string;
  labelAr: string;
  labelEn: string;
  isSecret?: boolean;
  type?: 'text' | 'boolean';
  group: 'branding' | 'integrations' | 'features';
}> = [
  { key: 'app.name_ar',          labelAr: 'اسم القطاع (عربي)', labelEn: 'Sector name (AR)',  group: 'branding' },
  { key: 'app.name_en',          labelAr: 'اسم القطاع (إنجليزي)', labelEn: 'Sector name (EN)', group: 'branding' },
  { key: 'app.organization',     labelAr: 'الجهة الأم', labelEn: 'Parent organization', group: 'branding' },
  { key: 'gemini.api_key',       labelAr: 'مفتاح Gemini AI', labelEn: 'Gemini API key', isSecret: true, group: 'integrations' },
  { key: 'feature.ai_chat',      labelAr: 'تفعيل المحادثة الذكية', labelEn: 'Enable AI chat', type: 'boolean', group: 'features' },
  { key: 'feature.ai_reports',   labelAr: 'تفعيل تقارير الذكاء الاصطناعي', labelEn: 'Enable AI reports', type: 'boolean', group: 'features' },
  { key: 'feature.public_signup',labelAr: 'السماح بالتسجيل الذاتي', labelEn: 'Allow self-signup', type: 'boolean', group: 'features' },
];

export const SystemSettings: React.FC = () => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [settings, setSettings] = useState<Record<string, SettingItem>>({});
  const [drafts, setDrafts] = useState<Record<string, string | boolean>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; msg: string }>>({});
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [s, i] = await Promise.all([api.listSettings(), api.systemInfo()]);
      const map: Record<string, SettingItem> = {};
      for (const item of s.settings as SettingItem[]) map[item.key] = item;
      setSettings(map);
      setInfo(i as SystemInfo);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function getDraft(meta: typeof KNOWN_SETTINGS[number]): string | boolean {
    if (meta.key in drafts) return drafts[meta.key];
    const cur = settings[meta.key];
    if (meta.type === 'boolean') return cur?.value === true || (cur?.value === undefined && false);
    if (meta.isSecret) return '';
    if (cur?.value === undefined || cur?.value === null) return '';
    return typeof cur.value === 'string' ? cur.value : JSON.stringify(cur.value);
  }

  async function save(meta: typeof KNOWN_SETTINGS[number]) {
    setSaving(meta.key);
    try {
      const raw = getDraft(meta);
      const value = meta.type === 'boolean' ? !!raw : raw;
      await api.updateSetting(meta.key, value, !!meta.isSecret);
      setDrafts((d) => { const n = { ...d }; delete n[meta.key]; return n; });
      await load();
    } catch (err) {
      console.error(err);
    }
    setSaving(null);
  }

  async function testKey(key: string) {
    setTesting(key);
    try {
      const r = await api.testSetting(key);
      setTestResult((p) => ({ ...p, [key]: { ok: !!r.ok, msg: r.ok ? (r.sample || 'OK') : (r.error || 'Failed') } }));
    } catch (err) {
      setTestResult((p) => ({ ...p, [key]: { ok: false, msg: err instanceof Error ? err.message : 'Failed' } }));
    }
    setTesting(null);
  }

  async function downloadBackup() {
    try {
      const blob = await api.downloadBackup();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ibc-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-gold" size={32} />
      </div>
    );
  }

  const groups = {
    branding:     { ar: 'هوية التطبيق',   en: 'App branding',  icon: <SettingsIcon size={16} /> },
    integrations: { ar: 'مفاتيح التكامل',  en: 'Integration keys', icon: <Key size={16} /> },
    features:     { ar: 'مفاتيح الميزات',  en: 'Feature flags',  icon: <Activity size={16} /> },
  } as const;

  return (
    <div className="space-y-6">
      {/* System info card */}
      {info && (
        <div className="glass-1 rounded-xl p-5 border border-slate-200/40 dark:border-slate-700/40">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Server size={16} /> {isAr ? 'حالة النظام' : 'System status'}
            </h3>
            <button onClick={load} className="p-1.5 rounded-md hover:bg-slate-200/40 dark:hover:bg-slate-700/40">
              <RefreshCw size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <Stat icon={<Database size={14} />} label={isAr ? 'قاعدة البيانات' : 'Database'} value={`PG ${info.database.version.split(' ')[0]}`} ok={info.database.connected} />
            <Stat icon={<Activity size={14} />} label={isAr ? 'المستخدمون' : 'Users'} value={String(info.counts.users)} />
            <Stat icon={<Activity size={14} />} label={isAr ? 'المهام' : 'Tasks'} value={String(info.counts.tasks)} />
            <Stat icon={<Activity size={14} />} label={isAr ? 'اللجان' : 'Committees'} value={String(info.counts.committees)} />
            <Stat icon={<Key size={14} />} label="Gemini AI" value={info.integrations.gemini.configured ? (info.integrations.gemini.source === 'db' ? (isAr ? 'مُهيّأ (قاعدة البيانات)' : 'Configured (DB)') : (isAr ? 'مُهيّأ (متغير)' : 'Configured (env)')) : (isAr ? 'غير مُهيّأ' : 'Not configured')} ok={info.integrations.gemini.configured} />
            <Stat icon={<Server size={14} />} label="Node" value={info.server.nodeVersion} />
            <Stat icon={<Activity size={14} />} label={isAr ? 'الذاكرة' : 'Memory'} value={`${info.server.memoryMB} MB`} />
            <Stat icon={<Activity size={14} />} label={isAr ? 'وقت التشغيل' : 'Uptime'} value={`${Math.floor(info.server.uptime / 60)}m`} />
          </div>
          <div className="mt-4">
            <button
              onClick={downloadBackup}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium"
            >
              <Download size={14} />
              {isAr ? 'تنزيل نسخة احتياطية (JSON)' : 'Download backup (JSON)'}
            </button>
          </div>
        </div>
      )}

      {/* Settings groups */}
      {(['branding', 'integrations', 'features'] as const).map((groupKey) => (
        <div key={groupKey} className="glass-1 rounded-xl p-5 border border-slate-200/40 dark:border-slate-700/40">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            {groups[groupKey].icon} {isAr ? groups[groupKey].ar : groups[groupKey].en}
          </h3>
          <div className="space-y-3">
            {KNOWN_SETTINGS.filter((s) => s.group === groupKey).map((meta) => {
              const current = settings[meta.key];
              const draft = getDraft(meta);
              const dirty = meta.key in drafts;
              const result = testResult[meta.key];
              return (
                <div key={meta.key} className="grid grid-cols-1 md:grid-cols-[200px_1fr_auto] gap-3 items-center">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {isAr ? meta.labelAr : meta.labelEn}
                    {meta.isSecret && current?.isSet && (
                      <span className="ms-2 inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px]">
                        <CheckCircle2 size={10} /> {isAr ? 'مخزّن' : 'stored'}
                      </span>
                    )}
                  </label>
                  <div className="flex items-center gap-2">
                    {meta.type === 'boolean' ? (
                      <button
                        type="button"
                        onClick={() => setDrafts((d) => ({ ...d, [meta.key]: !draft }))}
                        className={`relative w-11 h-6 rounded-full transition-colors ${draft ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                      >
                        <span className={`absolute top-0.5 ${draft ? 'left-5' : 'left-0.5'} w-5 h-5 rounded-full bg-white transition-all`} />
                      </button>
                    ) : (
                      <div className="relative flex-1">
                        <input
                          type={meta.isSecret && !revealed[meta.key] ? 'password' : 'text'}
                          value={String(draft ?? '')}
                          onChange={(e) => setDrafts((d) => ({ ...d, [meta.key]: e.target.value }))}
                          placeholder={meta.isSecret ? (isAr ? 'الصق المفتاح هنا…' : 'Paste key here…') : ''}
                          className="w-full px-3 py-1.5 pr-8 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40"
                        />
                        {meta.isSecret && (
                          <button
                            type="button"
                            onClick={() => setRevealed((r) => ({ ...r, [meta.key]: !r[meta.key] }))}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {revealed[meta.key] ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {meta.key === 'gemini.api_key' && current?.isSet && (
                      <button
                        onClick={() => testKey(meta.key)}
                        disabled={testing === meta.key}
                        className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
                      >
                        {testing === meta.key ? <Loader2 size={12} className="animate-spin" /> : (isAr ? 'اختبار' : 'Test')}
                      </button>
                    )}
                    <button
                      onClick={() => save(meta)}
                      disabled={!dirty || saving === meta.key}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-gold text-navy hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {saving === meta.key ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      {isAr ? 'حفظ' : 'Save'}
                    </button>
                  </div>
                  {result && (
                    <div className={`md:col-start-2 text-[11px] flex items-center gap-1.5 ${result.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {result.ok ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                      {result.msg}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: string; ok?: boolean }> = ({ icon, label, value, ok }) => (
  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
    <div className={`mt-0.5 ${ok === false ? 'text-rose-500' : ok === true ? 'text-emerald-500' : 'text-slate-400'}`}>{icon}</div>
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{value}</p>
    </div>
  </div>
);
