import React from 'react';
import { Task, User } from '../types';
import { X, Clock, User as UserIcon, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TaskHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  users: User[];
}

export const TaskHistoryModal: React.FC<TaskHistoryModalProps> = ({ isOpen, onClose, task, users }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-navy/90 backdrop-blur-2xl animate-in fade-in duration-500">
      <div className={`glass-2 w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl animate-in zoom-in-95 duration-300 flex flex-col border border-gold/20 shadow-xl ${isRTL ? 'text-right' : 'text-left'}`}>
        {/* Header */}
        <div className="relative p-10 border-b border-gold/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-gold/5 opacity-50" />
          <div className="relative flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gold/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-gradient-to-br from-navy-light to-navy p-4 rounded-2xl border border-gold/30 shadow-xl">
                  <Clock className="text-gold animate-pulse" size={32} />
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-semibold text-white leading-none mb-2 flex items-center gap-3">
                  {t('history')}
                  <span className="text-[10px] bg-gold/20 text-gold px-2 py-0.5 rounded-full border border-gold/30 uppercase font-semibold">
                    {task.history?.length || 0} {t('entries')}
                  </span>
                </h2>
                <p className="text-xs text-gold-light/60 font-semibold uppercase flex items-center gap-2">
                  <span className="w-2 h-2 bg-gold rounded-full shadow-[0_0_8px_rgba(212,175,55,0.5)]" />
                  {task.title}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="group relative p-4 bg-white/5 hover:bg-gold/10 rounded-2xl transition-all duration-300 border border-white/10 hover:border-gold/30"
            >
              <X size={24} className="text-gold-light group-hover:text-gold group-hover:rotate-90 transition-all duration-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-navy/20">
          {(!task.history || task.history.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="relative mb-8">
                <div className="absolute -inset-8 bg-gold/5 rounded-full blur-3xl" />
                <div className="relative w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full flex items-center justify-center border border-white/10 shadow-2xl">
                  <Clock className="text-white/10" size={64} />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 uppercase">{t('noHistory')}</h3>
              <p className="text-gold-light/40 text-sm font-bold max-w-xs">{t('noHistoryDescription')}</p>
            </div>
          ) : (
            <div className="relative space-y-12">
              {/* Timeline Line */}
              <div className={`absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-gold/40 via-gold/10 to-transparent ${isRTL ? 'right-6' : 'left-6'} md:left-1/2 md:-translate-x-px`} />

              {task.history.slice().reverse().map((entry, idx) => {
                const user = users.find(u => u.uid === entry.userId);
                return (
                  <div key={idx} className="relative flex items-start md:items-center group">
                    {/* Timeline Dot/Avatar */}
                    <div className={`absolute top-0 ${isRTL ? 'right-0' : 'left-0'} md:left-1/2 md:-translate-x-1/2 flex items-center justify-center w-12 h-12 rounded-2xl border-2 border-navy bg-navy-light text-gold shadow-2xl z-10 overflow-hidden ring-4 ring-gold/10 group-hover:ring-gold/30 transition-all duration-500`}>
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <UserIcon size={24} />
                      )}
                    </div>

                    {/* Content Card */}
                    <div className={`w-full ${isRTL ? 'pr-20' : 'pl-20'} md:pl-0 md:pr-0 md:w-[calc(50%-3rem)] ${idx % 2 === 0 ? 'md:ml-auto' : 'md:mr-auto'} p-6 rounded-xl border border-white/10 bg-navy/40 backdrop-blur-md shadow-lg group-hover:border-gold/30 group-hover:bg-navy/60 transition-all duration-300 relative overflow-hidden`}>
                      {/* Card Background Pattern */}
                      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('/textures/arabesque.png')]" />
                      
                      <div className="relative">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-gold rounded-full" />
                            <div className="font-semibold text-white text-lg">{user?.displayName || entry.userName}</div>
                          </div>
                          <time className="font-mono text-[10px] text-gold font-semibold bg-gold/10 px-3 py-1.5 rounded-full border border-gold/20 shadow-inner">
                            {new Date(entry.timestamp).toLocaleString(i18n.language)}
                          </time>
                        </div>

                        <div className="space-y-4">
                          {entry.changes.map((change, cIdx) => {
                            const formatValue = (field: string, value: any) => {
                              if (!value && value !== 0) return '-';
                              if (field === 'assignedTo') {
                                const u = users.find(user => user.uid === value);
                                return u ? (u.displayName || u.email) : value;
                              }
                              if (field === 'teamMembers' && Array.isArray(value)) {
                                return value.map(m => {
                                  if (typeof m === 'string') {
                                    const u = users.find(user => user.uid === m);
                                    return u ? (u.displayName || u.email) : m;
                                  }
                                  const u = users.find(user => user.uid === m.userId);
                                  return `${u ? (u.displayName || u.email) : m.userId} (${m.role})`;
                                }).join(', ');
                              }
                              if (typeof value === 'boolean') return value ? t('yes') : t('no');
                              return String(value);
                            };

                            return (
                              <div key={cIdx} className="bg-navy/40 p-4 rounded-xl border border-white/5 group/change hover:border-gold/20 transition-colors duration-200">
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="w-1 h-1 bg-gold rounded-full" />
                                  <span className="font-semibold uppercase text-[10px] text-gold-light/70">
                                    {t(change.field)}
                                  </span>
                                </div>
                                <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-3">
                                  <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                                    <span className="text-[8px] uppercase font-semibold text-red-400/70 block mb-1 tracking-wide">{t('oldValue')}</span>
                                    <span className="line-through opacity-50 break-words text-xs text-red-300 font-medium">{formatValue(change.field, change.oldValue)}</span>
                                  </div>
                                  <div className="flex flex-col items-center gap-1">
                                    <ArrowRight size={16} className={`text-gold/40 group-hover/change:text-gold transition-all duration-300 ${isRTL ? 'rotate-180' : ''}`} />
                                  </div>
                                  <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                    <span className="text-[8px] uppercase font-semibold text-emerald-400/70 block mb-1 tracking-wide">{t('newValue')}</span>
                                    <span className="font-semibold text-emerald-300 break-words text-xs">{formatValue(change.field, change.newValue)}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
