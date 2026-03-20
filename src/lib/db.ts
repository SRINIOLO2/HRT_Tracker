import Dexie, { type EntityTable } from 'dexie';

// ─── Interfaces ─────────────────────────────────────────────

export interface Medication {
  id?: number;
  name: string;
  type: string; // e.g. 'Estradiol', 'Testosterone', 'Progesterone', 'Spironolactone', etc.
  defaultDose: number;
  defaultUnit: string; // 'mg', 'ml', 'mcg', 'patch', 'pump'
  route: string; // 'oral', 'sublingual', 'injection', 'transdermal', 'topical'
  color: string; // hex color for UI identification
  scheduleHours: number; // calculated interval in hours between doses (kept for backward compatibility and math)
  scheduleUnit?: string; // 'hours', 'days'
  scheduleTime: string; // preferred time HH:MM
  active: boolean;
  notes: string;
  createdAt: number; // timestamp
}

export interface DoseLog {
  id?: number;
  medicationId: number;
  medicationName: string; // snapshot at log time
  dose: number;
  unit: string;
  route: string;
  takenAt: number; // timestamp
  forgotten: boolean;
  late: boolean;
  notes: string;
}

export interface BloodTest {
  id?: number;
  testDate: number; // timestamp
  hormone: string; // 'Estradiol', 'Testosterone', 'Progesterone', 'SHBG', 'LH', 'FSH', etc.
  value: number;
  unit: string; // 'pg/mL', 'ng/dL', 'nmol/L', etc.
  referenceMin?: number;
  referenceMax?: number;
  lab: string;
  notes: string;
  createdAt: number;
}

export interface MoodEntry {
  id?: number;
  date: string; // YYYY-MM-DD
  mood: number; // 1-5
  energy: number; // 1-5
  notes: string;
  tags: string[]; // e.g. ['anxious', 'happy', 'tired', 'focused']
  createdAt: number;
}

export interface Goal {
  id?: number;
  title: string;
  description: string;
  targetDate: number; // timestamp
  category: string; // 'physical', 'mental', 'social', 'medical', 'milestone'
  progress: number; // 0-100
  milestones: GoalMilestone[];
  completed: boolean;
  createdAt: number;
}

export interface GoalMilestone {
  title: string;
  targetDate: number;
  completed: boolean;
  completedAt?: number;
}

export interface LifeEvent {
  id?: number;
  title: string;
  date: number; // timestamp
  category: string; // 'medical', 'medication-change', 'surgical', 'milestone', 'personal', 'other'
  description: string;
  isRecurring: boolean;
  recurringType?: string; // 'yearly'
  notifyOnAnniversary: boolean;
  createdAt: number;
}

export interface AppSetting {
  id?: number;
  key: string;
  value: string;
}

// ─── Database ───────────────────────────────────────────────

class HRTDatabase extends Dexie {
  medications!: EntityTable<Medication, 'id'>;
  doseLogs!: EntityTable<DoseLog, 'id'>;
  bloodTests!: EntityTable<BloodTest, 'id'>;
  moods!: EntityTable<MoodEntry, 'id'>;
  goals!: EntityTable<Goal, 'id'>;
  events!: EntityTable<LifeEvent, 'id'>;
  settings!: EntityTable<AppSetting, 'id'>;

  constructor() {
    super('HRTTracker');

    this.version(1).stores({
      medications: '++id, name, type, active, createdAt',
      doseLogs: '++id, medicationId, takenAt, forgotten',
      bloodTests: '++id, testDate, hormone, createdAt',
      moods: '++id, date, mood, createdAt',
      goals: '++id, targetDate, category, completed, createdAt',
      settings: '++id, &key',
    });

    this.version(2).stores({
      medications: '++id, name, type, active, createdAt',
      doseLogs: '++id, medicationId, takenAt, forgotten',
      bloodTests: '++id, testDate, hormone, createdAt',
      moods: '++id, date, mood, createdAt',
      goals: '++id, targetDate, category, completed, createdAt',
      events: '++id, date, category, createdAt',
      settings: '++id, &key',
    });
  }
}

export const db = new HRTDatabase();

// ─── Helpers ────────────────────────────────────────────────

export async function getSetting(key: string): Promise<string | undefined> {
  const setting = await db.settings.where('key').equals(key).first();
  return setting?.value;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const existing = await db.settings.where('key').equals(key).first();
  if (existing) {
    await db.settings.update(existing.id!, { value });
  } else {
    await db.settings.add({ key, value });
  }
}

export async function exportAllData(): Promise<string> {
  const data = {
    version: 2,
    exportedAt: Date.now(),
    medications: await db.medications.toArray(),
    doseLogs: await db.doseLogs.toArray(),
    bloodTests: await db.bloodTests.toArray(),
    moods: await db.moods.toArray(),
    goals: await db.goals.toArray(),
    events: await db.events.toArray(),
    settings: await db.settings.toArray(),
  };
  return JSON.stringify(data, null, 2);
}

export async function importAllData(jsonString: string): Promise<void> {
  const data = JSON.parse(jsonString);
  if (!data.version) throw new Error('Invalid backup file');

  await db.transaction('rw', [db.medications, db.doseLogs, db.bloodTests, db.moods, db.goals, db.events, db.settings], async () => {
    await db.medications.clear();
    await db.doseLogs.clear();
    await db.bloodTests.clear();
    await db.moods.clear();
    await db.goals.clear();
    await db.events.clear();
    await db.settings.clear();

    if (data.medications?.length) await db.medications.bulkAdd(data.medications.map((m: Medication) => { const { id, ...rest } = m; return rest; }));
    if (data.doseLogs?.length) await db.doseLogs.bulkAdd(data.doseLogs.map((d: DoseLog) => { const { id, ...rest } = d; return rest; }));
    if (data.bloodTests?.length) await db.bloodTests.bulkAdd(data.bloodTests.map((b: BloodTest) => { const { id, ...rest } = b; return rest; }));
    if (data.moods?.length) await db.moods.bulkAdd(data.moods.map((m: MoodEntry) => { const { id, ...rest } = m; return rest; }));
    if (data.goals?.length) await db.goals.bulkAdd(data.goals.map((g: Goal) => { const { id, ...rest } = g; return rest; }));
    if (data.events?.length) await db.events.bulkAdd(data.events.map((e: LifeEvent) => { const { id, ...rest } = e; return rest; }));
    if (data.settings?.length) await db.settings.bulkAdd(data.settings.map((s: AppSetting) => { const { id, ...rest } = s; return rest; }));
  });
}
