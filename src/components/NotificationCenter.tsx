import React, { useState } from 'react';
import { Notification } from '../types';
import { useTranslation } from 'react-i18next';
import { Bell, Check, Trash2, Clock, AlertCircle, Info, X } from 'lucide-react';
import { api } from '../api';

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAllAsRead?: () => void;
}

export function NotificationCenter({ notifications, onMarkAllAsRead }: NotificationCenterProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
    } catch (error) {
      console.error('Mark read error:', error);
    }
  };

  const handleMarkAllAsReadLocal = async () => {
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
      return;
    }
    try {
      await api.markAllNotificationsRead();
    } catch (error) {
      console.error('Mark all read error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteNotification(id);
    } catch (error) {
      console.error('Delete notification error:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-3 rounded-xl glass-2 text-gold-light hover:bg-gold hover:text-navy transition-all border border-white/10 group ${isOpen ? 'ring-2 ring-gold bg-gold text-navy' : ''}`}
      >
        <Bell size={24} className="group-hover:rotate-12 transition-transform" />
        {unreadCount > 0 && (
          <span className={`absolute -top-1.5 ${isRTL ? '-left-1.5' : '-right-1.5'} w-5 h-5 bg-rose-500 text-white text-[10px] font-medium flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 shadow-sm animate-pulse z-20`}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/5 backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
          />
          <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-full mt-2 w-[380px] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300`}>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gold/10 p-2 rounded-lg border border-gold/20">
                  <Bell className="text-gold" size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('notifications')}</h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('innovationHub')}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="bg-slate-100 dark:bg-slate-800 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Bell className="text-slate-300 dark:text-slate-600" size={20} />
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('noNotifications')}</p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 group relative ${!notification.read ? 'bg-gold/5 dark:bg-gold/5' : ''}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-2.5 rounded-xl shrink-0 ${
                          notification.title.includes('Overdue') || notification.title.includes('متأخر') ? 'bg-rose-500/20 text-rose-400' :
                          notification.title.includes('Upcoming') || notification.title.includes('قادم') ? 'bg-amber-500/20 text-amber-400' :
                          'bg-gold/10 text-gold'
                        }`}>
                          {notification.title.includes('Overdue') || notification.title.includes('متأخر') ? <AlertCircle size={22} /> :
                           notification.title.includes('Upcoming') || notification.title.includes('قادم') ? <Clock size={22} /> :
                           <Info size={22} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{notification.title}</h4>
                            <span className="text-xs font-medium text-slate-400 whitespace-nowrap tabular-nums">
                              {new Date(notification.createdAt).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 leading-relaxed line-clamp-2 font-medium">
                            {notification.message}
                          </p>

                          <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                            {!notification.read && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id!)}
                                className="flex items-center gap-1 text-xs font-medium text-gold hover:bg-gold/10 px-2 py-1 rounded-lg transition-all"
                              >
                                <Check size={12} />
                                {t('markAsRead')}
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(notification.id!)}
                              className="flex items-center gap-1 text-xs font-medium text-rose-400 hover:bg-rose-500/10 px-2 py-1 rounded-lg transition-all"
                            >
                              <Trash2 size={12} />
                              {t('deleteEvent')}
                            </button>
                          </div>
                        </div>
                      </div>
                      {!notification.read && (
                        <div className={`absolute top-8 ${isRTL ? 'left-4' : 'right-4'} w-2 h-2 bg-gold rounded-full shadow-[0_0_8px_rgba(212,175,55,0.6)]`} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={handleMarkAllAsReadLocal}
                  className="text-xs font-medium text-gold hover:text-gold/80 transition-colors"
                >
                  {t('markAllAsRead')}
                </button>
                <button onClick={() => {}} className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  {t('all')}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
