import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AIVerifier, VerificationResult } from '@/lib/aiVerifier';
import { initDB, logAlarmEvent } from '@/lib/database';

export interface Alarm {
  id: string;
  time: string;
  label: string;
  enabled: boolean;
  repeatDays: number[];
  strictMode: boolean;
  secondaryInterval: number;
  objectLibrary?: string[];
  activityLibrary?: string[];
}

export interface LibraryItem {
  id: string;
  label: string;
  type: 'object' | 'activity';
}

type AlarmStage = 'idle' | 'stage1' | 'stage2' | 'complete';

interface AlarmContextValue {
  alarms: Alarm[];
  alarmStage: AlarmStage;
  currentAlarm: Alarm | null;
  currentObject: LibraryItem | null;
  currentActivity: LibraryItem | null;
  verificationResult: VerificationResult | null;
  objectLibrary: LibraryItem[];
  activityLibrary: LibraryItem[];
  addAlarm: (a: Omit<Alarm, 'id'>) => void;
  updateAlarm: (id: string, updates: Partial<Alarm>) => void;
  deleteAlarm: (id: string) => void;
  triggerAlarm: (alarm: Alarm) => void;
  dismissAlarm: () => void;
  verifyPhoto: (imageUri: string) => Promise<void>;
  addLibraryItem: (item: Omit<LibraryItem, 'id'>) => void;
  removeLibraryItem: (id: string) => void;
}

const AlarmContext = createContext<AlarmContextValue | null>(null);

const DEFAULT_OBJECTS: LibraryItem[] = [
  { id: 'o1', label: 'Water Bottle', type: 'object' },
  { id: 'o2', label: 'Coffee Mug', type: 'object' },
  { id: 'o3', label: 'Book', type: 'object' },
  { id: 'o4', label: 'Keys', type: 'object' },
  { id: 'o5', label: 'Shoes', type: 'object' },
];

