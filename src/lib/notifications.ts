export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return Promise.resolve('denied' as NotificationPermission);
  }
  return Notification.requestPermission();
}

export function sendNotification(title: string, body: string, tag?: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  new Notification(title, {
    body,
    tag: tag || 'hrt-tracker',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
  });
}

// Simple in-app schedule checker
// Stores scheduled times in localStorage and checks every minute
interface ScheduledReminder {
  medicationId: number;
  medicationName: string;
  time: string; // HH:MM
  intervalHours: number;
}

const REMINDERS_KEY = 'hrt-reminders';

export function getReminders(): ScheduledReminder[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(REMINDERS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function setReminders(reminders: ScheduledReminder[]) {
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
}

export function addReminder(reminder: ScheduledReminder) {
  const reminders = getReminders();
  const existing = reminders.findIndex(r => r.medicationId === reminder.medicationId);
  if (existing >= 0) {
    reminders[existing] = reminder;
  } else {
    reminders.push(reminder);
  }
  setReminders(reminders);
}

export function removeReminder(medicationId: number) {
  const reminders = getReminders().filter(r => r.medicationId !== medicationId);
  setReminders(reminders);
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startReminderChecker() {
  if (intervalId) return;

  intervalId = setInterval(() => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const reminders = getReminders();

    for (const reminder of reminders) {
      if (reminder.time === currentTime) {
        sendNotification(
          '💊 Medication Reminder',
          `Time to take ${reminder.medicationName}`,
          `med-${reminder.medicationId}`
        );
      }
    }
  }, 60000); // Check every minute
}

export function stopReminderChecker() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
