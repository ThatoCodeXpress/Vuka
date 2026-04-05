import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Alert } from "react-native";
import { initDB, saveAlarmEvent, getAllAlarms, getAlarmHistory, saveSleepScore } from "@/lib/database";
import { AIVerifier } from "@/lib/aiVerifier";

export type AlarmStage = "idle" | "stage1" | "stage2" | "complete";

export interface Alarm {
  id: string;
  time: string;
  label: string;
  enabled: boolean;
  strictMode: boolean;
  secondaryInterval: number;
  sound: string;
  repeatDays: number[];
  verificationObject: string;
  verificationActivity: string;
}

export interface SleepScore {
  id: string;
  date: string;
  score: number;
  attempts: number;
  wakeTime: string;
  setTime: string;
  timeDiff: number;
}

export interface LibraryItem {
  id: string;
  label: string;
  type: "object" | "activity";
}

export interface HistoryEntry {
  id: string;
  date: string;
  alarmTime: string;
  wakeTime: string;
  stage: string;
  result: "pass" | "fail";
  confidence: number;
  sleepScore: number;
  attempts: number;
}

interface AlarmContextType {
  alarms: Alarm[];
  currentAlarm: Alarm | null;
  alarmStage: AlarmStage;
  activeAlarmId: string | null;
  sleepScores: SleepScore[];
  objectLibrary: LibraryItem[];
  activityLibrary: LibraryItem[];
  history: HistoryEntry[];
  currentObject: LibraryItem | null;
  currentActivity: LibraryItem | null;
  isVerifying: boolean;
  verificationResult: { passed: boolean; confidence: number } | null;
  attempts: number;
  addAlarm: (alarm: Omit<Alarm, "id">) => void;
  updateAlarm: (id: string, updates: Partial<Alarm>) => void;
  deleteAlarm: (id: string) => void;
  toggleAlarm: (id: string) => void;
  triggerAlarm: (alarmId: string) => void;
  dismissAlarm: () => void;
  verifyPhoto: (photoUri: string) => Promise<boolean>;
  addToLibrary: (item: Omit<LibraryItem, "id">) => void;
  removeFromLibrary: (id: string) => void;
  loadHistory: () => void;
  getWeeklyScores: () => SleepScore[];
}

const AlarmContext = createContext<AlarmContextType | null>(null);

const ALARMS_KEY = "@smart_alarm/alarms";
const OBJECT_LIB_KEY = "@smart_alarm/object_library";
const ACTIVITY_LIB_KEY = "@smart_alarm/activity_library";

const DEFAULT_OBJECTS: LibraryItem[] = [
  { id: "obj1", label: "Water Bottle", type: "object" },
  { id: "obj2", label: "Coffee Mug", type: "object" },
  { id: "obj3", label: "Book", type: "object" },
  { id: "obj4", label: "Keys", type: "object" },
  { id: "obj5", label: "Shoes", type: "object" },
];