const DEFAULT_ACTIVITIES: LibraryItem[] = [
  { id: 'a1', label: 'Brushing Teeth', type: 'activity' },
  { id: 'a2', label: 'Eating Breakfast', type: 'activity' },
  { id: 'a3', label: 'Making Bed', type: 'activity' },
  { id: 'a4', label: 'Exercise', type: 'activity' },
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function AlarmProvider({ children }: { children: React.ReactNode }) {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [alarmStage, setAlarmStage] = useState<AlarmStage>('idle');
  const [currentAlarm, setCurrentAlarm] = useState<Alarm | null>(null);
  const [currentObject, setCurrentObject] = useState<LibraryItem | null>(null);
  const [currentActivity, setCurrentActivity] = useState<LibraryItem | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [objectLibrary, setObjectLibrary] = useState<LibraryItem[]>(DEFAULT_OBJECTS);
  const [activityLibrary, setActivityLibrary] = useState<LibraryItem[]>(DEFAULT_ACTIVITIES);
  const stage2TimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    initDB();
    AsyncStorage.getItem('@vuka/alarms').then(raw => {
      if (raw) setAlarms(JSON.parse(raw));
    });
    AsyncStorage.getItem('@vuka/objects').then(raw => {
      if (raw) setObjectLibrary(JSON.parse(raw));
    });
    AsyncStorage.getItem('@vuka/activities').then(raw => {
      if (raw) setActivityLibrary(JSON.parse(raw));
    });
  }, []);

  const saveAlarms = (next: Alarm[]) => {
    setAlarms(next);
    AsyncStorage.setItem('@vuka/alarms', JSON.stringify(next));
  };

  const addAlarm = useCallback((data: Omit<Alarm, 'id'>) => {
    const next = [...alarms, { ...data, id: Date.now().toString() }];
    saveAlarms(next);
  }, [alarms]);

  const updateAlarm = useCallback((id: string, updates: Partial<Alarm>) => {
    saveAlarms(alarms.map(a => a.id === id ? { ...a, ...updates } : a));
  }, [alarms]);

  const deleteAlarm = useCallback((id: string) => {
    saveAlarms(alarms.filter(a => a.id !== id));
  }, [alarms]);

  const triggerAlarm = useCallback((alarm: Alarm) => {
    const obj = pickRandom(objectLibrary);
    const act = pickRandom(activityLibrary);
    setCurrentAlarm(alarm);
    setCurrentObject(obj);
    setCurrentActivity(act);
    setVerificationResult(null);
    setAlarmStage('stage1');
  }, [objectLibrary, activityLibrary]);

  const dismissAlarm = useCallback(() => {
    if (stage2TimerRef.current) clearTimeout(stage2TimerRef.current);
    setAlarmStage('idle');
    setCurrentAlarm(null);
    setCurrentObject(null);
    setCurrentActivity(null);
    setVerificationResult(null);
  }, []);

  const verifyPhoto = useCallback(async (imageUri: string) => {
    const target = alarmStage === 'stage1'
      ? (currentObject?.label ?? 'Object')
      : (currentActivity?.label ?? 'Activity');

    const result = await AIVerifier.verify(imageUri, target);
    setVerificationResult(result);

    if (result.passed) {
      if (alarmStage === 'stage1') {
        logAlarmEvent({
          alarmId: currentAlarm?.id ?? '',
          event: 'stage1_pass',
          stage: 'stage1',
          result: 'pass',
          confidence: result.confidence,
        });
        const interval = (currentAlarm?.secondaryInterval ?? 30) * 60 * 1000;
        stage2TimerRef.current = setTimeout(() => setAlarmStage('stage2'), interval);
        setAlarmStage('idle');
      } else if (alarmStage === 'stage2') {
        logAlarmEvent({
          alarmId: currentAlarm?.id ?? '',
          event: 'stage2_pass',
          stage: 'stage2',
          result: 'pass',
          confidence: result.confidence,
        });
        setAlarmStage('complete');
      }
    } else {
      logAlarmEvent({
        alarmId: currentAlarm?.id ?? '',
        event: alarmStage === 'stage1' ? 'stage1_fail' : 'stage2_fail',
        stage: alarmStage,
        result: 'fail',
        confidence: result.confidence,
      });
    }
  }, [alarmStage, currentObject, currentActivity, currentAlarm]);

  const addLibraryItem = useCallback((item: Omit<LibraryItem, 'id'>) => {
    const newItem = { ...item, id: Date.now().toString() };
    if (item.type === 'object') {
      const next = [...objectLibrary, newItem];
      setObjectLibrary(next);
      AsyncStorage.setItem('@vuka/objects', JSON.stringify(next));
    } else {
      const next = [...activityLibrary, newItem];
      setActivityLibrary(next);
      AsyncStorage.setItem('@vuka/activities', JSON.stringify(next));
    }
  }, [objectLibrary, activityLibrary]);

  const removeLibraryItem = useCallback((id: string) => {
    const nextObj = objectLibrary.filter(i => i.id !== id);
    const nextAct = activityLibrary.filter(i => i.id !== id);
    setObjectLibrary(nextObj);
    setActivityLibrary(nextAct);
    AsyncStorage.setItem('@vuka/objects', JSON.stringify(nextObj));
    AsyncStorage.setItem('@vuka/activities', JSON.stringify(nextAct));
  }, [objectLibrary, activityLibrary]);

  return (
    <AlarmContext.Provider value={{
      alarms, alarmStage, currentAlarm, currentObject, currentActivity,
      verificationResult, objectLibrary, activityLibrary,
      addAlarm, updateAlarm, deleteAlarm, triggerAlarm, dismissAlarm,
      verifyPhoto, addLibraryItem, removeLibraryItem,
    }}>
      {children}
    </AlarmContext.Provider>
  );
}

export function useAlarm() {
  const ctx = useContext(AlarmContext);
  if (!ctx) throw new Error('useAlarm must be inside AlarmProvider');
  return ctx;
}
