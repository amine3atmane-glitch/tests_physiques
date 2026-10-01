import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StudentIdentity, PhysicalTests } from '../types';
import { getStudentList, getPhysicalTests, savePhysicalTests, getAllClasses, toggleStudentGender } from '../utils/db';
import { evaluateTestPerformance, TEST_SPORT_RECOMMENDATIONS } from '../utils/evaluationHelper';
import { useLanguage } from '../utils/i18n';
import { XMarkIcon, CheckIcon, TrashIcon, ArrowPathIcon, TrophyIcon, UsersIcon } from './Icons';

export type ScaleTestField = 'sautVertical' | 'sautHorizontal' | 'lancerMedball' | 'souplesseAssis' | 'souplesseDebout';

interface VisualScaleTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  testField: ScaleTestField;
  initialClass: string;
  classList?: string[];
  onDataSaved?: () => void;
}

interface TestMetaConfig {
  titleAr: string;
  titleFr: string;
  unitAr: string;
  unitFr: string;
  min: number;
  max: number;
  step: number;
  presets: number[];
  isVertical: boolean;
  icon: string;
  themeGradient: string;
  badgeBg: string;
}

const TEST_CONFIGS: Record<ScaleTestField, TestMetaConfig> = {
  sautVertical: {
    titleAr: 'اختبار القفز العمودي (سارجنت)',
    titleFr: 'Test de Détente Verticale (Sargent)',
    unitAr: 'سم',
    unitFr: 'cm',
    min: 5,
    max: 100,
    step: 1,
    presets: [20, 30, 40, 50, 60, 70],
    isVertical: true,
    icon: '🚀',
    themeGradient: 'from-purple-600 via-indigo-600 to-purple-700',
    badgeBg: 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border-purple-300'
  },
  sautHorizontal: {
    titleAr: 'اختبار القفز الأفقي (الوثب العريض)',
    titleFr: 'Test de Détente Horizontale (Saut en Longueur)',
    unitAr: 'سم',
    unitFr: 'cm',
    min: 50,
    max: 350,
    step: 1,
    presets: [120, 150, 180, 210, 240, 270],
    isVertical: false,
    icon: '📐',
    themeGradient: 'from-blue-600 via-sky-600 to-blue-700',
    badgeBg: 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border-blue-300'
  },
  lancerMedball: {
    titleAr: 'اختبار رمي الكرة الطبية (2 كغ)',
    titleFr: 'Test de Lancer de Médicine Ball (2kg)',
    unitAr: 'متر',
    unitFr: 'm',
    min: 1.0,
    max: 15.0,
    step: 0.1,
    presets: [3.0, 4.5, 6.0, 7.5, 9.0, 10.5],
    isVertical: false,
    icon: '💥',
    themeGradient: 'from-orange-600 via-amber-600 to-orange-700',
    badgeBg: 'bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200 border-orange-300'
  },
  souplesseAssis: {
    titleAr: 'اختبار مرونة الجذع من الجلوس',
    titleFr: 'Test de Souplesse du Tronc (Assis)',
    unitAr: 'سم',
    unitFr: 'cm',
    min: -10,
    max: 50,
    step: 1,
    presets: [5, 10, 15, 20, 25, 30],
    isVertical: false,
    icon: '🧘',
    themeGradient: 'from-emerald-600 via-teal-600 to-emerald-700',
    badgeBg: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-300'
  },
  souplesseDebout: {
    titleAr: 'اختبار مرونة الجذع من الوقوف',
    titleFr: 'Test de Souplesse du Tronc (Debout)',
    unitAr: 'سم',
    unitFr: 'cm',
    min: -10,
    max: 50,
    step: 1,
    presets: [5, 10, 15, 20, 25, 30],
    isVertical: true,
    icon: '🧘‍♂️',
    themeGradient: 'from-cyan-600 via-teal-600 to-cyan-700',
    badgeBg: 'bg-cyan-100 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-200 border-cyan-300'
  }
};

