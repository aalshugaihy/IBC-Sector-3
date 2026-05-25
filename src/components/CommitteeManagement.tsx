import React, { useState, useRef } from 'react';
import { Committee, CommitteeMember, CommitteeStatus, CommitteeScope, CommitteeConfidentiality, Task, Department } from '../types';
import { useTranslation } from 'react-i18next';
import { Briefcase, Plus, Search, Edit2, Trash2, Upload, Users as UsersIcon, FileSpreadsheet } from 'lucide-react';
import { motion } from 'motion/react';
import * as XLSX from 'xlsx';
import { CommitteeModal } from './CommitteeModal';

interface CommitteeManagementProps {
  committees: Committee[];
  tasks: Task[];
  departments?: Department[];
  onAddCommittee: (data: Omit<Committee, 'id'>) => Promise<void>;
  onUpdateCommittee: (id: string, data: Partial<Committee>) => Promise<void>;
  onDeleteCommittee: (id: string) => Promise<void>;
  onAddCommitteeMember: (committeeId: string, member: Omit<CommitteeMember, 'id' | 'committeeId'>) => Promise<void>;
  onRemoveCommitteeMember: (committeeId: string, memberId: string) => Promise<void>;
  onImportCommittees: (committees: Array<Omit<Committee, 'id'>>) => Promise<{ created: number; updated: number }>;
}

const STATUS_BADGE: Record<CommitteeStatus, string> = {
  forming: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  frozen: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700/30 dark:text-slate-300 dark:border-slate-600',
  ended: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
};

const STATUS_TKEY: Record<CommitteeStatus, string> = {
  forming: 'committeeStatusForming',
  active: 'committeeStatusActive',
  frozen: 'committeeStatusFrozen',
  ended: 'committeeStatusEnded',
};
const SCOPE_TKEY: Record<CommitteeScope, string> = {
  internal: 'committeeScopeInternal',
  regional: 'committeeScopeRegional',
  international: 'committeeScopeInternational',
  external: 'committeeScopeExternal',
};

const SCOPE_AR_MAP: Record<string, CommitteeScope> = {
  'خارجية': 'external',
  'إقليمية': 'regional',
  'دولية': 'international',
  'محلية': 'internal',
};

const STATUS_AR_MAP: Record<string, CommitteeStatus> = {
  'تحت التشكيل': 'forming',
  'قائم': 'active',
  'مجمد': 'frozen',
  'منتهي': 'ended',
};

const CONF_AR_MAP: Record<string, CommitteeConfidentiality> = {
  'سري': 'secret',
  'داخلي': 'internal',
  'عام': 'public',
};

function parseExcelDate(v: any): string | null {
  if (!v && v !== 0) return null;
  if (typeof v === 'number') {
    // Excel serial date
    const date = XLSX.SSF.parse_date_code(v);
    if (date) {
      const m = String(date.m).padStart(2, '0');
      const d = String(date.d).padStart(2, '0');
      return `${date.y}-${m}-${d}`;
    }
    return null;
  }
  if (v instanceof Date) {
    return v.toISOString().split('T')[0];
  }
  const str = String(v).trim();
  if (!str) return null;
  // Try YYYY-MM-DD or DD/MM/YYYY
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  }
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
  }
  return str || null;
}

function parseNumber(v: any): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

