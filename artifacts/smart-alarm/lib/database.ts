import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";

let db: SQLite.SQLiteDatabase | null = null;

export function initDB() {
  if (Platform.OS === "web") {
    return;
  }
  try {
    db = SQLite.openDatabaseSync("smart_alarm.db");
    db.execSync(`
      CREATE TABLE IF NOT EXISTS alarm_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alarm_id TEXT NOT NULL,
        event TEXT NOT NULL,
        stage TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        result TEXT NOT NULL,
        confidence REAL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS sleep_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        score INTEGER NOT NULL,
        wake_time TEXT NOT NULL,
        set_time TEXT NOT NULL,
        attempts INTEGER DEFAULT 1,
        time_diff INTEGER DEFAULT 0
      );
    `);
    console.log("SQLite Database initialized");
  } catch (e) {
    console.warn("DB init error:", e);
  }
}

export interface AlarmEvent {
  alarmId: string;
  event: string;
  stage: string;
  timestamp: string;
  result: string;
  confidence: number;
}

export async function saveAlarmEvent(event: AlarmEvent): Promise<void> {
  if (!db) return;
  try {
    db.runSync(
      "INSERT INTO alarm_events (alarm_id, event, stage, timestamp, result, confidence) VALUES (?, ?, ?, ?, ?, ?)",
      [event.alarmId, event.event, event.stage, event.timestamp, event.result, event.confidence]
    );
  } catch (e) {
    console.warn("Error saving alarm event:", e);
  }
}

export interface SleepScoreData {
  date: string;
  score: number;
  wakeTime: string;
  setTime: string;
  attempts: number;
  timeDiff: number;
}

export async function saveSleepScore(data: SleepScoreData): Promise<void> {
  if (!db) return;
  try {
    db.runSync(
      "INSERT INTO sleep_scores (date, score, wake_time, set_time, attempts, time_diff) VALUES (?, ?, ?, ?, ?, ?)",
      [data.date, data.score, data.wakeTime, data.setTime, data.attempts, data.timeDiff]
    );
  } catch (e) {
    console.warn("Error saving sleep score:", e);
  }
}

export async function getAlarmHistory(): Promise<unknown[]> {
  if (!db) return [];
  try {
    const rows = db.getAllSync(
      "SELECT * FROM alarm_events ORDER BY timestamp DESC LIMIT 100"
    ) as Record<string, unknown>[];
    return rows.map((row) => ({
      id: String(row.id),
      date: String(row.timestamp).split("T")[0],
      alarmTime: String(row.timestamp),
      wakeTime: String(row.timestamp),
      stage: String(row.stage),
      result: row.result as "pass" | "fail",
      confidence: Number(row.confidence),
      sleepScore: 0,
      attempts: 1,
    }));
  } catch (e) {
    console.warn("Error getting alarm history:", e);
    return [];
  }
}

export async function getAllAlarms(): Promise<unknown[]> {
  if (!db) return [];
  try {
    const rows = db.getAllSync(
      "SELECT * FROM sleep_scores ORDER BY date DESC LIMIT 30"
    ) as Record<string, unknown>[];
    return rows.map((row) => ({
      id: String(row.id),
      date: String(row.date),
      score: Number(row.score),
      wakeTime: String(row.wake_time),
      setTime: String(row.set_time),
      attempts: Number(row.attempts),
      timeDiff: Number(row.time_diff),
    }));
  } catch (e) {
    console.warn("Error getting all alarms:", e);
    return [];
  }
}
