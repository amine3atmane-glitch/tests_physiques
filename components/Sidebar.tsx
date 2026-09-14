import React, { useState, useEffect } from 'react';
import { 
    RunningManIcon, 
    ScaleIcon, 
    RulerIcon, 
    ArrowsRightLeftIcon, 
    Cog6ToothIcon, 
    Bars3Icon, 
    XMarkIcon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    GlobeAltIcon,
    AcademicCapIcon
} from './Icons';
import { useLanguage } from '../utils/i18n';
import { getAllClasses, ClassStats } from '../utils/db';
import { usePWAInstall } from '../hooks/usePWAInstall';

export type ActiveScreen = 
  | 'physical-tests' 
  | 'measurements' 
  | 'classes'
  | 'settings';

interface SidebarProps {
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  selectedClass: string;
  setSelectedClass: (className: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean | ((prev: boolean) => boolean)) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeScreen,
  setActiveScreen,
  selectedClass,
  setSelectedClass,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen
}) => {
  const { language, setLanguage, t, isRtl } = useLanguage();
  const [classList, setClassList] = useState<ClassStats[]>([]);
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [guideTab, setGuideTab] = useState<'android' | 'ios'>(isIOS ? 'ios' : 'android');

  const handleInstall = () => {
    if (isInstallable) {
      install();
    } else {
      setGuideTab(isIOS ? 'ios' : 'android');
      setShowInstallGuide(true);
    }
  };

  useEffect(() => {
    const fetchClasses = async () => {
      const classes = await getAllClasses();
      setClassList(classes);
    };
    fetchClasses();
    
    // Listen for storage changes or internal custom events if needed
    window.addEventListener('dbUpdated', fetchClasses);
    return () => window.removeEventListener('dbUpdated', fetchClasses);
  }, [selectedClass]);

  const navItems = [
    {
      id: 'classes' as ActiveScreen,
      label: t.navClasses,
      icon: <AcademicCapIcon className="w-5 h-5" />,
      badge: classList.length > 0 ? String(classList.length) : undefined
    },
    {
      id: 'physical-tests' as ActiveScreen,
      label: t.navPhysicalTests,
      icon: <RunningManIcon className="w-5 h-5" />
    },
    {
      id: 'measurements' as ActiveScreen,
      label: t.navMeasurements,
      icon: <RulerIcon className="w-5 h-5" />,
      badge: 'IMC'
    }
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'fr' : 'ar');
  };

  const handleNavClick = (screen: ActiveScreen) => {
    setActiveScreen(screen);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 z-50 h-screen flex flex-col bg-white dark:bg-gray-900 border-x border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out ${
          isRtl ? 'right-0' : 'left-0'
        } ${
          isMobileOpen ? 'translate-x-0' : (isRtl ? 'translate-x-full md:translate-x-0' : '-translate-x-full md:translate-x-0')
        } ${
          isCollapsed ? 'md:w-20' : 'w-72 md:w-68 lg:w-72'
        }`}
      >
        {/* Brand & Collapse Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center flex-shrink-0 shadow-md font-black text-lg">
              EPS
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <div className="font-extrabold text-sm text-gray-900 dark:text-white truncate">
                  {t.appName}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {t.appSubtitle}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Collapse Button */}
          <button
            onClick={() => setIsCollapsed(prev => !prev)}
            className="hidden md:flex p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            title={isCollapsed ? "توسيع القائمة" : "تصغير القائمة"}
          >
            {isCollapsed ? (
              isRtl ? <ChevronDoubleLeftIcon /> : <ChevronDoubleRightIcon />
            ) : (
              isRtl ? <ChevronDoubleRightIcon /> : <ChevronDoubleLeftIcon />
            )}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <XMarkIcon />
          </button>
        </div>

        {/* Current Class Badge */}
        {!isCollapsed && (
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-800/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {t.class} :
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                {selectedClass || "EPS"}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-grow p-3 space-y-1.5 overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60'
                  } ${isCollapsed ? 'justify-center px-2' : 'justify-between'}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`}>
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </div>

                  {!isCollapsed && item.badge && (
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Bottom Area: Credits */}
        {!isCollapsed && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-3">
            {/* PWA Install Button in Sidebar - ALWAYS VISIBLE */}
            <div className="px-1">
              <button
                type="button"
                onClick={handleInstall}
                className="w-full py-2.5 px-3.5 rounded-2xl bg-[#063e2e] hover:bg-[#084e3a] active:scale-[0.98] border border-emerald-500/80 shadow-md shadow-emerald-950/20 flex items-center justify-between text-white transition-all cursor-pointer group"
                title={language === 'ar' ? 'تثبيت التطبيق على الهاتف' : "Installer l'application sur le téléphone"}
              >
                {/* Mobile Phone Icon */}
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/30 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="6" y="2" width="12" height="20" rx="2.5" />
                    <line x1="11" y1="18" x2="13" y2="18" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Button Text */}
                <span className="font-extrabold text-xs sm:text-[13px] text-white tracking-normal whitespace-nowrap">
                  {language === 'ar' ? 'تثبيت التطبيق على الهاتف' : "Installer sur le téléphone"}
                </span>

                {/* Download Tray Icon */}
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/30 transition-colors">
                  <svg className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-5l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
              </button>
            </div>

            {/* Developer text */}
            <div className="px-2 text-[11px] text-gray-400 dark:text-gray-500 text-center leading-relaxed">
              {t.developer}
            </div>
          </div>
        )}

        {/* Install Instructions Guide Modal */}
        {showInstallGuide && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-2xl animate-in zoom-in-95 text-right">
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center font-bold text-xl shrink-0">
                    📱
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900 dark:text-white">
                      {language === 'ar' ? 'تثبيت التطبيق على الهاتف' : "Installer l'application"}
                    </h3>
                    <p className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
                      {language === 'ar' ? 'يعمل كتطبيق أصلي سريع وبدون إنترنت' : 'Fonctionne hors ligne comme une app native'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInstallGuide(false)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                  title={language === 'ar' ? 'إغلاق' : 'Fermer'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Quick direct open button */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span>{language === 'ar' ? 'فتح في نافذة كاملة للتثبيت التلقائي' : 'Ouvrir en plein écran pour installer'}</span>
                </button>
              </div>

              {/* Tabs: Android vs iOS */}
              <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 mb-4 border border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setGuideTab('android')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    guideTab === 'android'
                      ? 'bg-emerald-600 text-white shadow-sm font-black'
                      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {language === 'ar' ? 'هواتف أندرويد (Chrome)' : 'Android (Chrome)'}
                </button>
                <button
                  type="button"
                  onClick={() => setGuideTab('ios')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    guideTab === 'ios'
                      ? 'bg-emerald-600 text-white shadow-sm font-black'
                      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {language === 'ar' ? 'آيفون وآيباد (Safari)' : 'iPhone / iPad (Safari)'}
                </button>
              </div>

              {/* Instructions list with high-contrast cards */}
              <div className="space-y-2 bg-gray-50 dark:bg-gray-800/80 p-3.5 rounded-2xl border border-gray-200 dark:border-gray-700">
                {guideTab === 'android' ? (
                  language === 'ar' ? (
                    <div className="space-y-2 text-right">
                      <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-750">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <span className="text-xs sm:text-[13px] font-bold text-gray-900 dark:text-gray-100 leading-snug">
                          افتح الرابط في متصفح <strong className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">Google Chrome</strong>.
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-750">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <span className="text-xs sm:text-[13px] font-bold text-gray-900 dark:text-gray-100 leading-snug">
                          اضغط على قائمة الخيارات <strong className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">(⋮ الثلاث نقاط)</strong> بأعلى المتصفح.
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-750">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <span className="text-xs sm:text-[13px] font-bold text-gray-900 dark:text-gray-100 leading-snug">
                          اختر <strong className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">"تثبيت التطبيق"</strong> أو <strong className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">"إضافة للشاشة الرئيسية"</strong>.
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-750">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">4</span>
                        <span className="text-xs sm:text-[13px] font-bold text-gray-900 dark:text-gray-100 leading-snug">
                          سيتم تثبيت التطبيق وتظهر أيقونته فوراً على شاشة هاتفك.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-left">
                      <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-750">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <span className="text-xs sm:text-[13px] font-bold text-gray-900 dark:text-gray-100 leading-snug">
                          Ouvrez le lien dans <strong className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">Google Chrome</strong>.
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-750">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <span className="text-xs sm:text-[13px] font-bold text-gray-900 dark:text-gray-100 leading-snug">
                          Appuyez sur le menu <strong className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">(⋮ trois points)</strong> en haut.
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-750">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <span className="text-xs sm:text-[13px] font-bold text-gray-900 dark:text-gray-100 leading-snug">
                          Sélectionnez <strong className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">"Installer l'application"</strong> ou "Ajouter à l'écran d'accueil".
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-750">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">4</span>
                        <span className="text-xs sm:text-[13px] font-bold text-gray-900 dark:text-gray-100 leading-snug">
                          L'icône de l'application sera ajoutée à votre écran d'accueil.
                        </span>
                      </div>
                    </div>
                  )
                ) : (
                  language === 'ar' ? (
                    <div className="space-y-2 text-right">
                      <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-750">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <span className="text-xs sm:text-[13px] font-bold text-gray-900 dark:text-gray-100 leading-snug">
                          تأكد من فتح الرابط داخل متصفح <strong className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">Safari</strong>.
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-750">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <span className="text-xs sm:text-[13px] font-bold text-gray-900 dark:text-gray-100 leading-snug">
                          اضغط على زر <strong className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">مشاركة (Share)</strong> في شريط متصفح Safari بالأسفل.
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-750">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <span className="text-xs sm:text-[13px] font-bold text-gray-900 dark:text-gray-100 leading-snug">
                          قم بالتمرير للأسفل واختر <strong className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-750">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">4</span>
                        <span className="text-xs sm:text-[13px] font-bold text-gray-900 dark:text-gray-100 leading-snug">
                          اضغط على زر <strong className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">إضافة (Add)</strong> في الزاوية العلوية لتأكيد التثبيت.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-left">
                      <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-750">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <span className="text-xs sm:text-[13px] font-bold text-gray-900 dark:text-gray-100 leading-snug">
                          Assurez-vous d'utiliser le navigateur <strong className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">Safari</strong>.
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-750">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <span className="text-xs sm:text-[13px] font-bold text-gray-900 dark:text-gray-100 leading-snug">
                          Appuyez sur l'icône <strong className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">Partager (Share)</strong> en bas de Safari.
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-750">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <span className="text-xs sm:text-[13px] font-bold text-gray-900 dark:text-gray-100 leading-snug">
                          Faites défiler vers le bas et appuyez sur <strong className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">Sur l'écran d'accueil</strong>.
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-750">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">4</span>
                        <span className="text-xs sm:text-[13px] font-bold text-gray-900 dark:text-gray-100 leading-snug">
                          Touchez <strong className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">Ajouter</strong> en haut à droite.
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={() => setShowInstallGuide(false)}
                className="mt-4 w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-black text-xs transition cursor-pointer border border-gray-200 dark:border-gray-700"
              >
                {language === 'ar' ? 'حسناً، إغلاق' : "Fermer"}
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
