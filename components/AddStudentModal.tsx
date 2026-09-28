import React, { useState, useEffect } from 'react';
import { useLanguage } from '../utils/i18n';
import { addStudentToClass } from '../utils/db';
import { detectGenderFromName } from '../utils/genderHelper';
import { 
  XMarkIcon, 
  CheckIcon, 
  UserPlusIcon, 
  AcademicCapIcon,
  SparklesIcon
} from './Icons';
import type { StudentIdentity } from '../types';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultClassName?: string;
  classList: string[];
  onStudentAdded?: (className: string, student: StudentIdentity) => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  defaultClassName = '',
  classList = [],
  onStudentAdded
}) => {
  const { language } = useLanguage();
  const [targetClass, setTargetClass] = useState(defaultClassName);
  const [isCustomClass, setIsCustomClass] = useState(false);
  const [customClassName, setCustomClassName] = useState('');
  const [nomEleve, setNomEleve] = useState('');
  const [numeroEleve, setNumeroEleve] = useState('');
  const [sexe, setSexe] = useState<'M' | 'F'>('M');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (defaultClassName) {
        setTargetClass(defaultClassName);
        setIsCustomClass(false);
      } else if (classList.length > 0) {
        setTargetClass(classList[0]);
        setIsCustomClass(false);
      } else {
        setIsCustomClass(true);
      }
      setNomEleve('');
      setNumeroEleve('');
      setSexe('M');
      setErrorMessage(null);
    }
  }, [isOpen, defaultClassName, classList]);

  if (!isOpen) return null;

  // Auto-detect gender when name changes
  const handleNameChange = (nameVal: string) => {
    setNomEleve(nameVal);
    if (nameVal.trim().length >= 3) {
      const detected = detectGenderFromName(nameVal);
      if (detected) {
        setSexe(detected);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const finalClassName = isCustomClass ? customClassName.trim() : targetClass.trim();
    const finalNom = nomEleve.trim();

    if (!finalClassName) {
      setErrorMessage(language === 'ar' ? 'يرجى تحديد أو كتابة اسم القسم.' : 'Veuillez renseigner la classe.');
      return;
    }

    if (!finalNom) {
      setErrorMessage(language === 'ar' ? 'يرجى كتابة اسم ونسب التلميذ.' : 'Veuillez saisir le nom de l\'élève.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await addStudentToClass(finalClassName, {
        nomEleve: finalNom,
        numeroEleve: numeroEleve.trim() || undefined,
        sexe
      });

      if (res.success) {
        if (onStudentAdded) {
          onStudentAdded(finalClassName, res.student);
        }
        onClose();
      } else {
        setErrorMessage(res.error || (language === 'ar' ? 'حدث خطأ أثناء حفظ التلميذ.' : 'Erreur d\'enregistrement.'));
      }
    } catch (err: any) {
      console.error('Failed to add student:', err);
      setErrorMessage(err.message || (language === 'ar' ? 'حدث خطأ أثناء الحفظ.' : 'Erreur.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-lg overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl">
              <UserPlusIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black">
                {language === 'ar' ? 'إضافة تلميذ يدوياً' : 'Ajouter un élève manuellement'}
              </h2>
              <p className="text-xs text-indigo-100">
                {language === 'ar' ? 'تسجيل تلميذ جديد في القسم المحدد' : 'Inscrire un nouvel élève'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
              <XMarkIcon className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Target Class Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
              {language === 'ar' ? 'القسم المستهدف:' : 'Classe cible :'}
            </label>
            
            {classList.length > 0 && !isCustomClass ? (
              <div className="flex items-center gap-2">
                <select
                  value={targetClass}
                  onChange={(e) => setTargetClass(e.target.value)}
                  className="flex-grow px-3.5 py-2 text-sm font-bold rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  {classList.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsCustomClass(true)}
                  className="px-3 py-2 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 transition whitespace-nowrap"
                >
                  + {language === 'ar' ? 'قسم جديد' : 'Nouvelle'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={language === 'ar' ? 'مثال: 3ème 2 أو طارل 1...' : 'Ex: 3ème 2...'}
                  value={isCustomClass ? customClassName : targetClass}
                  onChange={(e) => isCustomClass ? setCustomClassName(e.target.value) : setTargetClass(e.target.value)}
                  className="flex-grow px-3.5 py-2 text-sm font-bold rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  required
                />
                {classList.length > 0 && isCustomClass && (
                  <button
                    type="button"
                    onClick={() => setIsCustomClass(false)}
                    className="px-3 py-2 text-xs font-bold rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition whitespace-nowrap"
                  >
                    {language === 'ar' ? 'اختيار من الأقسام' : 'Liste'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Student Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
              {language === 'ar' ? 'الاسم الكامل للتلميذ (الاسم والنسب) *:' : 'Nom et prénom de l\'élève *:'}
            </label>
            <input
              type="text"
              required
              placeholder={language === 'ar' ? 'مثال: أمين عثماني / Yassine Alami' : 'Ex: Yassine Alami...'}
              value={nomEleve}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-bold rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            />
          </div>

          {/* Student Number / Massar Code */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                {language === 'ar' ? 'رقم التلميذ أو رمز مسار (اختياري):' : 'N° élève ou Code Massar (optionnel) :'}
              </label>
              <span className="text-[10px] text-gray-400">
                {language === 'ar' ? 'تلقائي إذا ترك فارغاً' : 'Automatique si vide'}
              </span>
            </div>
            <input
              type="text"
              placeholder={language === 'ar' ? 'مثال: M130045678 أو 25' : 'Ex: M130045678 ou 25'}
              value={numeroEleve}
              onChange={(e) => setNumeroEleve(e.target.value)}
              className="w-full px-3.5 py-2 text-sm font-mono rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Gender Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
              {language === 'ar' ? 'النوع / الجنس:' : 'Sexe / Genre :'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSexe('M')}
                className={`py-2.5 px-4 rounded-xl border-2 text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                  sexe === 'M'
                    ? 'border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 ring-2 ring-blue-500/20'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span>👦</span>
                <span>{language === 'ar' ? 'ذكر (Garçon)' : 'Garçon (M)'}</span>
                {sexe === 'M' && <CheckIcon />}
              </button>

              <button
                type="button"
                onClick={() => setSexe('F')}
                className={`py-2.5 px-4 rounded-xl border-2 text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                  sexe === 'F'
                    ? 'border-pink-500 bg-pink-50 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300 ring-2 ring-pink-500/20'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span>👧</span>
                <span>{language === 'ar' ? 'أنثى (Fille)' : 'Fille (F)'}</span>
                {sexe === 'F' && <CheckIcon />}
              </button>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 transition"
            >
              {language === 'ar' ? 'إلغاء' : 'Annuler'}
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 text-xs font-black rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckIcon />
              )}
              <span>{language === 'ar' ? 'إضافة وحفظ التلميذ' : 'Ajouter l\'élève'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