const DEFAULT_ACTIVITIES: LibraryItem[] = [
  { id: "act1", label: "Brushing Teeth", type: "activity" },
  { id: "act2", label: "Eating Breakfast", type: "activity" },
  { id: "act3", label: "Making Bed", type: "activity" },
  { id: "act4", label: "Exercise", type: "activity" },
  { id: "act5", label: "Getting Dressed", type: "activity" },
];

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function calculateSleepScore(
  setTime: string,
  wakeTime: string,
  attempts: number,
  stage2Time: number
): number {
  const [sh, sm] = setTime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  const setMinutes = sh * 60 + sm;
  const wakeMinutes = wh * 60 + wm;
  let diff = wakeMinutes - setMinutes;
  if (diff < 0) diff += 24 * 60;

  let score = 100;
  score -= Math.min(30, diff * 0.5);
  score -= Math.min(30, (attempts - 1) * 10);
  const stage2Bonus = stage2Time > 0 && stage2Time <= 35 ? 10 : 0;
  score += stage2Bonus;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function AlarmProvider({ children }: { children: React.ReactNode }) {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [currentAlarm, setCurrentAlarm] = useState<Alarm | null>(null);
  const [alarmStage, setAlarmStage] = useState<AlarmStage>("idle");
  const [activeAlarmId, setActiveAlarmId] = useState<string | null>(null);
  const [sleepScores, setSleepScores] = useState<SleepScore[]>([]);
  const [objectLibrary, setObjectLibrary] = useState<LibraryItem[]>(DEFAULT_OBJECTS);
  const [activityLibrary, setActivityLibrary] = useState<LibraryItem[]>(DEFAULT_ACTIVITIES);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentObject, setCurrentObject] = useState<LibraryItem | null>(null);
  const [currentActivity, setCurrentActivity] = useState<LibraryItem | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ passed: boolean; confidence: number } | null>(null);
  const [attempts, setAttempts] = useState(0);
  const stage1StartTime = useRef<Date | null>(null);
  const alarmIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    initDB();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [alarmsStr, objLibStr, actLibStr] = await Promise.all([
        AsyncStorage.getItem(ALARMS_KEY),
        AsyncStorage.getItem(OBJECT_LIB_KEY),
        AsyncStorage.getItem(ACTIVITY_LIB_KEY),
      ]);
      if (alarmsStr) setAlarms(JSON.parse(alarmsStr));
      if (objLibStr) setObjectLibrary(JSON.parse(objLibStr));
      if (actLibStr) setActivityLibrary(JSON.parse(actLibStr));
      loadHistory();
    } catch (e) {
      console.warn("Error loading data:", e);
    }
  };

  const loadHistory = useCallback(async () => {
    try {
      const hist = await getAlarmHistory();
      setHistory(hist as HistoryEntry[]);
      const scores = await getAllAlarms();
      setSleepScores(scores as SleepScore[]);
    } catch (e) {
      console.warn("Error loading history:", e);
    }
  }, []);

  const saveAlarms = async (newAlarms: Alarm[]) => {
    await AsyncStorage.setItem(ALARMS_KEY, JSON.stringify(newAlarms));
  };

  const addAlarm = (alarmData: Omit<Alarm, "id">) => {
    const alarm: Alarm = { ...alarmData, id: generateId() };
    const updated = [...alarms, alarm];
    setAlarms(updated);
    saveAlarms(updated);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const updateAlarm = (id: string, updates: Partial<Alarm>) => {
    const updated = alarms.map((a) => (a.id === id ? { ...a, ...updates } : a));
    setAlarms(updated);
    saveAlarms(updated);
  };

  const deleteAlarm = (id: string) => {
    const updated = alarms.filter((a) => a.id !== id);
    setAlarms(updated);
    saveAlarms(updated);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const toggleAlarm = (id: string) => {
    updateAlarm(id, { enabled: !alarms.find((a) => a.id === id)?.enabled });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const triggerAlarm = useCallback((alarmId: string) => {
    const alarm = alarms.find((a) => a.id === alarmId);
    if (!alarm) return;
    setCurrentAlarm(alarm);
    setActiveAlarmId(alarmId);
    setAlarmStage("stage1");
    setAttempts(0);
    setVerificationResult(null);
    stage1StartTime.current = new Date();
    const objs = objectLibrary.length > 0 ? objectLibrary : DEFAULT_OBJECTS;
    const randomObj = objs[Math.floor(Math.random() * objs.length)];
    setCurrentObject(randomObj);
    const acts = activityLibrary.length > 0 ? activityLibrary : DEFAULT_ACTIVITIES;
    const randomAct = acts[Math.floor(Math.random() * acts.length)];
    setCurrentActivity(randomAct);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    saveAlarmEvent({
      alarmId,
      event: "triggered",
      stage: "stage1",
      timestamp: new Date().toISOString(),
      result: "pending",
      confidence: 0,
    });
  }, [alarms, objectLibrary, activityLibrary]);

  const verifyPhoto = useCallback(async (photoUri: string): Promise<boolean> => {
    setIsVerifying(true);
    setVerificationResult(null);
    setAttempts((prev) => prev + 1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const label = alarmStage === "stage1" ? currentObject?.label ?? "" : currentActivity?.label ?? "";
      const result = await AIVerifier.verify(photoUri, label);
      const passed = result.confidence >= 0.75;
      setVerificationResult({ passed, confidence: result.confidence });
      if (passed) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (alarmStage === "stage1") {
          await saveAlarmEvent({
            alarmId: activeAlarmId ?? "",
            event: "stage1_pass",
            stage: "stage1",
            timestamp: new Date().toISOString(),
            result: "pass",
            confidence: result.confidence,
          });
          setAlarmStage("stage2");
          setVerificationResult(null);
          setAttempts(0);
        } else {
          await saveAlarmEvent({
            alarmId: activeAlarmId ?? "",
            event: "stage2_pass",
            stage: "stage2",
            timestamp: new Date().toISOString(),
            result: "pass",
            confidence: result.confidence,
          });
          const now = new Date();
          const wakeTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
          const stage2Duration = stage1StartTime.current ? (now.getTime() - stage1StartTime.current.getTime()) / 60000 : 30;
          const score = calculateSleepScore(currentAlarm?.time ?? "00:00", wakeTime, attempts, stage2Duration);
          await saveSleepScore({
            date: now.toISOString().split("T")[0],
            score,
            wakeTime,
            setTime: currentAlarm?.time ?? "00:00",
            attempts,
            timeDiff: Math.round(stage2Duration),
          });
          setAlarmStage("complete");
          setSleepScores((prev) => [
            { id: generateId(), date: now.toISOString().split("T")[0], score, wakeTime, setTime: currentAlarm?.time ?? "00:00", attempts, timeDiff: Math.round(stage2Duration) },
            ...prev,
          ]);
          loadHistory();
        }
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        await saveAlarmEvent({
          alarmId: activeAlarmId ?? "",
          event: "verification_fail",
          stage: alarmStage,
          timestamp: new Date().toISOString(),
          result: "fail",
          confidence: result.confidence,
        });
      }
      return passed;
    } catch (e) {
      setVerificationResult({ passed: false, confidence: 0 });
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, [alarmStage, currentObject, currentActivity, activeAlarmId, currentAlarm, attempts, loadHistory]);

  const dismissAlarm = useCallback(() => {
    if (currentAlarm?.strictMode && alarmStage !== "complete") {
      Alert.alert("Strict Mode", "You must complete both verification stages to dismiss the alarm.");
      return;
    }
    setAlarmStage("idle");
    setCurrentAlarm(null);
    setActiveAlarmId(null);
    setCurrentObject(null);
    setCurrentActivity(null);
    setVerificationResult(null);
    setAttempts(0);
    if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
  }, [currentAlarm, alarmStage]);

  const addToLibrary = async (item: Omit<LibraryItem, "id">) => {
    const newItem: LibraryItem = { ...item, id: generateId() };
    if (item.type === "object") {
      const updated = [...objectLibrary, newItem];
      setObjectLibrary(updated);
      await AsyncStorage.setItem(OBJECT_LIB_KEY, JSON.stringify(updated));
    } else {
      const updated = [...activityLibrary, newItem];
      setActivityLibrary(updated);
      await AsyncStorage.setItem(ACTIVITY_LIB_KEY, JSON.stringify(updated));
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const removeFromLibrary = async (id: string) => {
    const updatedObj = objectLibrary.filter((i) => i.id !== id);
    const updatedAct = activityLibrary.filter((i) => i.id !== id);
    setObjectLibrary(updatedObj);
    setActivityLibrary(updatedAct);
    await AsyncStorage.setItem(OBJECT_LIB_KEY, JSON.stringify(updatedObj));
    await AsyncStorage.setItem(ACTIVITY_LIB_KEY, JSON.stringify(updatedAct));
  };

  const getWeeklyScores = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return sleepScores.filter((s) => new Date(s.date) >= oneWeekAgo).slice(0, 7);
  };

  return (
    <AlarmContext.Provider
      value={{
        alarms,
        currentAlarm,
        alarmStage,
        activeAlarmId,
        sleepScores,
        objectLibrary,
        activityLibrary,
        history,
        currentObject,
        currentActivity,
        isVerifying,
        verificationResult,
        attempts,
        addAlarm,
        updateAlarm,
        deleteAlarm,
        toggleAlarm,
        triggerAlarm,
        dismissAlarm,
        verifyPhoto,
        addToLibrary,
        removeFromLibrary,
        loadHistory,
        getWeeklyScores,
      }}
    >
      {children}
    </AlarmContext.Provider>
  );
}

export function useAlarm() {
  const ctx = useContext(AlarmContext);
  if (!ctx) throw new Error("useAlarm must be used inside AlarmProvider");
  return ctx;
}