function getCellText(v: any): string {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

export const CommitteeManagement: React.FC<CommitteeManagementProps> = ({
  committees,
  tasks,
  onAddCommittee,
  onUpdateCommittee,
  onDeleteCommittee,
  onAddCommitteeMember,
  onRemoveCommitteeMember,
  onImportCommittees,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const fileRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | CommitteeStatus>('');
  const [scopeFilter, setScopeFilter] = useState<'' | CommitteeScope>('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add'>('view');
  const [activeCommittee, setActiveCommittee] = useState<Committee | null>(null);

  const filtered = committees.filter(c => {
    if (statusFilter && c.status !== statusFilter) return false;
    if (scopeFilter && c.scope !== scopeFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !(c.department || '').toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const openAdd = () => {
    setActiveCommittee(null);
    setModalMode('add');
    setIsModalOpen(true);
  };

  const openView = (c: Committee) => {
    setActiveCommittee(c);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const openEdit = (c: Committee, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveCommittee(c);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDelete = async (c: Committee, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!c.id) return;
    if (window.confirm(t('confirmDelete'))) {
      await onDeleteCommittee(c.id);
    }
  };

  const handleSave = async (data: Omit<Committee, 'id'> | Committee) => {
    if ('id' in data && data.id) {
      const { id, members, createdAt, updatedAt, ...rest } = data as Committee;
      await onUpdateCommittee(id, rest);
    } else {
      await onAddCommittee(data);
    }
    setIsModalOpen(false);
  };

  const handleImportClick = () => {
    fileRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const parsed = parseWorkbook(wb);

      if (parsed.length === 0) {
        alert(isRTL ? 'لم يتم العثور على بيانات صالحة في الملف.' : 'No valid data found in the file.');
        return;
      }

      const result = await onImportCommittees(parsed);
      alert(t('importedCount', { created: result.created, updated: result.updated }));
    } catch (err) {
      console.error('Excel import error:', err);
      alert(isRTL ? 'فشل استيراد الملف. تحقق من الصيغة.' : 'Failed to import file. Check format.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-700 relative">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-lg border border-primary/20">
            <Briefcase className="text-primary" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('committees')}</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {committees.length} {t('committee')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileRef}
            accept=".xlsx,.xls"
            onChange={handleFileSelected}
            className="hidden"
          />
          <button
            onClick={handleImportClick}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all whitespace-nowrap"
          >
            <Upload size={16} />
            <span>{t('importFromExcel')}</span>
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-all whitespace-nowrap"
          >
            <Plus size={16} />
            <span>{t('addCommittee')}</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400`} size={16} />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full ${isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/30 transition-all`}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as '' | CommitteeStatus)}
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/30 cursor-pointer"
        >
          <option value="">{t('allStatuses')}</option>
          {(['forming', 'active', 'frozen', 'ended'] as CommitteeStatus[]).map(s => (
            <option key={s} value={s}>{t(STATUS_TKEY[s])}</option>
          ))}
        </select>
        <select
          value={scopeFilter}
          onChange={(e) => setScopeFilter(e.target.value as '' | CommitteeScope)}
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/30 cursor-pointer"
        >
          <option value="">{t('allScopes')}</option>
          {(['internal', 'regional', 'international', 'external'] as CommitteeScope[]).map(s => (
            <option key={s} value={s}>{t(SCOPE_TKEY[s])}</option>
          ))}
        </select>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center glass-1 rounded-xl border border-slate-200/50 dark:border-white/5">
          <div className="bg-slate-100 dark:bg-slate-800 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4">
            <FileSpreadsheet className="text-slate-300 dark:text-slate-600" size={24} />
          </div>
          <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
            {t('noTasksFound')}
          </h4>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(c => {
            const status = c.status || 'forming';
            return (
              <motion.div
                layout
                key={c.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -3 }}
                onClick={() => openView(c)}
                className="glass-1 rounded-xl p-4 border border-slate-200/50 dark:border-white/5 cursor-pointer transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                      <Briefcase size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate" title={c.name}>
                        {c.name}
                      </h3>
                      {c.recordNo && (
                        <p className="text-xs font-mono font-medium text-slate-400 truncate">{c.recordNo}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => openEdit(c, e)}
                      title={t('edit')}
                      className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-primary/10 hover:text-primary rounded-lg transition-all"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(c, e)}
                      title={t('delete')}
                      className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/20 rounded-lg transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${STATUS_BADGE[status]}`}>
                    {t(STATUS_TKEY[status])}
                  </span>
                  {c.scope && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
                      {t(SCOPE_TKEY[c.scope])}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {c.department && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-medium">{t('department')}:</span>
                      <span className="text-slate-700 dark:text-slate-300 truncate">{c.department}</span>
                    </div>
                  )}
                  {c.chairperson && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-medium">{t('committeeChairperson')}:</span>
                      <span className="text-slate-700 dark:text-slate-300 truncate">{c.chairperson}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <UsersIcon size={12} />
                    <span>{(c.members?.length || 0)} {t('committeeMembers')}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <CommitteeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        onDelete={async (id) => { await onDeleteCommittee(id); }}
        onAddMember={onAddCommitteeMember}
        onRemoveMember={onRemoveCommitteeMember}
        committee={activeCommittee}
        tasks={tasks}
        initialMode={modalMode}
      />
    </div>
  );
};

// ---- Excel parsing logic ----

function parseWorkbook(wb: XLSX.WorkBook): Array<Omit<Committee, 'id'>> {
  const result: Array<Omit<Committee, 'id'>> = [];
  const byName = new Map<string, Omit<Committee, 'id'>>();

  const sheetNames = wb.SheetNames;
  if (sheetNames.length === 0) return [];

  // 1) Main sheet - first sheet
  const mainSheetName = sheetNames[0];
  const mainSheet = wb.Sheets[mainSheetName];
  if (mainSheet) {
    const rows = XLSX.utils.sheet_to_json<any[]>(mainSheet, { header: 1, defval: null });
    // Skip header
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      const name = getCellText(row[1]);
      if (!name) continue;
      try {
        const scopeStr = getCellText(row[4]);
        const confStr = getCellText(row[6]);
        const statusStr = getCellText(row[7]);

        const committee: Omit<Committee, 'id'> = {
          recordNo: getCellText(row[0]) || null,
          name,
          type: getCellText(row[2]) || null,
          representativeType: getCellText(row[3]) || null,
          scope: SCOPE_AR_MAP[scopeStr] || null,
          department: getCellText(row[5]) || null,
          confidentiality: CONF_AR_MAP[confStr] || 'public',
          status: STATUS_AR_MAP[statusStr] || 'forming',
          isInternal: false,
          organizingEntity: null,
          formationDate: parseExcelDate(row[8]),
          endDate: parseExcelDate(row[9]),
          chairperson: getCellText(row[10]) || null,
          notes: getCellText(row[13]) || null,
          budget: parseNumber(row[14]),
          investment: parseNumber(row[15]),
          members: [],
        };
        byName.set(name, committee);
        result.push(committee);
      } catch (err) {
        console.error('Failed to parse main sheet row', i, err);
      }
    }
  }

  // 2) Department sheets - all other sheets, except dashboard
  for (let s = 1; s < sheetNames.length; s++) {
    const sheetName = sheetNames[s];
    if (sheetName === 'لوحة تحكم' || sheetName.toLowerCase().includes('dashboard')) {
      continue;
    }
    const sheet = wb.Sheets[sheetName];
    if (!sheet) continue;

    try {
      const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: null });
      let lastCommitteeName: string | null = null;

      // Skip first row (header). Iterate body rows.
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        // Heuristic: columns in dept sheets typically include name in column 0 or 1.
        // Try multiple columns to find the committee name.
        const candidates = [
          getCellText(row[0]),
          getCellText(row[1]),
          getCellText(row[2]),
        ].filter(Boolean);

        const memberNameCandidates = [
          getCellText(row[3]),
          getCellText(row[4]),
          getCellText(row[5]),
        ].filter(Boolean);

        const possibleName = candidates[0];

        if (possibleName) {
          // New committee row
          lastCommitteeName = possibleName;
          if (!byName.has(possibleName)) {
            const stub: Omit<Committee, 'id'> = {
              name: possibleName,
              department: sheetName,
              organizingEntity: candidates[1] || null,
              status: 'forming',
              confidentiality: 'public',
              isInternal: false,
              members: [],
            };
            byName.set(possibleName, stub);
            result.push(stub);
          }
          // Try to add member from same row
          const memberName = memberNameCandidates[0];
          if (memberName && memberName !== possibleName) {
            const committee = byName.get(possibleName);
            if (committee) {
              committee.members = committee.members || [];
              committee.members.push({
                memberName,
                role: 'member',
              });
            }
          }
        } else if (lastCommitteeName) {
          // Continuation row - additional representative for previous committee
          const memberName = memberNameCandidates[0];
          if (memberName) {
            const committee = byName.get(lastCommitteeName);
            if (committee) {
              committee.members = committee.members || [];
              committee.members.push({
                memberName,
                role: 'member',
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to parse department sheet', sheetName, err);
    }
  }

  return result;
}
