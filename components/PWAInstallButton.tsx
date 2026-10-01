import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useLanguage } from '../utils/i18n';
import { XMarkIcon } from './Icons';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const { language } = useLanguage();

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
        title={language === 'ar' ? 'تثبيت التطبيق للعمل بدون أنترنيت' : 'Installer l\'application'}
      >
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>{language === 'ar' ? 'تثبيت التطبيق 📲' : 'Installer App 📲'}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/70 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          title={language === 'ar' ? 'تثبيت التطبيق على آيفون / آيباد' : 'Installer sur iOS'}
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>{language === 'ar' ? 'تثبيت iOS 📲' : 'Installer iOS 📲'}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-2xl border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-base font-black text-gray-900 dark:text-white">
                  {language === 'ar' ? 'تثبيت التطبيق على الآيفون / الآيباد' : 'Installer sur iPhone / iPad'}
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-3 space-y-2.5 text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-semibold">
                <p className="flex items-start gap-2">
                  <span className="font-bold text-teal-600 dark:text-teal-400">1.</span>
                  <span>{language === 'ar' ? 'اضغط على زر المشاركة (Share ⎋) في أسفل متصفح Safari.' : 'Appuyez sur le bouton Partager (⎋) dans Safari.'}</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-teal-600 dark:text-teal-400">2.</span>
                  <span>{language === 'ar' ? 'قم بالتمرير للأسفل واختر "الإضافة إلى الشاشة الرئيسية" (Add to Home Screen ➕).' : 'Défilez vers le bas et sélectionnez "Sur l\'écran d\'accueil".'}</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-teal-600 dark:text-teal-400">3.</span>
                  <span>{language === 'ar' ? 'اضغط على "إضافة" لتشغيل التطبيق بدون أنترنيت مباشرة من الشاشة.' : 'Cliquez sur "Ajouter" pour utiliser l\'app hors-ligne.'}</span>
                </p>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-teal-600 hover:bg-teal-700 py-2.5 text-xs font-bold text-white transition cursor-pointer"
              >
                {language === 'ar' ? 'حسناً، فهمت' : 'D\'accord, j\'ai compris'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
