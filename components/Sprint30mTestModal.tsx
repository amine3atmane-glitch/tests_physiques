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

  // Selected target lane for student assignment from the big list below
  const [targetLane, setTargetLane] = useState<number>(1);

  // Search & Filter state for the large student list below the lanes
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [studentFilter, setStudentFilter] = useState<'all' | 'untested' | 'tested' | 'M' | 'F'>('all');
  const [quickNumberInput, setQuickNumberInput] = useState<string>('');

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
    setQuickNumberInput('');
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
    setQuickNumberInput('');
    setTargetLane(1);
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

      // If lane does not have a student yet, set targetLane to this finished lane
      if (!runner.studentNumber) {
        setTargetLane(laneIndex);
      }

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
    if (!runner) return;

    // Check if this student is already selected in another lane
    const alreadyInOtherLane = runners.some(r => r.laneIndex !== laneIndex && r.studentNumber === studentNumber);
    if (alreadyInOtherLane) {
      alert('هذا التلميذ تم ربطه بممر آخر في نفس هذا السباق!');
      return;
    }

    const updatedRunners = runners.map(r => 
      r.laneIndex === laneIndex ? { ...r, studentNumber } : r
    );
    setRunners(updatedRunners);

    // Save directly to IndexedDB if time is recorded
    if (runner.recordedTime !== undefined) {
      await saveStudent30mTime(studentNumber, runner.recordedTime);
    }
    playBeep(880, 0.1, 'sine');

    // Auto switch targetLane to the next unassigned finished lane or next lane
    const nextUnassigned = updatedRunners.find(r => r.isFinished && !r.studentNumber);
    if (nextUnassigned) {
      setTargetLane(nextUnassigned.laneIndex);
    } else {
      const anyEmpty = updatedRunners.find(r => !r.studentNumber);
      if (anyEmpty) {
        setTargetLane(anyEmpty.laneIndex);
      }
    }
  };

  // Remove/change assigned student for a lane
  const handleUnassignStudent = (laneIndex: number) => {
    setRunners(prev => prev.map(r => 
      r.laneIndex === laneIndex ? { ...r, studentNumber: '' } : r
    ));
    setTargetLane(laneIndex);
  };

  // Handle quick number entry submit (e.g. typing "7" and pressing Enter)
  const handleQuickNumberSubmit = () => {
    const query = quickNumberInput.trim();
    if (!query) return;

    // Find student by orderIndex or numeroEleve
    const match = students.find(s => 
      String(s.orderIndex) === query || 
      String(s.numeroEleve) === query ||
      s.nomEleve.toLowerCase().includes(query.toLowerCase())
    );

    if (match) {
      handleAssignStudent(targetLane, match.numeroEleve);
      setQuickNumberInput('');
    } else {
      alert(`لم يتم العثور على تلميذ بالرقم أو الاسم: "${query}"`);
    }
  };

  // Filtered students for the large selection roster underneath the lanes
  const filteredStudentsForSelection = useMemo(() => {
    return students.filter(s => {
      // Filter by search query (orderIndex, numeroEleve, nomEleve)
      if (studentSearch) {
        const query = studentSearch.toLowerCase().trim();
        const orderMatch = s.orderIndex && String(s.orderIndex).includes(query);
        const numMatch = s.numeroEleve.toLowerCase().includes(query);
        const nameMatch = s.nomEleve.toLowerCase().includes(query);
        if (!orderMatch && !numMatch && !nameMatch) return false;
      }

      // Filter by status/tab
      const prevRes = physicalResults.find(r => r.numeroEleve === s.numeroEleve);
      const hasTested = prevRes?.vitesse30m !== undefined && prevRes.vitesse30m > 0;

      if (studentFilter === 'untested' && hasTested) return false;
      if (studentFilter === 'tested' && !hasTested) return false;
      if (studentFilter === 'M' && s.sexe !== 'M') return false;
      if (studentFilter === 'F' && s.sexe !== 'F') return false;

      return true;
    });
  }, [students, studentSearch, studentFilter, physicalResults]);

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
        
        {/* Header - Compact & Clean without Description */}
        <div className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
              <TrophyIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-200" />
            </div>
            <h2 className="text-sm sm:text-base font-black truncate">
              اختبار 30 م سرعة
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-xl transition cursor-pointer shrink-0"
            aria-label="إغلاق"
          >
            <XMarkIcon className="w-5 h-5" />
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
          <div className="flex flex-col items-center justify-center p-3 sm:p-5 bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900 text-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-700 relative overflow-hidden">
            <div className="text-[10px] sm:text-xs font-bold text-amber-400 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
              <span>عداد السرعة (30 م)</span>
              <span className="text-gray-500 font-normal">|</span>
              <span className="text-emerald-400">👆 لمس متعدد</span>
            </div>

            {/* Digital Timer Value */}
            <div className="text-4xl sm:text-6xl font-mono font-black tracking-wider text-amber-400 drop-shadow-md my-1 sm:my-1.5">
              {formattedSeconds} <span className="text-base sm:text-xl font-bold text-gray-400">ثانية</span>
            </div>

            {/* Race Instructions / State Banner */}
            <div className="text-[10px] sm:text-xs text-center text-gray-300 mb-2 max-w-xl px-1">
              {testState === 'idle' && (
                <span>اضغط <strong>الانطلاق 🚀</strong>، ثم المس بطاقة الممر عند خط النهاية.</span>
              )}
              {testState === 'running' && (
                <span className="text-amber-300 font-bold animate-pulse">⚡ جارٍ! المس بطاقة الممر فور وصول التلميذ 🏁</span>
              )}
              {testState === 'paused' && (
                <span className="text-emerald-300 font-bold">✅ متوقف مؤقتاً. حدد اسم أو رقم كل تلميذ أسفل بطاقته.</span>
              )}
            </div>

            {/* Action Buttons (Icon-Only with Hover Tooltips) */}
            <div className="flex items-center gap-2.5 sm:gap-4 mt-0.5 justify-center">
              {testState === 'idle' && (
                <div className="relative group">
                  <button
                    onClick={startTimer}
                    aria-label="بدء السباق الانطلاق"
                    className="p-2.5 sm:p-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl sm:rounded-2xl shadow-lg shadow-emerald-600/30 transition transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <PlayIcon className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
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
                    className="p-2.5 sm:p-3.5 bg-amber-500 hover:bg-amber-400 text-white font-black rounded-xl sm:rounded-2xl shadow-lg shadow-amber-500/30 transition transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <PauseIcon className="w-5 h-5 sm:w-6 sm:h-6" />
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
                    className="p-2.5 sm:p-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl sm:rounded-2xl shadow-lg shadow-emerald-600/30 transition transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <PlayIcon className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
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
                  className="p-2.5 sm:p-3.5 bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold rounded-xl sm:rounded-2xl transition transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <ArrowPathIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 text-xs font-black bg-gray-900 text-white px-3 py-1 rounded-xl shadow-xl whitespace-nowrap z-50 border border-gray-700">
                  إعادة ضبط العداد 🔄
                </div>
              </div>

              <div className="relative group">
                <button
                  onClick={prepareNextRun}
                  aria-label="السباق التالي"
                  className="p-2.5 sm:p-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-600/30 transition transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <ChevronRightIcon className="w-5 h-5 sm:w-6 sm:h-6 rotate-180" />
                </button>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 text-xs font-black bg-gray-900 text-white px-3 py-1 rounded-xl shadow-xl whitespace-nowrap z-50 border border-gray-700">
                  السباق التالي ⏩
                </div>
              </div>
            </div>
          </div>

          {/* ACTIVE LANES GRID: TOUCH TO RECORD TIME */}
          <div className="space-y-2.5 sm:space-y-3">
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                <UserGroupIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                <span>ممرات السباق ({runners.length} ممرات):</span>
              </h3>

              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center text-[10px] sm:text-[11px] font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-lg border border-amber-300 dark:border-amber-800">
                  مسجل: {finishedLanesCount}/{runners.length}
                </span>
              </div>
            </div>

            {/* Lanes Grid - Side-by-Side */}
            <div className="w-full overflow-x-auto pb-1 custom-scrollbar">
              <div 
                className={`grid gap-2 sm:gap-3 ${
                  runners.length === 1 
                    ? 'grid-cols-1 max-w-xs mx-auto' 
                    : runners.length === 2 
                      ? 'grid-cols-2' 
                      : runners.length === 3 
                        ? 'grid-cols-3 min-w-[340px] sm:min-w-0' 
                        : 'grid-cols-4 min-w-[440px] sm:min-w-0'
                }`}
              >
                {runners.map(runner => {
                  const assignedStudent = students.find(s => s.numeroEleve === runner.studentNumber);
                  const isExAequo = runner.isFinished && runner.recordedTime !== undefined &&
                    runners.some(r => r.laneIndex !== runner.laneIndex && r.isFinished && r.recordedTime === runner.recordedTime);
                  const isTarget = targetLane === runner.laneIndex;

                  return (
                    <div
                      key={runner.laneIndex}
                      onClick={() => setTargetLane(runner.laneIndex)}
                      className={`flex flex-col justify-between p-2.5 sm:p-3 rounded-2xl border-2 transition-all shadow-sm cursor-pointer ${
                        isTarget
                          ? 'ring-2 ring-amber-500 shadow-md'
                          : ''
                      } ${
                        runner.isFinished
                          ? 'bg-white dark:bg-gray-800 border-emerald-500 dark:border-emerald-500'
                          : testState === 'running'
                          ? 'bg-amber-500/10 border-amber-500 animate-pulse'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {/* Lane Header Bar */}
                      <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-1">
                          <span className={`text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-lg ${
                            isTarget 
                              ? 'bg-amber-500 text-white shadow-xs' 
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                          }`}>
                            الممر #{runner.laneIndex}
                          </span>
                          {isTarget && (
                            <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">
                              (النشط)
                            </span>
                          )}
                        </div>

                        {isExAequo && (
                          <span className="px-1 py-0.5 rounded text-[8px] sm:text-[9px] font-extrabold bg-amber-400 text-gray-900">
                            🤝 متزامن
                          </span>
                        )}

                        {runner.isFinished && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelLaneTime(runner.laneIndex);
                            }}
                            title="إلغاء هذا التوقيت"
                            className="text-[10px] text-gray-400 hover:text-red-500 transition cursor-pointer"
                          >
                            إلغاء 🔄
                          </button>
                        )}
                      </div>

                      {/* BIG FINISH TOUCH TARGET */}
                      {!runner.isFinished ? (
                        <button
                          onTouchStart={(e) => handleLaneTouchStart(e, runner.laneIndex)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLaneClick(runner.laneIndex);
                          }}
                          disabled={testState === 'idle'}
                          className={`w-full py-5 sm:py-7 px-1 rounded-xl flex flex-col items-center justify-center text-center transition-all transform active:scale-95 cursor-pointer touch-manipulation select-none border-2 border-dashed ${
                            testState === 'running'
                              ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-400 shadow-md shadow-amber-500/30'
                              : 'bg-gray-100 dark:bg-gray-700/50 text-gray-400 border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          <CheckCircleIcon className={`w-6 h-6 sm:w-7 sm:h-7 mb-0.5 ${testState === 'running' ? 'animate-bounce' : ''}`} />
                          <span className="text-[11px] sm:text-xs font-black leading-tight">
                            {testState === 'running' ? 'المس هنا 🏁' : 'جاهز'}
                          </span>
                          <span className="text-[8px] sm:text-[9px] opacity-80 mt-0.5">
                            {testState === 'running' ? 'تسجيل الزمن' : 'اضغط بدء'}
                          </span>
                        </button>
                      ) : (
                        /* FINISHED TIME DISPLAY */
                        <div className="p-1.5 sm:p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-300 dark:border-emerald-800 text-center mb-1.5">
                          <div className="text-[9px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                            التوقيت المسجل
                          </div>
                          <div className="text-xl sm:text-2xl font-mono font-black text-emerald-800 dark:text-emerald-200 tracking-tight my-0.5">
                            {runner.recordedTime?.toFixed(2)}
                          </div>
                          <div className="text-[8px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            {runner.recordedTime ? ((30 / runner.recordedTime) * 3.6).toFixed(1) : '-'} كم/س
                          </div>
                        </div>
                      )}

                      {/* ASSIGNED STUDENT CARD IN LANE */}
                      <div className="mt-1 pt-1.5 border-t border-gray-200 dark:border-gray-700">
                        {assignedStudent ? (
                          <div className="p-1.5 bg-gray-50 dark:bg-gray-700/60 rounded-xl border border-emerald-400/50 flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
                                <CheckIcon className="w-3 h-3 text-emerald-500" />
                                <span>تم الربط:</span>
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnassignStudent(runner.laneIndex);
                                }}
                                className="text-[9px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-0.5 cursor-pointer"
                              >
                                <PencilSquareIcon className="w-2.5 h-2.5" />
                                <span>تغيير</span>
                              </button>
                            </div>

                            <div className="flex items-center justify-between gap-1">
                              <div className="truncate min-w-0">
                                <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                                  القسم: {selectedClass} • #{assignedStudent.orderIndex || (students.findIndex(s => s.numeroEleve === assignedStudent.numeroEleve) + 1)}
                                </div>
                                <div className="text-[11px] sm:text-xs font-black text-gray-900 dark:text-white truncate">
                                  {assignedStudent.nomEleve}
                                </div>
                              </div>
                              <span 
                                className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-bold cursor-pointer select-none shrink-0 border ${assignedStudent.sexe === 'F' ? 'bg-pink-100 text-pink-700 border-pink-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}
                                title="انقر مرتين لتغيير الجنس"
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
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className={`p-2 rounded-xl text-center border border-dashed transition ${
                              isTarget
                                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-800 dark:text-amber-300'
                                : 'bg-gray-50 dark:bg-gray-800/40 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                            }`}
                          >
                            <span className="text-[10px] font-bold block">
                              {isTarget ? '👇 اختر التلميذ من اللائحة أسفله' : '➕ اضغط لتحديد هذا الممر'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* LARGE STUDENT SELECTION ROSTER UNDERNEATH THE LANES (لائحة الأسماء والرقم الترتيبي فقط) */}
          <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
            
            {/* Header: Title + Active Target Lane Status */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black">
                  <UserGroupIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white">
                    لائحة التلاميذ ({filteredStudentsForSelection.length} تلميذ)
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    اضغط على اسم التلميذ لتعيينه مباشرة إلى <strong className="text-amber-600 dark:text-amber-400 font-black">الممر #{targetLane}</strong>
                  </p>
                </div>
              </div>

              {/* Target Lane Quick Selector */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300">
                  الممر المحدد:
                </span>
                {runners.map(r => (
                  <button
                    key={r.laneIndex}
                    onClick={() => setTargetLane(r.laneIndex)}
                    className={`px-3 py-1 text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-1 border ${
                      targetLane === r.laneIndex
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-400/30'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>ممر #{r.laneIndex}</span>
                    {r.studentNumber && <span className="text-[9px] text-emerald-300">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Box & Quick Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="🔍 بحث بالاسم أو الرقم الترتيبي (#)..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pr-3 pl-8 py-2 text-xs font-bold bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 text-right shadow-xs"
                />
                {studentSearch && (
                  <button
                    onClick={() => setStudentSearch('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 custom-scrollbar">
                <button
                  onClick={() => setStudentFilter('all')}
                  className={`px-2.5 py-1.5 text-[11px] font-bold rounded-xl transition cursor-pointer shrink-0 ${
                    studentFilter === 'all'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  الكل ({students.length})
                </button>
                <button
                  onClick={() => setStudentFilter('untested')}
                  className={`px-2.5 py-1.5 text-[11px] font-bold rounded-xl transition cursor-pointer shrink-0 ${
                    studentFilter === 'untested'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  لم يجتز ({untestedStudents.length})
                </button>
                <button
                  onClick={() => setStudentFilter('tested')}
                  className={`px-2.5 py-1.5 text-[11px] font-bold rounded-xl transition cursor-pointer shrink-0 ${
                    studentFilter === 'tested'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  اجتاز ({completedResults.length})
                </button>
              </div>
            </div>

            {/* Clear, Big Student Grid: Only Order # and Full Name */}
            <div className="max-h-72 sm:max-h-96 overflow-y-auto p-1 bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-700 custom-scrollbar">
              {filteredStudentsForSelection.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400 dark:text-gray-500">
                  لا يوجد تلميذ مطابق للبحث
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {filteredStudentsForSelection.map((student, idx) => {
                    const prevRes = physicalResults.find(r => r.numeroEleve === student.numeroEleve);
                    const hasTested = prevRes?.vitesse30m !== undefined && prevRes.vitesse30m > 0;
                    const assignedRunner = runners.find(r => r.studentNumber === student.numeroEleve);
                    const isAssignedInCurrentRace = !!assignedRunner;

                    // Clean sequential number (#1, #2, #3...) - never the 10-char Massar code!
                    const studentIdxInClass = students.findIndex(s => s.numeroEleve === student.numeroEleve);
                    const displayOrderNumber = student.orderIndex || (studentIdxInClass >= 0 ? studentIdxInClass + 1 : idx + 1);

                    return (
                      <button
                        key={student.numeroEleve}
                        type="button"
                        onClick={() => {
                          if (isAssignedInCurrentRace) {
                            handleUnassignStudent(assignedRunner.laneIndex);
                          } else {
                            handleAssignStudent(targetLane, student.numeroEleve);
                          }
                        }}
                        className={`flex items-center justify-between p-3 rounded-2xl transition-all text-right cursor-pointer select-none border-2 gap-2.5 ${
                          isAssignedInCurrentRace
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-sm ring-2 ring-emerald-500/20'
                            : hasTested
                            ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-amber-400 hover:bg-amber-50/40 dark:hover:bg-gray-750'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-gray-750'
                        }`}
                      >
                        {/* Right / Start: Order Number, Class & Name */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                          <span className={`w-9 h-9 min-w-[36px] max-w-[36px] rounded-xl font-mono font-black text-xs flex items-center justify-center shrink-0 shadow-xs ${
                            isAssignedInCurrentRace
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          }`}>
                            #{displayOrderNumber}
                          </span>

                          <div className="min-w-0 flex-1 text-right overflow-hidden">
                            <div className="text-[10px] font-black text-amber-700 dark:text-amber-400">
                              القسم: {selectedClass}
                            </div>
                            <div className="text-xs sm:text-sm font-black text-gray-900 dark:text-white truncate block">
                              {student.nomEleve}
                            </div>
                            {hasTested && (
                              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                مسجل: {prevRes.vitesse30m?.toFixed(2)} ث
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status Tag on Left */}
                        <div className="shrink-0">
                          {isAssignedInCurrentRace ? (
                            <span className="px-2.5 py-1 text-[11px] font-black rounded-xl bg-emerald-600 text-white shadow-xs">
                              الممر #{assignedRunner.laneIndex}
                            </span>
                          ) : (
                            <span className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-sm font-black opacity-70 hover:opacity-100">
                              +
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* LOWER SECTION: RESULTS TABLE & UNTESTED ROSTER */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
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
                              <td className="p-2 text-right">
                                <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                                  القسم: {selectedClass}
                                </div>
                                <div className="font-bold text-gray-900 dark:text-white">
                                  {student.nomEleve}
                                </div>
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
                    {untestedStudents.map((student, idx) => {
                      const studentIdxInClass = students.findIndex(s => s.numeroEleve === student.numeroEleve);
                      const displayOrderNumber = student.orderIndex || (studentIdxInClass >= 0 ? studentIdxInClass + 1 : idx + 1);

                      return (
                        <div
                          key={student.numeroEleve}
                          className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-xs font-bold text-gray-400">
                              #{displayOrderNumber}
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
                      );
                    })}
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
