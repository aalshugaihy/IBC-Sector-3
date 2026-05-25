import React, { useState, useEffect } from 'react';
import { Committee, CommitteeMember, CommitteeMemberRole, CommitteeStatus, CommitteeScope, CommitteeConfidentiality, Task } from '../types';
import { useTranslation } from 'react-i18next';
import { X, Edit2, Plus, Info, Users, ListTree, Trash2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CommitteeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Committee, 'id'> | Committee) => void;
  onDelete?: (id: string) => void;
  onAddMember?: (committeeId: string, member: Omit<CommitteeMember, 'id' | 'committeeId'>) => void;
  onRemoveMember?: (committeeId: string, memberId: string) => void;
  committee?: Committee | null;
  tasks: Task[];
  initialMode?: 'view' | 'edit' | 'add';
}

type TabType = 'general' | 'members' | 'tasks';

const ROLE_OPTIONS: CommitteeMemberRole[] = ['chair', 'vice_chair', 'secretary', 'technical', 'financial', 'member'];
const STATUS_OPTIONS: CommitteeStatus[] = ['forming', 'active', 'frozen', 'ended'];
const SCOPE_OPTIONS: CommitteeScope[] = ['internal', 'regional', 'international', 'external'];
const CONF_OPTIONS: CommitteeConfidentiality[] = ['public', 'internal', 'secret'];

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
const CONF_TKEY: Record<CommitteeConfidentiality, string> = {
  public: 'committeeConfidentialityPublic',
  internal: 'committeeConfidentialityInternal',
  secret: 'committeeConfidentialitySecret',
};
const ROLE_TKEY: Record<CommitteeMemberRole, string> = {
  chair: 'roleChair',
  vice_chair: 'roleViceChair',
  secretary: 'roleSecretary',
  technical: 'roleTechnical',
  financial: 'roleFinancial',
  member: 'roleMember',
};

const emptyForm = (): Omit<Committee, 'id'> => ({
  recordNo: '',
  name: '',
  type: '',
  representativeType: '',
  scope: null,
  department: '',
  confidentiality: 'public',
  status: 'forming',
  isInternal: false,
  organizingEntity: '',
  formationDate: '',
  endDate: '',
  chairperson: '',
  budget: null,
  investment: null,
  notes: '',
  members: [],
});

