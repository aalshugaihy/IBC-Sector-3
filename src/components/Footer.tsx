import React from 'react';
import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-12 py-6 border-t border-slate-200 dark:border-slate-800 no-export">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-[1600px] mx-auto px-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-semibold text-xs">IH</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{t('innovationHub')}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">© {currentYear}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
          <span>KSA Vision 2030</span>
          <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
          <span>{t('allRightsReserved')}</span>
        </div>
      </div>
    </footer>
  );
}
