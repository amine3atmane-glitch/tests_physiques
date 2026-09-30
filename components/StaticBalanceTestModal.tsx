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
  CheckIcon,
  BalanceIcon
} from './Icons';

interface StaticBalanceTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClass: string;
  classList?: string[];
  onDataSaved?: () => void;
}

interface StationSpot {
  stationIndex: number; // 1, 2, 3, 4
  recordedTime?: number; // e.g. 24.50 seconds
  isFinished: boolean;
  studentNumber: string; // assigned before or after test
}

export const StaticBalanceTestModal: React.FC<StaticBalanceTestModalProps> = ({
  isOpen,
  onClose,
  initialClass,
  classList = [],
  onDataSaved,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>(initialClass);
  const [classes, setClasses] = useState<string[]>(classList);
  const [stationCount, setStationCount] = useState<1 | 2 | 3 | 4>(3);
  const [students, setStudents] = useState<StudentIdentity[]>([]);
  const [physicalResults, setPhysicalResults] = useState<PhysicalTests[]>([]);

  // Stations for current balance round
  const [stations, setStations] = useState<StationSpot[]>([
    { stationIndex: 1, studentNumber: '', isFinished: false },
    { stationIndex: 2, studentNumber: '', isFinished: false },
    { stationIndex: 3, studentNumber: '', isFinished: false },
  ]);

  // Selected target station for student assignment from the big list below
  const [targetStation, setTargetStation] = useState<number>(1);

  // Search & Filter state for the large student list below the stations
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [studentFilter, setStudentFilter] = useState<'all' | 'untested' | 'tested' | 'M' | 'F'>('all');
  const [quickNumberInput, setQuickNumberInput] = useState<string>('');

  // Active view tab: 'results' or 'untested'
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
      console.error('Error loading class data for static balance test:', err);
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
    } catch (e) {
      console.error('Error toggling student gender in Balance modal', e);
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

  // Sync stations array when stationCount changes
  useEffect(() => {
    setStations(prev => {
      const newStations: StationSpot[] = [];
      for (let i = 1; i <= stationCount; i++) {
        const existing = prev.find(r => r.stationIndex === i);
        if (existing) {
          newStations.push(existing);
        } else {
          newStations.push({ stationIndex: i, studentNumber: '', isFinished: false });
        }
      }
      return newStations;
    });
  }, [stationCount]);

  // Stopwatch timer loop
  useEffect(() => {
    if (testState === 'running') {
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - startTimeRef.current);
      }, 16); // ~60fps smooth timer
      return () => clearInterval(interval);
    }
  }, [testState]);

  // Start timer
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
    setStations(prev => prev.map(r => ({
      ...r,
      recordedTime: undefined,
      isFinished: false,
      studentNumber: ''
    })));
    setQuickNumberInput('');
  };

  // Prepare next round
  const prepareNextRun = () => {
    setTestState('idle');
    setElapsedTime(0);
    lastFinishTapRef.current = null;
    setStations(prev => prev.map(r => ({
      ...r,
      recordedTime: undefined,
      isFinished: false,
      studentNumber: ''
    })));
    setTargetStation(1);
    setQuickNumberInput('');
    playBeep(587.33, 0.15, 'triangle');
  };

  // Handle station balance lost / drop / withdrawal
  const handleStationDrop = async (stationIndex: number) => {
    if (testState !== 'running' && testState !== 'paused') return;

    const station = stations.find(s => s.stationIndex === stationIndex);
    if (!station) return;

    if (!station.isFinished) {
      const now = Date.now();
      let timeInSec = Number((elapsedTime / 1000).toFixed(2));

      // Multi-touch synchronization:
      if (lastFinishTapRef.current && (now - lastFinishTapRef.current.timestamp) < 160) {
        timeInSec = lastFinishTapRef.current.timeSec;
      } else {
        lastFinishTapRef.current = { timestamp: now, timeSec: timeInSec };
      }

      playBeep(987.77, 0.15, 'sine');

      const nextStations = stations.map(s => 
        s.stationIndex === stationIndex ? { ...s, recordedTime: timeInSec, isFinished: true } : s
      );
      setStations(nextStations);

      // If station does not have a student yet, set targetStation to this dropped station
      if (!station.studentNumber) {
        setTargetStation(stationIndex);
      }

      // If student is already assigned, save immediately
      if (station.studentNumber) {
        await saveStudentBalanceTime(station.studentNumber, timeInSec);
      }

      // If all stations have finished, pause timer automatically
      const allFinished = nextStations.every(s => s.isFinished);
      if (allFinished) {
        playBeep(1567.98, 0.25, 'triangle');
        setTestState('paused');
      }
    }
  };

  // Direct multi-touch handler
  const handleStationTouchStart = (e: React.TouchEvent, stationIndex: number) => {
    if (testState !== 'running' && testState !== 'paused') return;
    e.preventDefault();
    lastTouchHandledTimeRef.current[`station_${stationIndex}`] = Date.now();
    handleStationDrop(stationIndex);
  };

  // Mouse click fallback for desktop
  const handleStationClick = (stationIndex: number) => {
    if (Date.now() - (lastTouchHandledTimeRef.current[`station_${stationIndex}`] || 0) < 450) return;
    handleStationDrop(stationIndex);
  };

  // Undo / cancel a station's recorded time
  const handleCancelStationTime = (stationIndex: number) => {
    playBeep(440, 0.1);
    setStations(prev => prev.map(s => 
      s.stationIndex === stationIndex ? { ...s, recordedTime: undefined, isFinished: false, studentNumber: '' } : s
    ));
    lastFinishTapRef.current = null;
  };

  // Assign a student to a station
  const handleAssignStudent = async (stationIndex: number, studentNumber: string) => {
    const station = stations.find(s => s.stationIndex === stationIndex);
    if (!station) return;

    // Check if this student is already selected in another station in this round
    const alreadyInOtherStation = stations.some(s => s.stationIndex !== stationIndex && s.studentNumber === studentNumber);
    if (alreadyInOtherStation) {
      alert('هذا التلميذ تم ربطه بمحطة أخرى في هذه الجولة!');
      return;
    }

    const updatedStations = stations.map(s => 
      s.stationIndex === stationIndex ? { ...s, studentNumber } : s
    );
    setStations(updatedStations);

    // Save directly to IndexedDB if time is recorded
    if (station.recordedTime !== undefined) {
      await saveStudentBalanceTime(studentNumber, station.recordedTime);
    }
    playBeep(880, 0.1, 'sine');

    // Auto switch targetStation to the next unassigned finished station or next station
    const nextUnassigned = updatedStations.find(s => s.isFinished && !s.studentNumber);
    if (nextUnassigned) {
      setTargetStation(nextUnassigned.stationIndex);
    } else {
      const anyEmpty = updatedStations.find(s => !s.studentNumber);
      if (anyEmpty) {
        setTargetStation(anyEmpty.stationIndex);
      }
    }
  };

  // Remove assigned student from a station
  const handleUnassignStudent = (stationIndex: number) => {
    setStations(prev => prev.map(s => 
      s.stationIndex === stationIndex ? { ...s, studentNumber: '' } : s
    ));
    setTargetStation(stationIndex);
  };

  // Handle quick number entry submit
  const handleQuickNumberSubmit = () => {
    const query = quickNumberInput.trim();
    if (!query) return;

    const match = students.find(s => 
      String(s.orderIndex) === query || 
      String(s.numeroEleve) === query ||
      s.nomEleve.toLowerCase().includes(query.toLowerCase())
    );

    if (match) {
      handleAssignStudent(targetStation, match.numeroEleve);
      setQuickNumberInput('');
    } else {
      alert(`لم يتم العثور على تلميذ بالرقم أو الاسم: "${query}"`);
    }
  };

  // Filtered students for the large selection roster underneath
  const filteredStudentsForSelection = useMemo(() => {
    return students.filter(s => {
      // Filter by search query
      if (studentSearch) {
        const query = studentSearch.toLowerCase().trim();
        const orderMatch = s.orderIndex && String(s.orderIndex).includes(query);
        const numMatch = s.numeroEleve.toLowerCase().includes(query);
        const nameMatch = s.nomEleve.toLowerCase().includes(query);
        if (!orderMatch && !numMatch && !nameMatch) return false;
      }

      // Filter by status/tab
      const prevRes = physicalResults.find(r => r.numeroEleve === s.numeroEleve);
      const hasTested = prevRes?.equilibreStatique !== undefined && prevRes.equilibreStatique > 0;

      if (studentFilter === 'untested' && hasTested) return false;
      if (studentFilter === 'tested' && !hasTested) return false;
      if (studentFilter === 'M' && s.sexe !== 'M') return false;
      if (studentFilter === 'F' && s.sexe !== 'F') return false;

      return true;
    });
  }, [students, studentSearch, studentFilter, physicalResults]);

  // Save student static balance time to IndexedDB
  const saveStudentBalanceTime = async (numeroEleve: string, timeSec: number) => {
    const studentObj = students.find(s => s.numeroEleve === numeroEleve);
    if (!studentObj) return;

    const currentPhys = [...physicalResultsRef.current];
    const existingIdx = currentPhys.findIndex(p => p.numeroEleve === numeroEleve);

    const updatedItem: PhysicalTests = {
      ...(existingIdx >= 0 ? currentPhys[existingIdx] : {}),
      numeroEleve,
      nomEleve: studentObj.nomEleve,
      sexe: studentObj.sexe,
      equilibreStatique: timeSec,
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

  // Delete student static balance result from DB
  const handleDeleteResult = async (numeroEleve: string) => {
    const updatedPhys = physicalResults.map(p => {
      if (p.numeroEleve === numeroEleve) {
        const { equilibreStatique, ...rest } = p;
        return rest as PhysicalTests;
      }
      return p;
    });
    setPhysicalResults(updatedPhys);
    await savePhysicalTests(selectedClass, updatedPhys);
    window.dispatchEvent(new CustomEvent('dbUpdated'));
    if (onDataSaved) onDataSaved();
  };

  // Ranked results (Longest balance duration first)
  const rankedResults = useMemo(() => {
    return physicalResults
      .filter(p => p.equilibreStatique !== undefined && p.equilibreStatique > 0)
      .map(p => {
        const studentObj = students.find(s => s.numeroEleve === p.numeroEleve);
        return {
          numeroEleve: p.numeroEleve,
          nomEleve: studentObj?.nomEleve || p.nomEleve || 'تلميذ',
          sexe: studentObj?.sexe || p.sexe || 'M',
          orderIndex: studentObj?.orderIndex,
          timeSec: p.equilibreStatique
        };
      })
      .sort((a, b) => (b.timeSec || 0) - (a.timeSec || 0));
  }, [physicalResults, students]);

  // Untested students count & list
  const untestedStudents = useMemo(() => {
    return students.filter(s => {
      const res = physicalResults.find(r => r.numeroEleve === s.numeroEleve);
      return res?.equilibreStatique === undefined || res.equilibreStatique === null || res.equilibreStatique === 0;
    });
  }, [students, physicalResults]);

  if (!isOpen) return null;

  // Format digital stopwatch display: MM:SS.cc
  const minutes = Math.floor(elapsedTime / 60000);
  const seconds = Math.floor((elapsedTime % 60000) / 1000);
  const hundredths = Math.floor((elapsedTime % 1000) / 10);
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;

  const finishedStationsCount = stations.filter(s => s.isFinished).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-teal-200 dark:border-teal-900/60 w-full max-w-4xl max-h-[96vh] flex flex-col overflow-hidden my-auto">
        
        {/* Header - Compact & Clean without Description */}
        <div className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-700 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-xl">
              <BalanceIcon className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-wide">
              اختبار التوازن الثابت (Flamant Rose)
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition cursor-pointer"
            aria-label="إغلاق"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 space-y-4 custom-scrollbar">

          {/* TOP CONTROLS & DIGITAL STOPWATCH PANEL */}
          <div className="bg-gradient-to-br from-teal-950 via-gray-900 to-slate-900 text-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl border border-teal-500/30 flex flex-col gap-3">
            
            {/* Class & Stations Selector Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-teal-300">القسم:</span>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="bg-gray-800 text-white text-xs sm:text-sm font-bold px-3 py-1.5 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer"
                >
                  {classes.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Station count picker (1, 2, 3, 4 stations) */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-gray-400">عدد التلاميذ المتزامنين:</span>
                <div className="flex bg-gray-800 p-0.5 rounded-xl border border-gray-700">
                  {([1, 2, 3, 4] as const).map((num) => (
                    <button
                      key={num}
                      onClick={() => setStationCount(num)}
                      className={`px-2.5 sm:px-3 py-1 text-xs font-black rounded-lg transition ${
                        stationCount === num
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Digital Stopwatch Display & Big Control Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 py-1">
              
              {/* Digital Timer Face */}
              <div className="flex items-baseline justify-center font-mono font-black text-4xl sm:text-6xl text-teal-400 tracking-wider select-none drop-shadow-[0_0_15px_rgba(20,184,166,0.35)]">
                {formattedTime}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 sm:gap-3">
                {testState !== 'running' ? (
                  <button
                    onClick={startTimer}
                    className="flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm sm:text-base font-black rounded-xl sm:rounded-2xl shadow-lg shadow-emerald-600/30 transition transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <PlayIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span>{testState === 'paused' ? 'استئناف' : 'بدء الاختبار ⏱️'}</span>
                  </button>
                ) : (
                  <button
                    onClick={pauseTimer}
                    className="flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3.5 bg-amber-600 hover:bg-amber-500 text-white text-sm sm:text-base font-black rounded-xl sm:rounded-2xl shadow-lg shadow-amber-600/30 transition transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <PauseIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span>إيقاف مؤقت</span>
                  </button>
                )}

                <button
                  onClick={resetTimer}
                  title="إعادة ضبط العداد"
                  className="p-2.5 sm:p-3.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl sm:rounded-2xl border border-gray-700 transition cursor-pointer"
                >
                  <ArrowPathIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                <div className="relative group">
                  <button
                    onClick={prepareNextRun}
                    aria-label="المجموعة التالية"
                    className="p-2.5 sm:p-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-600/30 transition transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <ChevronRightIcon className="w-5 h-5 sm:w-6 sm:h-6 rotate-180" />
                  </button>
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 text-xs font-black bg-gray-900 text-white px-3 py-1 rounded-xl shadow-xl whitespace-nowrap z-50 border border-gray-700">
                    المجموعة التالية ⏩
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ACTIVE STATIONS GRID: TOUCH TO RECORD WITHDRAWAL TIME */}
          <div className="space-y-2.5 sm:space-y-3">
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                <BalanceIcon className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
                <span>محطات التوازن ({stations.length} مواضع):</span>
              </h3>

              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center text-[10px] sm:text-[11px] font-bold px-2 py-0.5 bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 rounded-lg border border-teal-300 dark:border-teal-800">
                  انسحب/سقط: {finishedStationsCount}/{stations.length}
                </span>
              </div>
            </div>

            {/* Stations Grid - Side-by-Side */}
            <div className="w-full overflow-x-auto pb-1 custom-scrollbar">
              <div 
                className={`grid gap-2 sm:gap-3 ${
                  stations.length === 1 
                    ? 'grid-cols-1 max-w-xs mx-auto' 
                    : stations.length === 2 
                      ? 'grid-cols-2' 
                      : stations.length === 3 
                        ? 'grid-cols-3 min-w-[340px] sm:min-w-0' 
                        : 'grid-cols-4 min-w-[440px] sm:min-w-0'
                }`}
              >
                {stations.map(station => {
                  const assignedStudent = students.find(s => s.numeroEleve === station.studentNumber);
                  const isTarget = targetStation === station.stationIndex;

                  return (
                    <div
                      key={station.stationIndex}
                      onClick={() => setTargetStation(station.stationIndex)}
                      className={`flex flex-col justify-between p-2.5 sm:p-3 rounded-2xl border-2 transition-all shadow-sm cursor-pointer ${
                        isTarget
                          ? 'ring-2 ring-teal-500 shadow-md'
                          : ''
                      } ${
                        station.isFinished
                          ? 'bg-white dark:bg-gray-800 border-emerald-500 dark:border-emerald-500'
                          : testState === 'running'
                          ? 'bg-teal-500/10 border-teal-500 animate-pulse'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {/* Station Header Bar */}
                      <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-1">
                          <span className={`text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-lg ${
                            isTarget 
                              ? 'bg-teal-600 text-white shadow-xs' 
                              : 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300'
                          }`}>
                            المحطة #{station.stationIndex}
                          </span>
                          {isTarget && (
                            <span className="text-[9px] font-bold text-teal-600 dark:text-teal-400">
                              (النشطة)
                            </span>
                          )}
                        </div>

                        {station.isFinished && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelStationTime(station.stationIndex);
                            }}
                            title="إلغاء هذا التوقيت"
                            className="text-[10px] text-gray-400 hover:text-red-500 transition cursor-pointer"
                          >
                            إلغاء 🔄
                          </button>
                        )}
                      </div>

                      {/* Station Middle Action Area */}
                      <div className="py-1">
                        {!station.isFinished ? (
                          <div
                            onTouchStart={(e) => handleStationTouchStart(e, station.stationIndex)}
                            onClick={() => handleStationClick(station.stationIndex)}
                            className={`w-full py-4 sm:py-6 px-1 rounded-xl flex flex-col items-center justify-center text-center transition select-none ${
                              testState === 'running'
                                ? 'bg-gradient-to-b from-rose-500 to-red-600 text-white active:scale-95 shadow-md shadow-red-600/30 font-black cursor-pointer'
                                : 'bg-gray-100 dark:bg-gray-700/50 text-gray-400 text-xs font-bold'
                            }`}
                          >
                            <span className="text-xl sm:text-2xl mb-1">🛑</span>
                            <span className="text-xs sm:text-sm font-black leading-tight">
                              {testState === 'running' ? 'اضغط عند فقدان التوازن' : 'في الانتظار'}
                            </span>
                          </div>
                        ) : (
                          <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                            <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                              مدة التوازن المسجلة:
                            </div>
                            <div className="font-mono font-black text-lg sm:text-2xl text-emerald-800 dark:text-emerald-200">
                              {station.recordedTime?.toFixed(2)} <span className="text-xs font-normal">ثانية</span>
                            </div>
                            <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                              ✓ تم الحفظ تلقائياً
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Station Bottom: Assigned Student Slot */}
                      <div className="mt-2 pt-1.5 border-t border-gray-100 dark:border-gray-700">
                        {assignedStudent ? (
                          <div className="flex items-center justify-between gap-1 p-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                            <div className="truncate min-w-0">
                              <div className="text-[10px] font-mono font-bold text-gray-400">
                                #{assignedStudent.orderIndex || assignedStudent.numeroEleve}
                              </div>
                              <div className="text-xs font-black text-gray-900 dark:text-white truncate">
                                {assignedStudent.nomEleve}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnassignStudent(station.stationIndex);
                              }}
                              className="text-gray-400 hover:text-red-500 p-1 text-xs"
                              title="تغيير التلميذ"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTargetStation(station.stationIndex);
                            }}
                            className={`w-full py-1 px-1.5 text-[11px] font-bold rounded-xl border border-dashed transition flex items-center justify-center gap-1 ${
                              isTarget
                                ? 'border-teal-500 text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30'
                                : 'border-gray-300 dark:border-gray-600 text-gray-500 hover:border-teal-400'
                            }`}
                          >
                            <span>+ اختر تلميذاً</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* LARGE STUDENT SELECTION ROSTER UNDERNEATH THE STATIONS */}
          <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
            
            {/* Header with Active Target Station Indicator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black text-gray-900 dark:text-white">
                  📋 لائحة التلاميذ (انقر على الاسم لتعيينه للمحطة #{targetStation}):
                </span>
                <span className="text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-950 px-2.5 py-0.5 rounded-xl border border-teal-300 dark:border-teal-800">
                  المحطة النشطة: #{targetStation}
                </span>
              </div>

              {/* Station Switch Pills */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-gray-500">التعيين للمحطة:</span>
                {stations.map(s => (
                  <button
                    key={s.stationIndex}
                    onClick={() => setTargetStation(s.stationIndex)}
                    className={`px-2 py-0.5 text-xs font-black rounded-lg transition ${
                      targetStation === s.stationIndex
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    #{s.stationIndex}
                  </button>
                ))}
              </div>
            </div>

            {/* Toolbar: Search, Filters & Quick Number Box */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              
              {/* Search Box */}
              <div className="relative flex-1 min-w-[160px]">
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="ابحث بالاسم أو الرقم الترتيبي..."
                  className="w-full text-xs font-bold pl-8 pr-3 py-2 rounded-xl border border-gray-300 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Quick Number Input (#) */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-gray-500">رقم #:</span>
                <input
                  type="text"
                  value={quickNumberInput}
                  onChange={(e) => setQuickNumberInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickNumberSubmit()}
                  placeholder="مثال: 7"
                  className="w-16 text-center text-xs font-black py-2 px-1 rounded-xl border border-gray-300 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={handleQuickNumberSubmit}
                  className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition"
                >
                  تعيين ↵
                </button>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 p-0.5 rounded-xl border border-gray-200 dark:border-gray-600 text-[11px] font-bold">
                <button
                  onClick={() => setStudentFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    studentFilter === 'all' ? 'bg-white dark:bg-gray-800 text-teal-600 dark:text-teal-400 shadow-xs' : 'text-gray-500'
                  }`}
                >
                  الكل ({students.length})
                </button>
                <button
                  onClick={() => setStudentFilter('untested')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    studentFilter === 'untested' ? 'bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 shadow-xs' : 'text-gray-500'
                  }`}
                >
                  المتبقين ({untestedStudents.length})
                </button>
                <button
                  onClick={() => setStudentFilter('tested')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    studentFilter === 'tested' ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-gray-500'
                  }`}
                >
                  المسجلين ({rankedResults.length})
                </button>
                <button
                  onClick={() => setStudentFilter('M')}
                  className={`px-2 py-1 rounded-lg transition ${
                    studentFilter === 'M' ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-gray-500'
                  }`}
                >
                  ذكور
                </button>
                <button
                  onClick={() => setStudentFilter('F')}
                  className={`px-2 py-1 rounded-lg transition ${
                    studentFilter === 'F' ? 'bg-white dark:bg-gray-800 text-pink-600 dark:text-pink-400 shadow-xs' : 'text-gray-500'
                  }`}
                >
                  إناث
                </button>
              </div>
            </div>

            {/* Student Grid Cards: Order Number & Name Only */}
            <div className="max-h-72 overflow-y-auto pr-1 custom-scrollbar">
              {filteredStudentsForSelection.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {filteredStudentsForSelection.map((student, idx) => {
                    const prevRes = physicalResults.find(r => r.numeroEleve === student.numeroEleve);
                    const hasTested = prevRes?.equilibreStatique !== undefined && prevRes.equilibreStatique > 0;
                    const isCurrentlyAssigned = stations.some(s => s.studentNumber === student.numeroEleve);
                    const assignedStation = stations.find(s => s.studentNumber === student.numeroEleve);

                    const studentIdxInClass = students.findIndex(s => s.numeroEleve === student.numeroEleve);
                    const displayOrderNumber = student.orderIndex || (studentIdxInClass >= 0 ? studentIdxInClass + 1 : idx + 1);

                    return (
                      <div
                        key={student.numeroEleve}
                        onClick={() => handleAssignStudent(targetStation, student.numeroEleve)}
                        className={`p-2.5 sm:p-3 rounded-2xl border transition flex items-center justify-between gap-2.5 cursor-pointer select-none ${
                          isCurrentlyAssigned
                            ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 ring-2 ring-teal-500 shadow-xs'
                            : hasTested
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 hover:border-teal-400'
                            : 'bg-gray-50 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 hover:border-teal-400 hover:bg-teal-50/30'
                        }`}
                      >
                        {/* Student Order Number Badge & Name */}
                        <div className="flex items-center gap-2.5 truncate min-w-0 flex-1">
                          <span className="shrink-0 w-8 h-8 rounded-xl bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-mono font-black text-xs flex items-center justify-center border border-teal-200/80 dark:border-teal-800/80">
                            #{displayOrderNumber}
                          </span>

                          <div className="truncate min-w-0 flex-1">
                            <div className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                              {student.nomEleve}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {hasTested && (
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                  مسجل: {prevRes.equilibreStatique?.toFixed(2)} ث
                                </span>
                              )}
                              {isCurrentlyAssigned && (
                                <span className="text-[10px] font-black text-teal-600 dark:text-teal-400">
                                  (المحطة #{assignedStation?.stationIndex})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Gender Pill with Double-Click Toggle */}
                        <span
                          title="انقر مرتين لتغيير الجنس (ذكر ↔ أنثى)"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleGenderInteraction(student.numeroEleve, false);
                          }}
                          onTouchEnd={(e) => {
                            e.stopPropagation();
                            handleGenderInteraction(student.numeroEleve, true);
                          }}
                          className={`shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-bold border transition active:scale-95 cursor-pointer ${
                            student.sexe === 'F'
                              ? 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300 border-pink-300 dark:border-pink-800'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                          }`}
                        >
                          {student.sexe === 'F' ? 'أنثى ⇄' : 'ذكر ⇄'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-gray-400">
                  لا توجد نتائج مطابقة لخيارات البحث
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM RESULTS & UNTESTED LIST TABS */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            
            {/* Tab Headers */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850">
              <button
                onClick={() => setBottomTab('results')}
                className={`flex-1 py-2.5 px-4 text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition ${
                  bottomTab === 'results'
                    ? 'bg-white dark:bg-gray-800 text-teal-600 dark:text-teal-400 border-b-2 border-teal-600'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <TrophyIcon className="w-4 h-4 text-amber-500" />
                <span>ترتيب نتائج التوازن الثابت ({rankedResults.length})</span>
              </button>
              <button
                onClick={() => setBottomTab('untested')}
                className={`flex-1 py-2.5 px-4 text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition ${
                  bottomTab === 'untested'
                    ? 'bg-white dark:bg-gray-800 text-teal-600 dark:text-teal-400 border-b-2 border-teal-600'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <UserGroupIcon className="w-4 h-4 text-gray-400" />
                <span>التلاميذ المتبقين للاختبار ({untestedStudents.length})</span>
              </button>
            </div>

            {/* Tab 1: Ranking List */}
            {bottomTab === 'results' && (
              <div className="p-3 sm:p-4 max-h-60 overflow-y-auto custom-scrollbar">
                {rankedResults.length > 0 ? (
                  <div className="space-y-2">
                    {rankedResults.map((item, index) => (
                      <div
                        key={item.numeroEleve}
                        className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs ${
                            index === 0 ? 'bg-amber-400 text-gray-900' :
                            index === 1 ? 'bg-gray-300 text-gray-900' :
                            index === 2 ? 'bg-amber-700 text-white' :
                            'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}>
                            {index + 1}
                          </span>
                          <div>
                            <div className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                              {item.nomEleve}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              #{item.orderIndex || item.numeroEleve} • {item.sexe === 'F' ? 'أنثى' : 'ذكر'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="font-mono font-black text-sm sm:text-base text-teal-700 dark:text-teal-300">
                              {item.timeSec?.toFixed(2)} ثانية
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteResult(item.numeroEleve)}
                            className="p-1 text-gray-400 hover:text-red-500 transition"
                            title="مسح النتيجة"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-gray-400">
                    لم يتم تسجيل أي زمن في اختبار التوازن الثابت لهذا القسم بعد. ابدأ العداد وسجل توقيت المتسابقين!
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Untested Students */}
            {bottomTab === 'untested' && (
              <div className="p-3 sm:p-4 max-h-60 overflow-y-auto custom-scrollbar">
                {untestedStudents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {untestedStudents.map((student, idx) => {
                      const studentIdxInClass = students.findIndex(s => s.numeroEleve === student.numeroEleve);
                      const displayOrderNumber = student.orderIndex || (studentIdxInClass >= 0 ? studentIdxInClass + 1 : idx + 1);

                      return (
                        <div
                          key={student.numeroEleve}
                          onClick={() => handleAssignStudent(targetStation, student.numeroEleve)}
                          className="p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-200 dark:border-gray-600 flex items-center justify-between gap-2 cursor-pointer hover:border-teal-400"
                        >
                          <div className="flex items-center gap-2 truncate min-w-0">
                            <span className="w-7 h-7 rounded-xl bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-mono font-black text-xs flex items-center justify-center shrink-0">
                              #{displayOrderNumber}
                            </span>
                            <span className="font-bold text-xs truncate">
                              {student.nomEleve}
                            </span>
                          </div>
                          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold shrink-0">
                            + تعيين
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    🎉 رائع! جميع تلاميذ هذا القسم اجتازوا اختبار التوازن الثابت بنجاح!
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
          <div className="text-[11px] font-bold text-teal-700 dark:text-teal-300">
            ✓ حفظ تلقائي فوري لجميع قياسات التوازن الثابت في قاعدة البيانات
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-gray-200 dark:bg-gray-700 text-xs font-bold text-gray-800 dark:text-gray-200 hover:bg-gray-300 transition"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