export const CommitteeModal: React.FC<CommitteeModalProps> = ({
  isOpen, onClose, onSave, onDelete, onAddMember, onRemoveMember,
  committee, tasks, initialMode = 'edit'
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [mode, setMode] = useState<'view' | 'edit' | 'add'>(initialMode);
  const [formData, setFormData] = useState<Omit<Committee, 'id'>>(emptyForm());

  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<CommitteeMemberRole>('member');
  const [newMemberNotes, setNewMemberNotes] = useState('');

  useEffect(() => {
    if (committee) {
      setFormData({
        recordNo: committee.recordNo || '',
        name: committee.name || '',
        type: committee.type || '',
        representativeType: committee.representativeType || '',
        scope: committee.scope || null,
        department: committee.department || '',
        confidentiality: committee.confidentiality || 'public',
        status: committee.status || 'forming',
        isInternal: !!committee.isInternal,
        organizingEntity: committee.organizingEntity || '',
        formationDate: committee.formationDate || '',
        endDate: committee.endDate || '',
        chairperson: committee.chairperson || '',
        budget: committee.budget ?? null,
        investment: committee.investment ?? null,
        notes: committee.notes || '',
        members: committee.members || [],
      });
      setMode(initialMode === 'add' ? 'edit' : initialMode);
    } else {
      setFormData(emptyForm());
      setMode('add');
    }
    setActiveTab('general');
    setNewMemberName('');
    setNewMemberRole('member');
    setNewMemberNotes('');
  }, [committee, isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (committee?.id) {
      onSave({ ...formData, id: committee.id } as Committee);
    } else {
      onSave(formData);
    }
  };

  const handleAddMember = () => {
    if (!committee?.id || !newMemberName.trim() || !onAddMember) return;
    onAddMember(committee.id, {
      memberName: newMemberName.trim(),
      role: newMemberRole,
      notes: newMemberNotes.trim() || null,
    });
    setNewMemberName('');
    setNewMemberRole('member');
    setNewMemberNotes('');
  };

  const handleRemoveMember = (memberId: string) => {
    if (!committee?.id || !onRemoveMember) return;
    onRemoveMember(committee.id, memberId);
  };

  const handleDelete = () => {
    if (!committee?.id || !onDelete) return;
    if (window.confirm(t('confirmDelete'))) {
      onDelete(committee.id);
      onClose();
    }
  };

  const linkedTasks = committee?.id
    ? tasks.filter(task => task.committeeId === committee.id)
    : [];

  const tabs: { id: TabType; label: string; icon: any; show: boolean }[] = [
    { id: 'general', label: t('general'), icon: Info, show: true },
    { id: 'members', label: t('committeeMembers'), icon: Users, show: !!committee?.id },
    { id: 'tasks', label: t('relatedTasks'), icon: ListTree, show: !!committee?.id },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300 flex flex-col relative ${isRTL ? 'text-right' : 'text-left'}`}>
        {/* Header */}
        <div className="sticky top-0 bg-slate-50 dark:bg-slate-800/50 px-6 py-4 rounded-t-2xl border-b border-slate-200 dark:border-slate-700 flex justify-between items-center z-10">
          <div className="flex items-center gap-4 relative">
            <div className={`p-3 rounded-xl shadow-sm ${committee ? 'bg-primary/10 text-primary' : 'bg-emerald-500/10 text-emerald-600'}`}>
              {committee ? <Edit2 size={22} strokeWidth={2} /> : <Plus size={22} strokeWidth={2} />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-none mb-1">
                {mode === 'view' ? t('preview') : mode === 'edit' ? t('editCommittee') : t('addCommittee')}
              </h2>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em]">
                {formData.recordNo || 'NEW-CMT'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {mode === 'view' && (
              <button
                onClick={() => setMode('edit')}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-semibold text-xs hover:bg-primary-dark transition-all"
              >
                <Edit2 size={16} />
                {t('editCommittee')}
              </button>
            )}
            {mode === 'view' && committee?.id && onDelete && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl font-semibold text-xs hover:bg-rose-600 transition-all"
              >
                <Trash2 size={16} />
                {t('delete')}
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex items-center gap-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 overflow-x-auto custom-scrollbar">
          {tabs.filter(tab => tab.show).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white dark:bg-slate-900/95">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'general' && (
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('committeeName')} *</label>
                    {mode === 'view' ? (
                      <div className="w-full bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-semibold text-sm">
                        {formData.name || '-'}
                      </div>
                    ) : (
                      <input
                        type="text"
                        required
                        className="w-full rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    )}
                  </div>

                  <FieldText
                    mode={mode}
                    label={t('committeeRecordNo')}
                    value={formData.recordNo || ''}
                    onChange={(v) => setFormData({ ...formData, recordNo: v })}
                  />

                  <FieldText
                    mode={mode}
                    label={t('committeeType')}
                    value={formData.type || ''}
                    onChange={(v) => setFormData({ ...formData, type: v })}
                  />

                  <FieldText
                    mode={mode}
                    label={t('committeeRepresentativeType')}
                    value={formData.representativeType || ''}
                    onChange={(v) => setFormData({ ...formData, representativeType: v })}
                  />

                  <FieldText
                    mode={mode}
                    label={t('department')}
                    value={formData.department || ''}
                    onChange={(v) => setFormData({ ...formData, department: v })}
                  />

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('committeeScope')}</label>
                    {mode === 'view' ? (
                      <div className="w-full bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm">
                        {formData.scope ? t(SCOPE_TKEY[formData.scope]) : '-'}
                      </div>
                    ) : (
                      <select
                        className="w-full rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors cursor-pointer"
                        value={formData.scope || ''}
                        onChange={(e) => setFormData({ ...formData, scope: (e.target.value || null) as CommitteeScope | null })}
                      >
                        <option value="">-</option>
                        {SCOPE_OPTIONS.map(s => (
                          <option key={s} value={s}>{t(SCOPE_TKEY[s])}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('committeeConfidentiality')}</label>
                    {mode === 'view' ? (
                      <div className="w-full bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm">
                        {formData.confidentiality ? t(CONF_TKEY[formData.confidentiality]) : '-'}
                      </div>
                    ) : (
                      <select
                        className="w-full rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors cursor-pointer"
                        value={formData.confidentiality || 'public'}
                        onChange={(e) => setFormData({ ...formData, confidentiality: e.target.value as CommitteeConfidentiality })}
                      >
                        {CONF_OPTIONS.map(c => (
                          <option key={c} value={c}>{t(CONF_TKEY[c])}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('committeeStatus')}</label>
                    {mode === 'view' ? (
                      <div className="w-full bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm">
                        {formData.status ? t(STATUS_TKEY[formData.status]) : '-'}
                      </div>
                    ) : (
                      <select
                        className="w-full rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors cursor-pointer"
                        value={formData.status || 'forming'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as CommitteeStatus })}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{t(STATUS_TKEY[s])}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <FieldText
                    mode={mode}
                    label={t('committeeOrganizingEntity')}
                    value={formData.organizingEntity || ''}
                    onChange={(v) => setFormData({ ...formData, organizingEntity: v })}
                  />

                  <FieldText
                    mode={mode}
                    label={t('committeeChairperson')}
                    value={formData.chairperson || ''}
                    onChange={(v) => setFormData({ ...formData, chairperson: v })}
                  />

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('committeeIsInternal')}</label>
                    {mode === 'view' ? (
                      <div className="w-full bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm">
                        {formData.isInternal ? t('yes') : t('no')}
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!formData.isInternal}
                          onChange={(e) => setFormData({ ...formData, isInternal: e.target.checked })}
                          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{t('committeeIsInternal')}</span>
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('committeeFormationDate')}</label>
                    {mode === 'view' ? (
                      <div className="w-full bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm">
                        {formData.formationDate || '-'}
                      </div>
                    ) : (
                      <input
                        type="date"
                        className="w-full rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                        value={formData.formationDate || ''}
                        onChange={(e) => setFormData({ ...formData, formationDate: e.target.value || null })}
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('committeeEndDate')}</label>
                    {mode === 'view' ? (
                      <div className="w-full bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm">
                        {formData.endDate || '-'}
                      </div>
                    ) : (
                      <input
                        type="date"
                        className="w-full rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                        value={formData.endDate || ''}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value || null })}
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('committeeBudget')}</label>
                    {mode === 'view' ? (
                      <div className="w-full bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm">
                        {formData.budget ?? '-'}
                      </div>
                    ) : (
                      <input
                        type="number"
                        className="w-full rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                        value={formData.budget ?? ''}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.value === '' ? null : parseFloat(e.target.value) })}
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('committeeInvestment')}</label>
                    {mode === 'view' ? (
                      <div className="w-full bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm">
                        {formData.investment ?? '-'}
                      </div>
                    ) : (
                      <input
                        type="number"
                        className="w-full rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                        value={formData.investment ?? ''}
                        onChange={(e) => setFormData({ ...formData, investment: e.target.value === '' ? null : parseFloat(e.target.value) })}
                      />
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('notes')}</label>
                    {mode === 'view' ? (
                      <div className="w-full bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm min-h-[80px] whitespace-pre-wrap">
                        {formData.notes || '-'}
                      </div>
                    ) : (
                      <textarea
                        rows={4}
                        className="w-full rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors resize-none"
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    )}
                  </div>
                </form>
              )}

              {activeTab === 'members' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {(formData.members || []).length === 0 && (
                      <div className="p-8 text-center text-slate-400 text-sm bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                        {t('noTasksFound')}
                      </div>
                    )}
                    {(formData.members || []).map((m) => (
                      <div key={m.id} className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {m.memberName || '-'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {t(ROLE_TKEY[m.role])}
                            {m.notes ? ` • ${m.notes}` : ''}
                          </p>
                        </div>
                        {onRemoveMember && m.id && (
                          <button
                            onClick={() => handleRemoveMember(m.id!)}
                            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                            title={t('removeMember')}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {committee?.id && onAddMember && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">{t('addMember')}</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          placeholder={t('committeeMemberName')}
                          className="w-full rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                          value={newMemberName}
                          onChange={(e) => setNewMemberName(e.target.value)}
                        />
                        <select
                          className="w-full rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none cursor-pointer"
                          value={newMemberRole}
                          onChange={(e) => setNewMemberRole(e.target.value as CommitteeMemberRole)}
                        >
                          {ROLE_OPTIONS.map(r => (
                            <option key={r} value={r}>{t(ROLE_TKEY[r])}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder={t('notes')}
                          className="w-full rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                          value={newMemberNotes}
                          onChange={(e) => setNewMemberNotes(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end mt-3">
                        <button
                          type="button"
                          onClick={handleAddMember}
                          disabled={!newMemberName.trim()}
                          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition-all disabled:opacity-50"
                        >
                          <Plus size={14} />
                          {t('addMember')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="space-y-3">
                  {linkedTasks.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      {t('noTasksFound')}
                    </div>
                  ) : (
                    linkedTasks.map(task => (
                      <div key={task.id} className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate flex-1 min-w-0">
                            {task.title}
                          </p>
                          <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                            {t(task.status)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{task.department}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        {mode !== 'view' && activeTab === 'general' && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors flex items-center gap-2"
            >
              <Check size={16} />
              {t('save')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface FieldTextProps {
  mode: 'view' | 'edit' | 'add';
  label: string;
  value: string;
  onChange: (v: string) => void;
}

const FieldText: React.FC<FieldTextProps> = ({ mode, label, value, onChange }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
      {mode === 'view' ? (
        <div className="w-full bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm">
          {value || '-'}
        </div>
      ) : (
        <input
          type="text"
          className="w-full rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
};
