import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

let db: SQLite.SQLiteDatabase | null = null;

export async function initDB() {
  try {
    db = await SQLite.openDatabase({ name: 'vuka.db', location: 'default' });
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS alarm_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alarm_id TEXT NOT NULL,
        event TEXT NOT NULL,
        stage TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        result TEXT NOT NULL,
        confidence REAL DEFAULT 0
      );
    `);
    await db.executeSql(`
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
    console.log('Vuka DB initialized');
  } catch (e) {
    console.warn('DB init error:', e);
  }
}

export interface AlarmEventLog {
  alarmId: string;
  event: string;
  stage: string;
  result: string;
  confidence: number;
}

export async function logAlarmEvent(data: AlarmEventLog) {
  if (!db) return;
  try {
    await db.executeSql(
      `INSERT INTO alarm_events (alarm_id, event, stage, timestamp, result, confidence)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [data.alarmId, data.event, data.stage, new Date().toISOString(), data.result, data.confidence]
    );
  } catch (e) {
    console.warn('logAlarmEvent error:', e);
  }
}

export async function getSleepScores(): Promise<Array<{
  date: string; score: number; wake_time: string; set_time: string; attempts: number;
}>> {
  if (!db) return [];
  try {
    const [results] = await db.executeSql(
      'SELECT * FROM sleep_scores ORDER BY id DESC LIMIT 30;'
    );
    const rows = [];
    for (let i = 0; i < results.rows.length; i++) {
      rows.push(results.rows.item(i));
    }
    return rows;
  } catch {
    return [];
  }
}

export async function insertSleepScore(data: {
  date: string; score: number; wake_time: string; set_time: string;
  attempts: number; time_diff: number;
}) {
  if (!db) return;
  try {
    await db.executeSql(
      `INSERT INTO sleep_scores (date, score, wake_time, set_time, attempts, time_diff)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [data.date, data.score, data.wake_time, data.set_time, data.attempts, data.time_diff]
    );
  } catch (e) {
    console.warn('insertSleepScore error:', e);
  }
}
