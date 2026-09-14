import React, { useState, useEffect } from 'react';
import { Bars3Icon, GlobeAltIcon, ChevronDownIcon, InformationCircleIcon } from './Icons';
import { useLanguage } from '../utils/i18n';
import type { ActiveScreen } from './Sidebar';
import { getAllClasses, ClassStats } from '../utils/db';
import { AboutModal } from './AboutModal';
import { PWAInstallButton } from './PWAInstallButton';

interface TopHeaderProps {
  activeScreen: ActiveScreen;
  setActiveScreen: (val: ActiveScreen) => void;
  selectedClass: string;
  setSelectedClass: (val: string) => void;
  onOpenMobileMenu: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeScreen,
  setActiveScreen,
  selectedClass,
  setSelectedClass,
  onOpenMobileMenu
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [classList, setClassList] = useState<ClassStats[]>([]);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      const classes = await getAllClasses();
      setClassList(classes);
    };
    fetchClasses();
    window.addEventListener('dbUpdated', fetchClasses);
    return () => window.removeEventListener('dbUpdated', fetchClasses);
  }, [selectedClass]);

  const getScreenTitle = () => {
    switch (activeScreen) {
      case 'physical-tests':
        return t.navPhysicalTests;
      case 'measurements':
        return t.navMeasurements;
      case 'classes':
        return t.classesTitle;
      case 'settings':
        return t.navSettings;
      default:
        return t.navPhysicalTests;
    }
  };

  return (
    <>
      <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Hamburger Menu Toggle */}
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition flex-shrink-0"
            aria-label="القائمة الجانبية"
          >
            <Bars3Icon />
          </button>

          <h2 className="text-sm sm:text-lg font-black text-gray-900 dark:text-white truncate">
            {getScreenTitle()}
          </h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Class Display & Select */}
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 sm:px-2.5 py-1.5 rounded-xl">
            <span className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 hidden xs:inline">
              {t.class}:
            </span>
            
            {classList.length > 0 ? (
              <div className="relative flex items-center">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="appearance-none bg-transparent text-[11px] sm:text-xs font-bold text-gray-800 dark:text-gray-100 pe-6 ps-1 py-0.5 focus:outline-none cursor-pointer"
                >
                  {classList.map(c => (
                    <option key={c.className} value={c.className} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                      {c.className} ({c.studentCount})
                    </option>
                  ))}
                  {!classList.some(c => c.className === selectedClass) && (
                    <option value={selectedClass} className="bg-white dark:bg-gray-800">{selectedClass}</option>
                  )}
                </select>
                <div className="absolute end-1 pointer-events-none text-gray-400">
                  <ChevronDownIcon className="w-3.5 h-3.5" />
                </div>
              </div>
            ) : (
              <input
                type="text"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-20 sm:w-28 text-[11px] sm:text-xs font-bold text-gray-800 dark:text-gray-100 bg-transparent focus:outline-none"
                placeholder={t.classNamePlaceholder}
              />
            )}
          </div>
          
          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* About App (حول التطبيق) Button */}
          <button
            type="button"
            onClick={() => setIsAboutOpen(true)}
            className="px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition flex items-center gap-1.5 shadow-xs"
            title={language === 'ar' ? 'حول التطبيق' : 'À propos'}
          >
            <InformationCircleIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden xs:inline">{language === 'ar' ? 'حول التطبيق' : 'À propos'}</span>
          </button>

          {/* Header Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'ar' ? 'fr' : 'ar')}
            className="px-2 sm:px-2.5 py-1.5 text-[10px] sm:text-xs font-bold rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition flex items-center gap-1 sm:gap-1.5"
            title="Changer la langue / تغيير اللغة"
          >
            <GlobeAltIcon className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'FR' : 'عربي'}</span>
          </button>
        </div>
      </header>

      {/* About Application Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </>
  );
};
