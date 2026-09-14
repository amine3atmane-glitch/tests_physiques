import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useLanguage } from '../utils/i18n';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const { language } = useLanguage();

  // Hide button if already installed or running standalone
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-black rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/10 transition flex items-center gap-1.5 shrink-0"
        title={language === 'ar' ? 'تثبيت التطبيق على الهاتف' : 'Installer l\'application'}
      >
        <svg className="w-3.5 h-3.5 animate-bounce" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>{language === 'ar' ? 'تثبيت التطبيق' : 'Installer'}</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-black rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/10 transition flex items-center gap-1.5 shrink-0"
          title={language === 'ar' ? 'تثبيت التطبيق على آيفون' : 'Installer sur iOS'}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-3-3m3 3l3-3M4 17v1a3 3 0 003 3h10a3 3 0 003-3v-1" />
          </svg>
          <span>{language === 'ar' ? 'تثبيت' : 'Installer'}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-2xl animate-in slide-in-from-bottom-5">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <span>📱</span>
                  <span>{language === 'ar' ? 'التثبيت على آيفون / آيباد' : 'Installer sur iPhone / iPad'}</span>
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-gray-650 dark:text-gray-300 leading-relaxed font-semibold">
                {language === 'ar' ? (
                  <ol className="list-decimal list-inside space-y-2.5 text-right">
                    <li>اضغط على زر <strong className="text-indigo-600 dark:text-indigo-400">مشاركة (Share)</strong> في شريط متصفح Safari بالأسفل.</li>
                    <li>قم بالتمرير للأسفل واختر <strong className="text-indigo-600 dark:text-indigo-400">إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.</li>
                    <li>انقر على زر <strong className="text-indigo-600 dark:text-indigo-400">إضافة (Add)</strong> في الزاوية العلوية لتأكيد التثبيت.</li>
                  </ol>
                ) : (
                  <ol className="list-decimal list-inside space-y-2.5 text-left">
                    <li>Appuyez sur le bouton <strong className="text-indigo-600 dark:text-indigo-400">Partager (Share)</strong> dans la barre de Safari.</li>
                    <li>Faites défiler vers le bas et sélectionnez <strong className="text-indigo-600 dark:text-indigo-400">Sur l’écran d’accueil</strong>.</li>
                    <li>Appuyez sur <strong className="text-indigo-600 dark:text-indigo-400">Ajouter</strong> en haut à droite pour installer l’application.</li>
                  </ol>
                )}
              </div>

              <div className="mt-6 flex items-center justify-center p-3 bg-gray-50 dark:bg-gray-850 rounded-2xl border border-gray-100 dark:border-gray-800">
                <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 text-center">
                  {language === 'ar' 
                    ? '⚠️ يتطلب هذا التثبيت استخدام متصفح Safari الافتراضي على أجهزة Apple' 
                    : '⚠️ Cette installation requiert l\'utilisation du navigateur Safari officiel'}
                </span>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-250 font-black text-xs transition"
              >
                {language === 'ar' ? 'حسناً، فهمت' : 'D\'accord, j\'ai compris'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback (e.g. ambient install not yet triggered or not supported, we can show a general guide)
  return null;
};
