import React from 'react';
import { useLanguage } from '../utils/i18n';
import { 
  XMarkIcon, 
  ExcelIcon, 
  ArrowDownTrayIcon,
  CheckIcon,
  ArrowUpTrayIcon
} from './Icons';
import { downloadStudentsTemplate, downloadTarlStudentsTemplate } from '../utils/excelHelper';

export type StudentListType = 'massar' | 'tarl';

interface ImportTypeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: StudentListType) => void;
  selectedClass?: string;
}

export const ImportTypeSelectorModal: React.FC<ImportTypeSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectType,
  selectedClass
}) => {
  const { language } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl">
              <ExcelIcon className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black">
                {language === 'ar' ? 'اختيار نوع لائحة التلاميذ' : 'Choisir le type de liste'}
              </h2>
              <p className="text-xs text-indigo-100 font-medium">
                {language === 'ar' 
                  ? 'يرجى تحديد صيغة اللائحة المراد استيرادها إلى التطبيق' 
                  : 'Sélectionnez le format de la liste à importer'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content Options */}
        <div className="p-6 space-y-4">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
            {language === 'ar' 
              ? 'اختر نوع اللائحة للمتابعة واستيراد الأسماء وبيانات التلاميذ:' 
              : 'Choisissez le type de fichier Excel :'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* OPTION 1: Massar Standard Class List */}
            <div className="p-5 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/40 dark:bg-indigo-950/20 hover:border-indigo-500 transition-all flex flex-col justify-between gap-4 group">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                    <ExcelIcon className="w-5 h-5" />
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                    {language === 'ar' ? 'الافتراضي' : 'Standard'}
                  </span>
                </div>
                <h3 className="text-base font-black text-gray-900 dark:text-white group-hover:text-indigo-600 transition">
                  {language === 'ar' ? '1. لائحة مسار لقسم معين' : '1. Liste Massar de classe'}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {language === 'ar'
                    ? 'اللائحة الرسمية المستخرجة من منظومة مسار لأقسام المؤسسة العادية (ملف لكل قسم أو عدة ملفات).'
                    : 'Liste officielle issue de la plateforme Massar pour une classe standard.'}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/60">
                <button
                  type="button"
                  onClick={() => onSelectType('massar')}
                  className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowUpTrayIcon className="w-4 h-4" />
                  <span>{language === 'ar' ? 'تحميل لائحة مسار (Excel)' : 'Importer liste Massar'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadStudentsTemplate(selectedClass)}
                  className="w-full py-1.5 px-3 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/60 text-[11px] font-bold transition flex items-center justify-center gap-1"
                >
                  <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'تحميل نموذج مسار فارغ' : 'Modèle Massar'}</span>
                </button>
              </div>
            </div>

            {/* OPTION 2: TaRL Support Groups List */}
            <div className="p-5 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20 hover:border-emerald-500 transition-all flex flex-col justify-between gap-4 group">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                    <ExcelIcon className="w-5 h-5" />
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                    {language === 'ar' ? 'مجموعات الدعم' : 'TaRL / Soutien'}
                  </span>
                </div>
                <h3 className="text-base font-black text-gray-900 dark:text-white group-hover:text-emerald-600 transition">
                  {language === 'ar' ? '2. لائحة قسم طارل (TaRL)' : '2. Liste de classe TaRL'}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {language === 'ar'
                    ? 'لوائح مجموعات الدعم بتلاميذ المؤسسة (مشروع مدارس الريادة طارل)، يتم تقسيم الأقسام حسب مجموعة الدعم أو الفوج.'
                    : 'Listes des groupes de soutien TaRL (Écoles pionnières) avec répartition par groupe de soutien.'}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-emerald-100 dark:border-emerald-900/60">
                <button
                  type="button"
                  onClick={() => onSelectType('tarl')}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowUpTrayIcon className="w-4 h-4" />
                  <span>{language === 'ar' ? 'تحميل لائحة طارل (Excel)' : 'Importer liste TaRL'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadTarlStudentsTemplate('طارل - الفوج 1')}
                  className="w-full py-1.5 px-3 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/60 text-[11px] font-bold transition flex items-center justify-center gap-1"
                >
                  <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'تحميل نموذج طارل فارغ' : 'Modèle TaRL'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            {language === 'ar' ? 'إغلاق' : 'Fermer'}
          </button>
        </div>

      </div>
    </div>
  );
};