export const VisualScaleTestModal: React.FC<VisualScaleTestModalProps> = ({
  isOpen,
  onClose,
  testField,
  initialClass,
  classList = [],
  onDataSaved
}) => {
  const { language } = useLanguage();
  const config = TEST_CONFIGS[testField] || TEST_CONFIGS.sautVertical;

  const [selectedClass, setSelectedClass] = useState<string>(initialClass);
  const [classes, setClasses] = useState<string[]>(classList);
  const [students, setStudents] = useState<StudentIdentity[]>([]);
  const [physicalResults, setPhysicalResults] = useState<PhysicalTests[]>([]);

  // Selected student for quick scale entry
  const [selectedStudentNum, setSelectedStudentNum] = useState<string>('');
  const [currentScore, setCurrentScore] = useState<number>(config.presets[2] || 20);

  // Search & Filter state
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'all' | 'untested' | 'tested' | 'M' | 'F'>('all');

  // Multi-touch & Audio beep feedback
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playBeep = (freq = 880, duration = 0.1, type: OscillatorType = 'sine') => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      if (!audioCtxRef.current) return;

      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio context error fallback
    }
  };

  // Load class list
  useEffect(() => {
    if (classList.length > 0) {
      setClasses(classList);
    } else {
      getAllClasses().then(clsList => {
        setClasses(clsList.map(c => c.className));
      });
    }
  }, [classList]);

  // Load students & test results
  const loadData = async (clsName: string) => {
    if (!clsName) return;
    try {
      const studentList = await getStudentList(clsName);
      const phys = await getPhysicalTests(clsName);
      setStudents(studentList || []);
      setPhysicalResults(phys || []);

      if (studentList && studentList.length > 0) {
        const first = studentList[0];
        setSelectedStudentNum(first.numeroEleve);
        const existingRes = (phys || []).find(p => p.numeroEleve === first.numeroEleve);
        const val = existingRes ? (existingRes as any)[testField] : undefined;
        setCurrentScore(val !== undefined && val !== null ? Number(val) : config.presets[2] || 20);
      }
    } catch (err) {
      console.error('Error loading data for scale test:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedClass(initialClass);
      loadData(initialClass);
    }
  }, [isOpen, initialClass]);

  useEffect(() => {
    if (selectedClass) {
      loadData(selectedClass);
    }
  }, [selectedClass]);

  // Handle student change
  const handleSelectStudent = (num: string) => {
    setSelectedStudentNum(num);
    const existingRes = physicalResults.find(p => p.numeroEleve === num);
    const val = existingRes ? (existingRes as any)[testField] : undefined;
    if (val !== undefined && val !== null && !isNaN(val)) {
      setCurrentScore(Number(val));
    } else {
      setCurrentScore(config.presets[2] || 20);
    }
    playBeep(600, 0.08);
  };

  // Save current student score to IndexedDB instantly
  const handleSaveScore = async (scoreToSave = currentScore) => {
    if (!selectedStudentNum || !selectedClass) return;

    const roundedVal = testField === 'lancerMedball' ? Number(scoreToSave.toFixed(1)) : Math.round(scoreToSave);
    const activeStudentObj = students.find(s => s.numeroEleve === selectedStudentNum);

    const updatedPhys = [...physicalResults];
    const existingIndex = updatedPhys.findIndex(p => p.numeroEleve === selectedStudentNum);

    if (existingIndex >= 0) {
      updatedPhys[existingIndex] = {
        ...updatedPhys[existingIndex],
        [testField]: roundedVal,
        date: new Date().toISOString().split('T')[0]
      };
    } else {
      updatedPhys.push({
        numeroEleve: selectedStudentNum,
        nomEleve: activeStudentObj?.nomEleve || 'تلميذ',
        sexe: activeStudentObj?.sexe || 'M',
        [testField]: roundedVal,
        date: new Date().toISOString().split('T')[0]
      });
    }

    setPhysicalResults(updatedPhys);
    await savePhysicalTests(selectedClass, updatedPhys);
    window.dispatchEvent(new CustomEvent('dbUpdated'));
    if (onDataSaved) onDataSaved();
    playBeep(1000, 0.12, 'triangle');
  };

  // Quick adjust score
  const adjustScore = (delta: number) => {
    const next = Math.max(config.min, Math.min(config.max, currentScore + delta));
    const rounded = testField === 'lancerMedball' ? Number(next.toFixed(1)) : Math.round(next);
    setCurrentScore(rounded);
    handleSaveScore(rounded);
    playBeep(750, 0.05);
  };

  // Move to next student in list
  const handleNextStudent = () => {
    const currentIndex = filteredStudents.findIndex(s => s.numeroEleve === selectedStudentNum);
    if (currentIndex >= 0 && currentIndex < filteredStudents.length - 1) {
      const nextStudent = filteredStudents[currentIndex + 1];
      handleSelectStudent(nextStudent.numeroEleve);
    }
  };

  // Move to previous student in list
  const handlePrevStudent = () => {
    const currentIndex = filteredStudents.findIndex(s => s.numeroEleve === selectedStudentNum);
    if (currentIndex > 0) {
      const prevStudent = filteredStudents[currentIndex - 1];
      handleSelectStudent(prevStudent.numeroEleve);
    }
  };

  // Toggle student gender
  const handleToggleGender = async (num: string) => {
    try {
      const newSexe = await toggleStudentGender(selectedClass, num);
      setStudents(prev => prev.map(s => s.numeroEleve === num ? { ...s, sexe: newSexe } : s));
      setPhysicalResults(prev => prev.map(p => p.numeroEleve === num ? { ...p, sexe: newSexe } : p));
    } catch (e) {
      console.error('Error toggling gender:', e);
    }
  };

  // Filtered student list
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // Search text
      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase().trim();
        const matchesName = (s.nomEleve || '').toLowerCase().includes(q);
        const matchesNum = String(s.numeroEleve).includes(q);
        if (!matchesName && !matchesNum) return false;
      }

      // Filter tab
      const res = physicalResults.find(p => p.numeroEleve === s.numeroEleve);
      const score = res ? (res as any)[testField] : undefined;
      const isTested = score !== undefined && score !== null && score > 0;

      if (filterTab === 'untested') return !isTested;
      if (filterTab === 'tested') return isTested;
      if (filterTab === 'M') return s.sexe === 'M' || !s.sexe;
      if (filterTab === 'F') return s.sexe === 'F';
      return true;
    });
  }, [students, physicalResults, studentSearch, filterTab, testField]);

  // Selected student object
  const activeStudent = useMemo(() => {
    return students.find(s => s.numeroEleve === selectedStudentNum) || students[0];
  }, [students, selectedStudentNum]);

  const activeStudentIndex = useMemo(() => {
    return students.findIndex(s => s.numeroEleve === selectedStudentNum);
  }, [students, selectedStudentNum]);

  // Evaluation rating
  const evalResult = useMemo(() => {
    if (!activeStudent) return null;
    return evaluateTestPerformance(testField, currentScore, activeStudent.sexe || 'M');
  }, [testField, currentScore, activeStudent]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-4xl max-h-[96vh] flex flex-col overflow-hidden my-auto">
        
        {/* Header Bar */}
        <div className={`px-4 sm:px-6 py-3 bg-gradient-to-r ${config.themeGradient} text-white flex items-center justify-between shrink-0 shadow-md`}>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl sm:text-3xl">{config.icon}</span>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide">
                {language === 'ar' ? config.titleAr : config.titleFr}
              </h2>
              <p className="text-[10px] sm:text-xs text-white/80 font-bold">
                {language === 'ar' ? 'مدرج إدخال وتقييم المردود البدني المباشر' : 'Réglette d\'évaluation directe de la performance'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition cursor-pointer"
            aria-label="إغلاق"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 space-y-4 custom-scrollbar">

          {/* CLASS SELECTOR BAR (حقل القسم الحالي) */}
          <div className="flex items-center justify-between gap-3 bg-indigo-50/80 dark:bg-gray-800/80 px-4 py-2.5 rounded-2xl border border-indigo-200 dark:border-gray-700 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-extrabold text-indigo-900 dark:text-indigo-300">القسم الحالي:</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm font-bold px-3 py-1.5 rounded-xl border border-indigo-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
              >
                {classes.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="text-xs font-extrabold text-gray-600 dark:text-gray-300">
              عدد تلاميذ القسم: <span className="text-indigo-600 dark:text-indigo-400 font-black">{students.length}</span>
            </div>
          </div>

          {/* PROMINENT ACTIVE STUDENT IDENTITY CARD BANNER */}
          {activeStudent && (
            <div className="bg-gradient-to-r from-amber-500/15 via-indigo-600/15 to-purple-600/15 dark:from-amber-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 border-2 border-amber-400/60 dark:border-amber-500/40 p-4 rounded-2xl sm:rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-amber-500 text-gray-950 font-black text-base sm:text-xl flex items-center justify-center shrink-0 shadow-md border-2 border-amber-300">
                  #{activeStudentIndex >= 0 ? activeStudentIndex + 1 : 1}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-500 text-gray-950 font-black text-xs shadow-xs border border-amber-300">
                      القسم: {selectedClass}
                    </span>
                    <span className="text-[10px] sm:text-xs font-extrabold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                      {language === 'ar' ? '• التلميذ(ة) الجاري تقييم اختباره:' : '• Élève évalué:'}
                    </span>
                  </div>
                  <div className="text-xl sm:text-3xl font-black text-gray-900 dark:text-amber-200 tracking-wide">
                    {activeStudent.nomEleve}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleGender(activeStudent.numeroEleve)}
                  className={`px-3 py-1.5 text-xs font-black rounded-xl transition shadow-xs cursor-pointer ${
                    activeStudent.sexe === 'F' 
                      ? 'bg-rose-600 text-white shadow-rose-600/20' 
                      : 'bg-indigo-600 text-white shadow-indigo-600/20'
                  }`}
                  title="انقر لتغيير الجنس (ذكر / أنثى)"
                >
                  {activeStudent.sexe === 'F' ? 'أنثى ♀' : 'ذكر ♂'}
                </button>

                <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs">
                  <button
                    onClick={handlePrevStudent}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-200 rounded-lg text-xs font-black transition cursor-pointer"
                    title="التلميذ السابق"
                  >
                    ◀ السابق
                  </button>
                  <button
                    onClick={handleNextStudent}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-gray-950 rounded-lg text-xs font-black transition cursor-pointer shadow-xs"
                    title="التلميذ التالي"
                  >
                    التالي ▶
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* INTERACTIVE RULER / SCALE & VALUE ADJUSTER */}
          <div className="bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-950 text-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xl border border-indigo-500/30 flex flex-col items-center gap-4">
            
            {/* Live Performance Value & Rating Badge */}
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                {language === 'ar' ? 'المردود المباشر المسجل' : 'Performance Enregistrée'}
              </div>
              <div className="flex items-baseline gap-2 font-mono font-black text-4xl sm:text-6xl text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.35)]">
                <span>{testField === 'lancerMedball' ? currentScore.toFixed(1) : currentScore}</span>
                <span className="text-xl sm:text-2xl font-bold text-gray-300">{config.unitAr}</span>
              </div>

              {evalResult && (
                <div className={`mt-1 px-3 py-1 rounded-full text-xs border ${evalResult.badgeColor} shadow-md`}>
                  {language === 'ar' ? evalResult.labelAr : evalResult.labelFr}
                </div>
              )}
            </div>

            {/* Quick Presets Bar */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              <span className="text-[11px] font-bold text-gray-400 me-1">اختيار سريع:</span>
              {config.presets.map(p => (
                <button
                  key={p}
                  onClick={() => {
                    setCurrentScore(p);
                    handleSaveScore(p);
                    playBeep(800, 0.08);
                  }}
                  className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
                    currentScore === p
                      ? 'bg-amber-500 text-gray-950 shadow-lg shadow-amber-500/30 scale-105'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700'
                  }`}
                >
                  {p} {config.unitAr}
                </button>
              ))}
            </div>

            {/* INTERACTIVE SCROLLABLE RULER SCALE */}
            <div className="w-full max-w-2xl py-2">
              <div className="text-center text-[10px] font-bold text-gray-400 mb-2">
                ↔ اسحب شريط المدرج لتحديد النتيجة الدقيقة أو استخدم أزرار الضبط ↕
              </div>

              {/* Slider Input with Ticks */}
              <div className="relative flex items-center gap-3">
                <button
                  onClick={() => adjustScore(-config.step)}
                  className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-black text-lg flex items-center justify-center border border-gray-700 shrink-0 cursor-pointer active:scale-95"
                  title="-1"
                >
                  -
                </button>

                <div className="flex-1 relative">
                  <input
                    type="range"
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    value={currentScore}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setCurrentScore(val);
                      handleSaveScore(val);
                    }}
                    className="w-full h-4 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
                  />

                  {/* Ruler Ticks Simulation */}
                  <div className="flex justify-between px-1 mt-2 text-[9px] font-mono text-gray-400">
                    <span>{config.min} {config.unitAr}</span>
                    <span>{Math.round((config.min + config.max) / 2)} {config.unitAr}</span>
                    <span>{config.max} {config.unitAr}</span>
                  </div>
                </div>

                <button
                  onClick={() => adjustScore(config.step)}
                  className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-black text-lg flex items-center justify-center border border-gray-700 shrink-0 cursor-pointer active:scale-95"
                  title="+1"
                >
                  +
                </button>
              </div>

              {/* Quick Stepper Buttons */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => adjustScore(-10 * config.step)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-gray-800 text-gray-300 hover:text-white border border-gray-700 cursor-pointer"
                >
                  -10
                </button>
                <button
                  onClick={() => adjustScore(-5 * config.step)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-gray-800 text-gray-300 hover:text-white border border-gray-700 cursor-pointer"
                >
                  -5
                </button>
                <button
                  onClick={() => adjustScore(5 * config.step)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-gray-800 text-gray-300 hover:text-white border border-gray-700 cursor-pointer"
                >
                  +5
                </button>
                <button
                  onClick={() => adjustScore(10 * config.step)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-gray-800 text-gray-300 hover:text-white border border-gray-700 cursor-pointer"
                >
                  +10
                </button>
              </div>
            </div>

            {/* Next Student Button */}
            <button
              onClick={handleNextStudent}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>حفظ والانتقال للتلميذ التالي ⏩</span>
            </button>
          </div>

          {/* CLASS STUDENT LIST TABLE WITH SCORES */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                <UsersIcon className="w-4 h-4 text-indigo-600" />
                <span>قائمة تلاميذ القسم ({filteredStudents.length} تلميذ):</span>
              </h3>

              {/* Search & Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <input
                  type="text"
                  placeholder="بحث باسم التلميذ..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-32 sm:w-40"
                />

                <div className="flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-xl border border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setFilterTab('all')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition ${
                      filterTab === 'all' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                    }`}
                  >
                    الكل
                  </button>
                  <button
                    onClick={() => setFilterTab('untested')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition ${
                      filterTab === 'untested' ? 'bg-amber-600 text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                    }`}
                  >
                    غير مسجل
                  </button>
                  <button
                    onClick={() => setFilterTab('tested')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition ${
                      filterTab === 'tested' ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                    }`}
                  >
                    تم التقييم
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="max-h-56 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl custom-scrollbar">
              <table className="w-full text-xs text-start">
                <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 sticky top-0 font-bold border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="p-2 text-center w-12">#</th>
                    <th className="p-2 text-center w-20">القسم</th>
                    <th className="p-2 text-start">اسم التلميذ(ة)</th>
                    <th className="p-2 text-center w-16">الجنس</th>
                    <th className="p-2 text-center w-28">النتيجة ({config.unitAr})</th>
                    <th className="p-2 text-center w-28">التقييم</th>
                    <th className="p-2 text-center w-20">تحديد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-gray-400 font-bold">
                        لا توجد نتائج مطابقة للبحث
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student, idx) => {
                      const isSelected = student.numeroEleve === selectedStudentNum;
                      const res = physicalResults.find(p => p.numeroEleve === student.numeroEleve);
                      const val = res ? (res as any)[testField] : undefined;
                      const evalInfo = evaluateTestPerformance(testField, val, student.sexe || 'M');
                      const studentIndexInClass = students.findIndex(s => s.numeroEleve === student.numeroEleve);
                      const orderNum = studentIndexInClass >= 0 ? studentIndexInClass + 1 : idx + 1;

                      return (
                        <tr
                          key={student.numeroEleve}
                          onClick={() => handleSelectStudent(student.numeroEleve)}
                          className={`transition cursor-pointer ${
                            isSelected 
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 font-bold' 
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          }`}
                        >
                          <td className="p-2 text-center font-mono font-bold text-gray-500">
                            #{orderNum}
                          </td>
                          <td className="p-2 text-center">
                            <span className="px-2 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 text-[10px] font-extrabold border border-indigo-200 dark:border-indigo-800">
                              {selectedClass}
                            </span>
                          </td>
                          <td className="p-2 font-black text-sm text-gray-900 dark:text-white">
                            {student.nomEleve}
                          </td>
                          <td className="p-2 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              student.sexe === 'F' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
                            }`}>
                              {student.sexe === 'F' ? 'أنثى ♀' : 'ذكر ♂'}
                            </span>
                          </td>
                          <td className="p-2 text-center font-mono font-black text-indigo-700 dark:text-indigo-300">
                            {val !== undefined && val !== null ? `${val} ${config.unitAr}` : '-'}
                          </td>
                          <td className="p-2 text-center">
                            {val !== undefined && val !== null ? (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] border ${evalInfo.badgeColor}`}>
                                {language === 'ar' ? evalInfo.labelAr : evalInfo.labelFr}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-[10px]">-</span>
                            )}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectStudent(student.numeroEleve);
                              }}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {isSelected ? 'محدد ✓' : 'اختيار'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
