import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StudentIdentity, PhysicalTests } from '../types';
import { getStudentList, getPhysicalTests, savePhysicalTests, getAllClasses, toggleStudentGender } from '../utils/db';
import { 
  XMarkIcon, 
  PlayIcon, 
  PauseIcon, 
  ArrowPathIcon, 
  CheckCircleIcon, 
  UserGroupIcon, 
  ChevronRightIcon, 
  TrashIcon, 
  TrophyIcon, 
  SparklesIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  CheckIcon
} from './Icons';

interface Sprint30mTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClass: string;
  classList?: string[];
  onDataSaved?: () => void;
}

interface LaneRunner {
  laneIndex: number; // 1, 2, 3, 4
  recordedTime?: number; // e.g. 3.98
  isFinished: boolean;
  studentNumber: string; // assigned AFTER test
}

export const Sprint30mTestModal: React.FC<Sprint30mTestModalProps> = ({
  isOpen,
  onClose,
  initialClass,
  classList = [],
  onDataSaved,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>(initialClass);
  const [classes, setClasses] = useState<string[]>(classList);
  const [laneCount, setLaneCount] = useState<1 | 2 | 3 | 4>(3);
  const [students, setStudents] = useState<StudentIdentity[]>([]);
  const [physicalResults, setPhysicalResults] = useState<PhysicalTests[]>([]);

  // Runners for current race heat
  const [runners, setRunners] = useState<LaneRunner[]>([
    { laneIndex: 1, studentNumber: '', isFinished: false },
    { laneIndex: 2, studentNumber: '', isFinished: false },
    { laneIndex: 3, studentNumber: '', isFinished: false },
  ]);

  // Search/Filter state per lane for student assignment
  const [laneSearchQuery, setLaneSearchQuery] = useState<Record<number, string>>({});
  const [quickNumberInput, setQuickNumberInput] = useState<Record<number, string>>({});

  // Active view tab: 'race' or 'untested'
  const [bottomTab, setBottomTab] = useState<'results' | 'untested'>('results');

  // Stopwatch state
  const [testState, setTestState] = useState<'idle' | 'running' | 'paused'>('idle');
  const [elapsedTime, setElapsedTime] = useState<number>(0); // in milliseconds
  const startTimeRef = useRef<number>(0);

  // Multi-touch synchronization refs
  const physicalResultsRef = useRef<PhysicalTests[]>([]);
  const lastFinishTapRef = useRef<{ timestamp: number; timeSec: number } | null>(null);
  const lastTouchHandledTimeRef = useRef<Record<string, number>>({});

  useEffect(() => {
    physicalResultsRef.current = physicalResults;
  }, [physicalResults]);

  // Audio Context for beeps
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playBeep = (freq = 880, duration = 0.15, type: OscillatorType = 'sine') => {
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
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  };

  // Load class list dropdown
  useEffect(() => {
    if (classList.length > 0) {
      setClasses(classList);
      if (!selectedClass || !classList.includes(selectedClass)) {
        setSelectedClass(classList[0]);
      }
    } else {
      getAllClasses().then(clsList => {
        const names = clsList.map(c => c.className);
        setClasses(names);
        if (names.length > 0 && (!selectedClass || !names.includes(selectedClass))) {
          setSelectedClass(names[0]);
        }
      });
    }
  }, [classList, selectedClass]);

  // Load class students and test results
  const loadClassData = async (clsName: string) => {
    if (!clsName) return;
    try {
      const studentList = await getStudentList(clsName);
      const phys = await getPhysicalTests(clsName);
      setStudents(studentList || []);
      setPhysicalResults(phys || []);
    } catch (err) {
      console.error('Error loading class data for 30m test:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedClass(initialClass);
      loadClassData(initialClass);
      resetTimer();
    }
  }, [isOpen, initialClass]);

  useEffect(() => {
    if (selectedClass) {
      loadClassData(selectedClass);
      resetTimer();
    }
  }, [selectedClass]);

  // Handle double-click / double-tap to toggle student gender
  const lastGenderTapRef = useRef<{ [key: string]: number }>({});
  const handleToggleStudentGender = async (studentNum: string) => {
    if (!selectedClass) return;
    try {
      const newSexe = await toggleStudentGender(selectedClass, studentNum);
      setStudents(prev => prev.map(s => s.numeroEleve === studentNum ? { ...s, sexe: newSexe } : s));
      setPhysicalResults(prev => prev.map(p => p.numeroEleve === studentNum ? { ...p, sexe: newSexe } : p));
      setRunners(prev => prev.map(r => r.assignedStudent?.numeroEleve === studentNum ? {
        ...r,
        assignedStudent: { ...r.assignedStudent, sexe: newSexe }
      } : r));
    } catch (e) {
      console.error('Error toggling student gender in Sprint modal', e);
    }
  };

  const handleGenderInteraction = (studentNum: string, isTouch = false) => {
    const now = Date.now();
    const lastTap = lastGenderTapRef.current[studentNum] || 0;
    if (isTouch) {
      if (now - lastTap < 380) {
        lastGenderTapRef.current[studentNum] = 0;
        handleToggleStudentGender(studentNum);
      } else {
        lastGenderTapRef.current[studentNum] = now;
      }
    } else {
      if (now - lastTap < 400) return;
      lastGenderTapRef.current[studentNum] = now;
      handleToggleStudentGender(studentNum);
    }
  };

  // Sync runners array when laneCount changes
  useEffect(() => {
    setRunners(prev => {
      const newRunners: LaneRunner[] = [];
      for (let i = 1; i <= laneCount; i++) {
        const existing = prev.find(r => r.laneIndex === i);
        if (existing) {
          newRunners.push(existing);
        } else {
          newRunners.push({ laneIndex: i, studentNumber: '', isFinished: false });
        }
      }
      return newRunners;
    });
  }, [laneCount]);

  // Stopwatch timer loop
  useEffect(() => {
    if (testState === 'running') {
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - startTimeRef.current);
      }, 16); // ~60fps smooth timer
      return () => clearInterval(interval);
    }
  }, [testState]);

  // Start timer - Starts immediately without requiring pre-selection of students!
  const startTimer = () => {
    playBeep(1046.5, 0.3, 'square');
    startTimeRef.current = Date.now() - elapsedTime;
    setTestState('running');
  };

  // Pause timer
  const pauseTimer = () => {
    playBeep(440, 0.1);
    setTestState('paused');
  };

  // Reset timer
  const resetTimer = () => {
    setTestState('idle');
    setElapsedTime(0);
    lastFinishTapRef.current = null;
    setRunners(prev => prev.map(r => ({
      ...r,
      recordedTime: undefined,
      isFinished: false,
      studentNumber: ''
    })));
    setLaneSearchQuery({});
    setQuickNumberInput({});
  };

  // Prepare next run (clears times & assigned students for new runners)
  const prepareNextRun = () => {
    setTestState('idle');
    setElapsedTime(0);
    lastFinishTapRef.current = null;
    setRunners(prev => prev.map(r => ({
      ...r,
      recordedTime: undefined,
      isFinished: false,
      studentNumber: ''
    })));
    setLaneSearchQuery({});
    setQuickNumberInput({});
  };

  // Record finish time for a lane when touched/clicked (supports Multi-touch Ex æquo)
  const handleLaneFinish = async (laneIndex: number) => {
    if (testState !== 'running' && testState !== 'paused') return;

    const runner = runners.find(r => r.laneIndex === laneIndex);
    if (!runner) return;

    if (!runner.isFinished) {
      const now = Date.now();
      let timeInSec = Number((elapsedTime / 1000).toFixed(2));

      // Multi-touch Ex æquo synchronization:
      // If two or more lanes are touched within 160ms, synchronize their times to be 100% identical!
      if (lastFinishTapRef.current && (now - lastFinishTapRef.current.timestamp) < 160) {
        timeInSec = lastFinishTapRef.current.timeSec;
      } else {
        lastFinishTapRef.current = { timestamp: now, timeSec: timeInSec };
      }

      playBeep(1318.5, 0.15, 'sine');

      const nextRunners = runners.map(r => 
        r.laneIndex === laneIndex ? { ...r, recordedTime: timeInSec, isFinished: true } : r
      );
      setRunners(nextRunners);

      // If student is already assigned, save immediately
      if (runner.studentNumber) {
        await saveStudent30mTime(runner.studentNumber, timeInSec);
      }

      // If all lanes have finished, pause timer automatically
      const allFinished = nextRunners.every(r => r.isFinished);
      if (allFinished) {
        playBeep(1567.98, 0.25, 'triangle');
        setTestState('paused');
      }
    }
  };

  // Direct multi-touch handler (fires on touchscreen instantly without delay)
  const handleLaneTouchStart = (e: React.TouchEvent, laneIndex: number) => {
    if (testState !== 'running' && testState !== 'paused') return;
    e.preventDefault();
    lastTouchHandledTimeRef.current[`lane_${laneIndex}`] = Date.now();
    handleLaneFinish(laneIndex);
  };

  // Mouse click fallback for desktop
  const handleLaneClick = (laneIndex: number) => {
    if (Date.now() - (lastTouchHandledTimeRef.current[`lane_${laneIndex}`] || 0) < 450) return;
    handleLaneFinish(laneIndex);
  };

  // Undo / cancel a lane's recorded time
  const handleCancelLaneTime = (laneIndex: number) => {
    playBeep(440, 0.1);
    setRunners(prev => prev.map(r => 
      r.laneIndex === laneIndex ? { ...r, recordedTime: undefined, isFinished: false, studentNumber: '' } : r
    ));
    lastFinishTapRef.current = null;
  };

  // Assign a student to a finished lane AFTER the race
  const handleAssignStudent = async (laneIndex: number, studentNumber: string) => {
    const runner = runners.find(r => r.laneIndex === laneIndex);
    if (!runner || runner.recordedTime === undefined) return;

    // Check if this student is already selected in another lane
    const alreadyInOtherLane = runners.some(r => r.laneIndex !== laneIndex && r.studentNumber === studentNumber);
    if (alreadyInOtherLane) {
      alert('هذا التلميذ تم ربطه بممر آخر في نفس هذا السباق!');
      return;
    }

    setRunners(prev => prev.map(r => 
      r.laneIndex === laneIndex ? { ...r, studentNumber } : r
    ));

    // Clear search input for this lane
    setLaneSearchQuery(prev => ({ ...prev, [laneIndex]: '' }));
    setQuickNumberInput(prev => ({ ...prev, [laneIndex]: '' }));

    // Save directly to IndexedDB
    await saveStudent30mTime(studentNumber, runner.recordedTime);
    playBeep(880, 0.1, 'sine');
  };

  // Remove/change assigned student for a lane
  const handleUnassignStudent = (laneIndex: number) => {
    setRunners(prev => prev.map(r => 
      r.laneIndex === laneIndex ? { ...r, studentNumber: '' } : r
    ));
  };

  // Handle quick number entry submit (e.g. typing "7" and pressing Enter)
  const handleQuickNumberSubmit = (laneIndex: number) => {
    const query = (quickNumberInput[laneIndex] || '').trim();
    if (!query) return;

    // Find student by orderIndex or numeroEleve
    const match = students.find(s => 
      String(s.orderIndex) === query || 
      String(s.numeroEleve) === query ||
      s.nomEleve.toLowerCase().includes(query.toLowerCase())
    );

    if (match) {
      handleAssignStudent(laneIndex, match.numeroEleve);
    } else {
      alert(`لم يتم العثور على تلميذ بالرقم أو الاسم: "${query}"`);
    }
  };

  // Auto assign the next untested students in sequential order (optional helper)
  const autoAssignNextUntested = () => {
    const assignedNumbers = new Set(runners.map(r => r.studentNumber).filter(Boolean));
    const untested = students.filter(s => {
      if (assignedNumbers.has(s.numeroEleve)) return false;
      const res = physicalResults.find(r => r.numeroEleve === s.numeroEleve);
      return res?.vitesse30m === undefined || res.vitesse30m === null;
    });

    let poolIndex = 0;
    setRunners(prev => prev.map(runner => {
      if (runner.studentNumber) return runner; // already assigned
      const candidate = untested[poolIndex++];
      if (candidate) {
        if (runner.isFinished && runner.recordedTime !== undefined) {
          saveStudent30mTime(candidate.numeroEleve, runner.recordedTime);
        }
        return { ...runner, studentNumber: candidate.numeroEleve };
      }
      return runner;
    }));
  };

  // Save student 30m time to IndexedDB (safe against concurrent multi-touch calls)
  const saveStudent30mTime = async (numeroEleve: string, timeSec: number) => {
    const studentObj = students.find(s => s.numeroEleve === numeroEleve);
    if (!studentObj) return;

    const currentPhys = [...physicalResultsRef.current];
    const existingIdx = currentPhys.findIndex(p => p.numeroEleve === numeroEleve);

    const updatedItem: PhysicalTests = {
      ...(existingIdx >= 0 ? currentPhys[existingIdx] : {}),
      numeroEleve,
      nomEleve: studentObj.nomEleve,
      sexe: studentObj.sexe,
      vitesse30m: timeSec,
      date: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      currentPhys[existingIdx] = updatedItem;
    } else {
      currentPhys.push(updatedItem);
    }

    physicalResultsRef.current = currentPhys;
    setPhysicalResults(currentPhys);
    await savePhysicalTests(selectedClass, currentPhys);
    window.dispatchEvent(new CustomEvent('dbUpdated'));
    if (onDataSaved) onDataSaved();
  };

  // Delete student 30m result from DB
  const handleDeleteResult = async (numeroEleve: string) => {
    const updatedPhys = physicalResults.map(p => {
      if (p.numeroEleve === numeroEleve) {
        const { vitesse30m, ...rest } = p;
        return rest as PhysicalTests;
      }
      return p;
    });
    setPhysicalResults(updatedPhys);
    await savePhysicalTests(selectedClass, updatedPhys);
    window.dispatchEvent(new CustomEvent('dbUpdated'));
    if (onDataSaved) onDataSaved();
  };

  // List of completed results (sorted by fastest time)
  const completedResults = useMemo(() => {
    return students
      .map(s => {
        const res = physicalResults.find(r => r.numeroEleve === s.numeroEleve);
        return {
          student: s,
          timeSec: res?.vitesse30m
        };
      })
      .filter(item => item.timeSec !== undefined && item.timeSec > 0)
      .sort((a, b) => (a.timeSec || 0) - (b.timeSec || 0));
  }, [students, physicalResults]);

  // List of untested students
  const untestedStudents = useMemo(() => {
    return students.filter(s => {
      const res = physicalResults.find(r => r.numeroEleve === s.numeroEleve);
      return res?.vitesse30m === undefined || res.vitesse30m === null || res.vitesse30m === 0;
    });
  }, [students, physicalResults]);

  if (!isOpen) return null;

  const formattedSeconds = (elapsedTime / 1000).toFixed(2);
  const finishedLanesCount = runners.filter(r => r.isFinished).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md">
              <TrophyIcon className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black">اختبار 30 م سرعة (سباق السرعة)</h2>
              <p className="text-xs text-amber-100/90 font-medium">تسجيل توقيت الوصول مباشرة عند خط النهاية ثم إدخال اسم أو رقم التلميذ بعد الاختبار</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-grow custom-scrollbar">
          
          {/* Top Options Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-700/40 rounded-2xl border border-gray-200/80 dark:border-gray-700">
            {/* Class Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 shrink-0">
                القسم:
              </label>
              {classes.length > 0 ? (
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  disabled={testState !== 'idle'}
                  className="px-3 py-2 text-xs sm:text-sm font-bold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 disabled:opacity-60 cursor-pointer"
                >
                  {classes.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              ) : (
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800">
                  لا توجد أقسام مسجلة
                </span>
              )}
            </div>

            {/* Lane Count Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">عدد الممرات في السباق:</span>
              <div className="flex bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-300 dark:border-gray-600">
                {([1, 2, 3, 4] as const).map(num => (
                  <button
                    key={num}
                    disabled={testState !== 'idle'}
                    onClick={() => setLaneCount(num)}
                    className={`px-3 py-1 text-xs font-black rounded-lg transition-all ${
                      laneCount === num
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50'
                    }`}
                  >
                    {num} {num === 1 ? 'تلميذ' : 'تلاميذ'}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Auto-Fill Untested helper */}
            <button
              onClick={autoAssignNextUntested}
              title="ربط التوقيت المسجل أو الممرات بالدفعة التالية غير المجتازة تلقائياً"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900/60 rounded-xl border border-amber-300 dark:border-amber-800 transition cursor-pointer"
            >
              <SparklesIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>ربط بالدفعة غير المجتازة تلقائياً</span>
            </button>
          </div>

          {/* Main Stopwatch Window */}
          <div className="flex flex-col items-center justify-center p-5 sm:p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900 text-white rounded-3xl shadow-xl border border-gray-700 relative overflow-hidden">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-2">
              <span>عداد السرعة المباشر (30 م)</span>
              <span className="text-gray-400 font-normal">|</span>
              <span className="text-emerald-400">👆 اللمس المتعدد مفعل (وصول متزامن)</span>
            </div>

            {/* Digital Timer Value */}
            <div className="text-5xl sm:text-7xl font-mono font-black tracking-wider text-amber-400 drop-shadow-md my-2">
              {formattedSeconds} <span className="text-2xl font-bold text-gray-400">ثانية</span>
            </div>

            {/* Race Instructions / State Banner */}
            <div className="text-xs text-center text-gray-300 mb-3 max-w-xl">
              {testState === 'idle' && (
                <span>اضغط على زر <strong>الانطلاق 🚀</strong> للبدء، ثم المس بطاقة كل ممر عند خط النهاية فور وصول العداء لتسجيل الزمن.</span>
              )}
              {testState === 'running' && (
                <span className="text-amber-300 font-bold animate-pulse">⚡ السباق جارٍ! المس بطاقة الممر المقابل فور وصول المتسابق لخط النهاية 🏁</span>
              )}
              {testState === 'paused' && (
                <span className="text-emerald-300 font-bold">✅ تم إيقاف السباق مؤقتاً. يمكنك الآن تسجيل اسم أو رقم كل تلميذ أسفل بطاقته.</span>
              )}
            </div>

            {/* Action Buttons (Icon-Only with Hover Tooltips) */}
            <div className="flex items-center gap-4 mt-1 flex-wrap justify-center">
              {testState === 'idle' && (
                <div className="relative group">
                  <button
                    onClick={startTimer}
                    aria-label="بدء السباق الانطلاق"
                    className="p-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/30 transition transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <PlayIcon className="w-7 h-7 fill-current" />
                  </button>
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 text-xs font-black bg-gray-900 text-white px-3 py-1 rounded-xl shadow-xl whitespace-nowrap z-50 border border-gray-700">
                    بدء السباق الانطلاق 🚀
                  </div>
                </div>
              )}

              {testState === 'running' && (
                <div className="relative group">
                  <button
                    onClick={pauseTimer}
                    aria-label="إيقاف مؤقت"
                    className="p-3.5 bg-amber-500 hover:bg-amber-400 text-white font-black rounded-2xl shadow-lg shadow-amber-500/30 transition transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <PauseIcon className="w-7 h-7" />
                  </button>
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 text-xs font-black bg-gray-900 text-white px-3 py-1 rounded-xl shadow-xl whitespace-nowrap z-50 border border-gray-700">
                    إيقاف مؤقت ⏸️
                  </div>
                </div>
              )}

              {testState === 'paused' && (
                <div className="relative group">
                  <button
                    onClick={startTimer}
                    aria-label="متابعة"
                    className="p-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/30 transition transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <PlayIcon className="w-7 h-7 fill-current" />
                  </button>
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 text-xs font-black bg-gray-900 text-white px-3 py-1 rounded-xl shadow-xl whitespace-nowrap z-50 border border-gray-700">
                    متابعة العداد ▶️
                  </div>
                </div>
              )}

              <div className="relative group">
                <button
                  onClick={resetTimer}
                  aria-label="إعادة ضبط العداد"
                  className="p-3.5 bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold rounded-2xl transition transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <ArrowPathIcon className="w-7 h-7" />
                </button>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 text-xs font-black bg-gray-900 text-white px-3 py-1 rounded-xl shadow-xl whitespace-nowrap z-50 border border-gray-700">
                  إعادة ضبط العداد 🔄
                </div>
              </div>

              <div className="relative group">
                <button
                  onClick={prepareNextRun}
                  aria-label="السباق التالي"
                  className="p-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 transition transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <ChevronRightIcon className="w-7 h-7 rotate-180" />
                </button>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 text-xs font-black bg-gray-900 text-white px-3 py-1 rounded-xl shadow-xl whitespace-nowrap z-50 border border-gray-700">
                  السباق التالي ⏩ (تفريغ الممرات للعدائين الجدد)
                </div>
              </div>
            </div>
          </div>

          {/* ACTIVE LANES GRID: TOUCH TO RECORD TIME + POST-RACE STUDENT REGISTRATION */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <UserGroupIcon className="w-5 h-5 text-amber-600" />
                  <span>ممرات السباق ({runners.length} ممرات):</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  المس الممر لتسجيل زمن الوصول مباشرة، ثم حدد اسم أو رقم التلميذ المسجل لهذا التوقيت
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-xl border border-amber-300 dark:border-amber-800">
                  الوصول المسجل: {finishedLanesCount} من {runners.length}
                </span>
              </div>
            </div>

            {/* Lanes Grid */}
            <div className={`grid grid-cols-1 ${runners.length === 2 ? 'sm:grid-cols-2' : runners.length === 3 ? 'sm:grid-cols-3' : runners.length === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'max-w-md mx-auto'} gap-4`}>
              {runners.map(runner => {
                const assignedStudent = students.find(s => s.numeroEleve === runner.studentNumber);
                const isExAequo = runner.isFinished && runner.recordedTime !== undefined &&
                  runners.some(r => r.laneIndex !== runner.laneIndex && r.isFinished && r.recordedTime === runner.recordedTime);

                const searchQuery = (laneSearchQuery[runner.laneIndex] || '').toLowerCase();
                const filteredStudents = students.filter(s => {
                  if (!searchQuery) return true;
                  const orderMatch = s.orderIndex && String(s.orderIndex).includes(searchQuery);
                  const numMatch = s.numeroEleve.includes(searchQuery);
                  const nameMatch = s.nomEleve.toLowerCase().includes(searchQuery);
                  return orderMatch || numMatch || nameMatch;
                });

                return (
                  <div
                    key={runner.laneIndex}
                    className={`flex flex-col justify-between p-4 rounded-3xl border-2 transition-all shadow-md ${
                      runner.isFinished
                        ? 'bg-white dark:bg-gray-800 border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/20'
                        : testState === 'running'
                        ? 'bg-amber-500/10 border-amber-500 animate-pulse'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {/* Lane Header Bar */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        الممر #{runner.laneIndex}
                      </span>

                      {isExAequo && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-amber-400 text-gray-900 shadow-xs">
                          🤝 متزامن (Ex æquo)
                        </span>
                      )}

                      {runner.isFinished && (
                        <button
                          onClick={() => handleCancelLaneTime(runner.laneIndex)}
                          title="إلغاء هذا التوقيت"
                          className="text-[11px] text-gray-400 hover:text-red-500 transition cursor-pointer"
                        >
                          إلغاء 🔄
                        </button>
                      )}
                    </div>

                    {/* BIG FINISH TOUCH TARGET */}
                    {!runner.isFinished ? (
                      <button
                        onTouchStart={(e) => handleLaneTouchStart(e, runner.laneIndex)}
                        onClick={() => handleLaneClick(runner.laneIndex)}
                        disabled={testState === 'idle'}
                        className={`w-full py-8 px-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all transform active:scale-95 cursor-pointer touch-manipulation select-none border-2 border-dashed ${
                          testState === 'running'
                            ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-400 shadow-lg shadow-amber-500/30'
                            : 'bg-gray-100 dark:bg-gray-700/50 text-gray-400 border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        <CheckCircleIcon className={`w-8 h-8 mb-1 ${testState === 'running' ? 'animate-bounce' : ''}`} />
                        <span className="text-sm font-black">
                          {testState === 'running' ? 'المس للتسجيل عند الوصول 🏁' : 'جاهز للانطلاق'}
                        </span>
                        <span className="text-[10px] opacity-80 mt-0.5">
                          {testState === 'running' ? 'تجميد التوقيت فور خط النهاية' : 'اضغط زر البدء لتشغيل العداد'}
                        </span>
                      </button>
                    ) : (
                      /* FINISHED TIME DISPLAY */
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-300 dark:border-emerald-800 text-center mb-3">
                        <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                          التوقيت المسجل للممر #{runner.laneIndex}
                        </div>
                        <div className="text-3xl font-mono font-black text-emerald-800 dark:text-emerald-200 tracking-wide my-0.5">
                          {runner.recordedTime?.toFixed(2)}
                        </div>
                        <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          السرعة: {runner.recordedTime ? ((30 / runner.recordedTime) * 3.6).toFixed(1) : '-'} كم/س
                        </div>
                      </div>
                    )}

                    {/* POST-TEST STUDENT IDENTIFICATION (RECORD NAME / NUMBER AFTER TEST) */}
                    {runner.isFinished && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        {assignedStudent ? (
                          /* ALREADY ASSIGNED STUDENT VIEW */
                          <div className="p-3 bg-gray-50 dark:bg-gray-700/60 rounded-2xl border border-emerald-400/50 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                                <CheckIcon className="w-4 h-4 text-emerald-500" />
                                <span>تم ربط النتيجة بنجاح:</span>
                              </span>
                              <button
                                onClick={() => handleUnassignStudent(runner.laneIndex)}
                                className="text-[11px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-0.5 cursor-pointer"
                              >
                                <PencilSquareIcon className="w-3.5 h-3.5" />
                                <span>تغيير</span>
                              </button>
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-xs font-mono font-bold text-gray-400">
                                  #{assignedStudent.orderIndex || assignedStudent.numeroEleve}
                                </div>
                                <div className="text-sm font-black text-gray-900 dark:text-white truncate">
                                  {assignedStudent.nomEleve}
                                </div>
                              </div>
                              <span 
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer select-none transition-all duration-150 hover:scale-110 active:scale-95 border ${assignedStudent.sexe === 'F' ? 'bg-pink-100 text-pink-700 border-pink-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}
                                title="انقر مرتين لتغيير الجنس بين ذكر وأنثى"
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  handleGenderInteraction(assignedStudent.numeroEleve, false);
                                }}
                                onTouchEnd={(e) => {
                                  e.stopPropagation();
                                  handleGenderInteraction(assignedStudent.numeroEleve, true);
                                }}
                              >
                                <span>{assignedStudent.sexe === 'F' ? 'أنثى' : 'ذكر'}</span>
                                <span className="text-[9px] opacity-40">⇄</span>
                              </span>
                            </div>
                          </div>
                        ) : (
                          /* UNASSIGNED: ENTER OR SELECT STUDENT NAME / NUMBER */
                          <div className="space-y-2">
                            <div className="text-xs font-black text-amber-700 dark:text-amber-400 flex items-center justify-between">
                              <span>✍️ سجل اسم أو رقم التلميذ:</span>
                            </div>

                            {/* Option 1: Fast Number Quick-Entry Input */}
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                placeholder="رقم التلميذ (#)"
                                value={quickNumberInput[runner.laneIndex] || ''}
                                onChange={(e) => setQuickNumberInput(prev => ({ ...prev, [runner.laneIndex]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleQuickNumberSubmit(runner.laneIndex);
                                  }
                                }}
                                className="w-full px-2.5 py-1.5 text-xs font-bold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 text-right"
                              />
                              <button
                                onClick={() => handleQuickNumberSubmit(runner.laneIndex)}
                                className="px-3 py-1.5 text-xs font-black bg-amber-600 hover:bg-amber-500 text-white rounded-xl shrink-0 cursor-pointer shadow-xs"
                              >
                                حفظ
                              </button>
                            </div>

                            {/* Option 2: Searchable Dropdown / Selector */}
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="أو ابحث بالاسم في القسم..."
                                value={laneSearchQuery[runner.laneIndex] || ''}
                                onChange={(e) => setLaneSearchQuery(prev => ({ ...prev, [runner.laneIndex]: e.target.value }))}
                                className="w-full px-2.5 py-1 text-[11px] bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-right"
                              />
                            </div>

                            {/* Quick Scrollable Student List for 1-Tap Assignment */}
                            <div className="max-h-36 overflow-y-auto space-y-1 p-1 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200/80 dark:border-gray-700/80 custom-scrollbar">
                              {filteredStudents.length === 0 ? (
                                <div className="text-[10px] text-gray-400 p-2 text-center">لا يوجد تلميذ مطابق</div>
                              ) : (
                                filteredStudents.map(student => {
                                  const prevRes = physicalResults.find(r => r.numeroEleve === student.numeroEleve);
                                  const hasTested = prevRes?.vitesse30m !== undefined && prevRes.vitesse30m > 0;
                                  const isSelectedInOtherLane = runners.some(r => r.laneIndex !== runner.laneIndex && r.studentNumber === student.numeroEleve);

                                  return (
                                    <button
                                      key={student.numeroEleve}
                                      disabled={isSelectedInOtherLane}
                                      onClick={() => handleAssignStudent(runner.laneIndex, student.numeroEleve)}
                                      className={`w-full flex items-center justify-between p-1.5 rounded-lg text-right text-xs transition cursor-pointer ${
                                        isSelectedInOtherLane
                                          ? 'opacity-40 bg-gray-100 dark:bg-gray-800'
                                          : 'hover:bg-amber-100 dark:hover:bg-amber-950/60 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700'
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5 truncate">
                                        <span className="font-mono font-bold text-gray-400 text-[10px]">
                                          #{student.orderIndex || student.numeroEleve}
                                        </span>
                                        <span className="font-bold text-gray-900 dark:text-gray-100 truncate">
                                          {student.nomEleve}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0">
                                        {!hasTested ? (
                                          <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.2 rounded">
                                            لم يجتز
                                          </span>
                                        ) : (
                                          <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400">
                                            {prevRes.vitesse30m?.toFixed(2)}
                                          </span>
                                        )}
                                      </div>
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* LOWER SECTION: RESULTS TABLE & UNTESTED ROSTER */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            {/* Tabs Bar */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBottomTab('results')}
                  className={`px-3 py-1.5 text-xs font-black rounded-xl transition ${
                    bottomTab === 'results'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  النتائج المسجلة بالقسم ({completedResults.length})
                </button>
                <button
                  onClick={() => setBottomTab('untested')}
                  className={`px-3 py-1.5 text-xs font-black rounded-xl transition ${
                    bottomTab === 'untested'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  التلاميذ غير المجتازين بعد ({untestedStudents.length})
                </button>
              </div>

              <div className="text-xs font-bold text-gray-500 dark:text-gray-400">
                نسبة الإنجاز: {students.length > 0 ? Math.round((completedResults.length / students.length) * 100) : 0}%
              </div>
            </div>

            {/* TAB 1: COMPLETED RESULTS TABLE */}
            {bottomTab === 'results' && (
              <div>
                {completedResults.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-dashed">
                    لم يتم تسجيل أي زمن في اختبار 30 م سرعة لهذا القسم بعد. ابدأ السباق وسجل توقيت المتسابقين!
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs">
                    <table className="w-full text-xs text-center border-collapse">
                      <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="p-2.5 w-12">#</th>
                          <th className="p-2.5 text-right">الاسم والنسب</th>
                          <th className="p-2.5 w-16">الجنس</th>
                          <th className="p-2.5 w-28">الزمن (ثانية)</th>
                          <th className="p-2.5 w-28">السرعة (كم/س)</th>
                          <th className="p-2.5 w-16">حذف</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                        {completedResults.map(({ student, timeSec }, idx) => {
                          const speedKmH = timeSec ? ((30 / timeSec) * 3.6).toFixed(1) : '-';

                          return (
                            <tr key={student.numeroEleve} className="hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-colors">
                              <td className="p-2 font-bold text-gray-600 dark:text-gray-400">
                                {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : idx + 1}
                              </td>
                              <td className="p-2 text-right font-bold text-gray-900 dark:text-white">
                                {student.nomEleve}
                              </td>
                              <td className="p-2">
                                <span 
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer select-none transition-all duration-150 hover:scale-110 active:scale-95 border ${student.sexe === 'F' ? 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300 border-pink-200 dark:border-pink-800' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800'}`}
                                  title="انقر مرتين لتغيير الجنس بين ذكر وأنثى"
                                  onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    handleGenderInteraction(student.numeroEleve, false);
                                  }}
                                  onTouchEnd={(e) => {
                                    e.stopPropagation();
                                    handleGenderInteraction(student.numeroEleve, true);
                                  }}
                                >
                                  <span>{student.sexe === 'F' ? 'أنثى' : 'ذكر'}</span>
                                  <span className="text-[9px] opacity-40">⇄</span>
                                </span>
                              </td>
                              <td className="p-2 font-mono font-black text-amber-700 dark:text-amber-400 text-sm">
                                {timeSec?.toFixed(2)}
                              </td>
                              <td className="p-2 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                {speedKmH} كم/س
                              </td>
                              <td className="p-2">
                                <button
                                  onClick={() => handleDeleteResult(student.numeroEleve)}
                                  title="حذف هذا الرقم"
                                  className="p-1 hover:bg-red-100 dark:hover:bg-red-950/50 text-red-500 rounded-lg transition cursor-pointer"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: UNTESTED STUDENTS ROSTER */}
            {bottomTab === 'untested' && (
              <div>
                {untestedStudents.length === 0 ? (
                  <div className="p-6 text-center text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-dashed border-emerald-300">
                    🎉 رائع! جميع تلاميذ هذا القسم اجتازوا اختبار 30 م سرعة بنجاح!
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                    {untestedStudents.map((student) => (
                      <div
                        key={student.numeroEleve}
                        className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-xs font-bold text-gray-400">
                            #{student.orderIndex || student.numeroEleve}
                          </span>
                          <span 
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer select-none transition-all duration-150 hover:scale-110 active:scale-95 border ${student.sexe === 'F' ? 'bg-pink-100 text-pink-700 border-pink-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}
                            title="انقر مرتين لتغيير الجنس بين ذكر وأنثى"
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              handleGenderInteraction(student.numeroEleve, false);
                            }}
                            onTouchEnd={(e) => {
                              e.stopPropagation();
                              handleGenderInteraction(student.numeroEleve, true);
                            }}
                          >
                            <span>{student.sexe === 'F' ? 'أنثى' : 'ذكر'}</span>
                            <span className="text-[9px] opacity-40">⇄</span>
                          </span>
                        </div>
                        <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {student.nomEleve}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium hidden sm:block">
            نظام اختبار السرعة 30 م مع اللمس المتعدد وتسجيل الأسماء بعد الوصول
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>

      </div>
    </div>
  );
};
