// src/utils/activityLogger.ts
const ACTIVITY_LOG_KEY = 'ielts_activity_log';
const MAX_LOG_ENTRIES = 5;

interface ActivityEntry {
  timestamp: string;
  message: string;
}

export const logActivity = (message: string): void => {
  const now = new Date();
  const newEntry: ActivityEntry = {
    timestamp: now.toISOString(),
    message: `${message} at ${now.toLocaleTimeString()}`,
  };
  let currentLog: ActivityEntry[] = [];
  const storedLog = localStorage.getItem(ACTIVITY_LOG_KEY);
  if (storedLog) {
    try {
      currentLog = JSON.parse(storedLog);
    } catch {
      currentLog = [];
    }
  }
  currentLog.unshift(newEntry);
  currentLog = currentLog.slice(0, MAX_LOG_ENTRIES);
  localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(currentLog));
};

export const getActivityLog = (): ActivityEntry[] => {
  const storedLog = localStorage.getItem(ACTIVITY_LOG_KEY);
  if (storedLog) {
    try {
      return JSON.parse(storedLog);
    } catch {
      return [];
    }
  }
  return [];
};