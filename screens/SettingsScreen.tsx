import React from 'react';
import { 
    InformationCircleIcon, 
    Cog6ToothIcon, 
    GlobeAltIcon, 
    UsersIcon, 
    CheckIcon 
} from '../components/Icons';
import { useLanguage, Language } from '../utils/i18n';

interface SettingsScreenProps {
  selectedClass: string;
  setSelectedClass: (val: string) => void;
  groupSize: number;
  setGroupSize: (val: number) => void;
  sessionDate: string;
  setSessionDate: (val: string) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  selectedClass,
  setSelectedClass,
  groupSize,
  setGroupSize,
  sessionDate,
  setSessionDate
}) => {
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 pb-4 flex items-center gap-3">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
          <Cog6ToothIcon />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t.settingsTitle}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">{t.settingsSubtitle}</p>
        </div>
      </header>

      {/* Language Section */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4 border border-gray-100 dark:border-gray-700/60">
        <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
          <GlobeAltIcon />
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">{t.languageSelect}</h2>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          اختر لغة واجهة التطبيق والتقارير. سيتم تغيير اتجاه الصفحة (RTL / LTR) تلقائياً.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Arabic Option */}
          <button
            type="button"
            onClick={() => handleLanguageChange('ar')}
            className={`p-4 rounded-xl border-2 text-right transition-all flex items-center justify-between ${
              language === 'ar'
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 dark:border-indigo-500 shadow-sm'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div>
              <div className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                <span>العربية</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                  RTL
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                الواجهة باللغة العربية مع محاذاة من اليمين إلى اليسار
              </p>
            </div>
            {language === 'ar' && (
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                <CheckIcon />
              </div>
            )}
          </button>

          {/* French Option */}
          <button
            type="button"
            onClick={() => handleLanguageChange('fr')}
            className={`p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
              language === 'fr'
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 dark:border-indigo-500 shadow-sm'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div>
              <div className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                <span>Français</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                  LTR
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Interface en Français avec alignement de gauche à droite
              </p>
            </div>
            {language === 'fr' && (
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                <CheckIcon />
              </div>
            )}
          </button>
        </div>
      </section>

      {/* General Settings */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6 border border-gray-100 dark:border-gray-700/60">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700 pb-2">
          {t.class} & {t.date}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Class Name */}
          <div>
            <label htmlFor="settings-class-name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {t.class}
            </label>
            <input
              type="text"
              id="settings-class-name"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3"
              placeholder={t.classNamePlaceholder}
            />
            <p className="mt-1 text-xs text-gray-500">يتم اعتماده كقسم افتراضي في جميع الاختبارات والتقارير.</p>
          </div>

          {/* Session Date */}
          <div>
            <label htmlFor="settings-date" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {t.sessionDateTime}
            </label>
            <input
              type="datetime-local"
              id="settings-date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3"
            />
            <p className="mt-1 text-xs text-gray-500">{t.sessionDateTimeDesc}</p>
          </div>
        </div>
      </section>

      {/* Affinity Groups Settings */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6 border border-gray-100 dark:border-gray-700/60">
        <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-2">
          <UsersIcon />
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
            {t.groupSizeLabel}
          </h2>
        </div>
        
        <div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              id="settings-group-size-range"
              min="2"
              max="15"
              step="1"
              value={groupSize}
              onChange={(e) => setGroupSize(parseInt(e.target.value, 10))}
              className="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-indigo-600"
            />
            <input
              type="number"
              id="settings-group-size"
              min="2"
              max="15"
              value={groupSize}
              onChange={(e) => setGroupSize(parseInt(e.target.value, 10))}
              className="w-20 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 text-center font-bold"
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">{t.groupSizeDesc}</p>
        </div>
      </section>

      {/* About App & Credits */}
      <section className="bg-indigo-50/70 dark:bg-gray-800/80 rounded-2xl shadow-md p-6 border border-indigo-100 dark:border-gray-700 space-y-5">
        <div className="flex items-start gap-4">
          <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300 flex-shrink-0">
            <InformationCircleIcon />
          </div>
          <div className="space-y-4 flex-grow">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{t.aboutApp}</h2>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {t.aboutAppDesc}
              </p>
            </div>

            {/* Developer Credits Card */}
            <div className="bg-white dark:bg-gray-900/90 rounded-xl p-4 border border-indigo-100 dark:border-gray-700/80 shadow-xs space-y-2.5">
              <div className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                {t.devTitle}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700/80">
                  <div className="font-bold text-sm text-gray-900 dark:text-white">{t.dev1Name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{t.dev1Role}</div>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700/80">
                  <div className="font-bold text-sm text-gray-900 dark:text-white">{t.dev2Name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{t.dev2Role}</div>
                </div>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800">
                <span className="font-black text-amber-600 dark:text-amber-400">{t.directorate}</span>
                <span>{t.allRightsReserved}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
