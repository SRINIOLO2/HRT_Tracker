// Simple i18n system — English default, easily extensible with locale JSON files

type TranslationKey = string;
type Translations = Record<TranslationKey, string>;

const en: Translations = {
  // Navigation
  'nav.dashboard': 'Dashboard',
  'nav.medications': 'Medications',
  'nav.bloodTests': 'Blood Tests',
  'nav.mood': 'Mood',
  'nav.goals': 'Goals',
  'nav.settings': 'Settings',

  // Dashboard
  'dashboard.title': 'Dashboard',
  'dashboard.welcome': 'Welcome back',
  'dashboard.nextDose': 'Next Dose',
  'dashboard.recentMood': 'Recent Mood',
  'dashboard.latestTest': 'Latest Blood Test',
  'dashboard.quickLog': 'Quick Log',
  'dashboard.noDoseScheduled': 'No dose scheduled',
  'dashboard.noMoodLogged': 'No mood logged yet',
  'dashboard.noTestResults': 'No test results yet',

  // Medications
  'meds.title': 'Medications',
  'meds.addNew': 'Add Medication',
  'meds.edit': 'Edit Medication',
  'meds.name': 'Medication Name',
  'meds.type': 'Type',
  'meds.dose': 'Dose',
  'meds.unit': 'Unit',
  'meds.route': 'Route',
  'meds.schedule': 'Schedule',
  'meds.logDose': 'Log Dose',
  'meds.markForgotten': 'Mark Forgotten',
  'meds.doseHistory': 'Dose History',
  'meds.taken': 'Taken',
  'meds.forgotten': 'Forgotten',
  'meds.active': 'Active',
  'meds.inactive': 'Inactive',

  // Blood Tests
  'blood.title': 'Blood Tests',
  'blood.addResult': 'Add Result',
  'blood.hormone': 'Hormone',
  'blood.value': 'Value',
  'blood.unit': 'Unit',
  'blood.date': 'Test Date',
  'blood.lab': 'Lab',
  'blood.referenceRange': 'Reference Range',
  'blood.trends': 'Trends',

  // Mood
  'mood.title': 'Mood Tracker',
  'mood.logEntry': 'Log Mood',
  'mood.mood': 'Mood',
  'mood.energy': 'Energy',
  'mood.notes': 'Notes',
  'mood.tags': 'Tags',
  'mood.history': 'Mood History',

  // Goals
  'goals.title': 'Goals',
  'goals.addNew': 'Add Goal',
  'goals.targetDate': 'Target Date',
  'goals.progress': 'Progress',
  'goals.category': 'Category',
  'goals.milestones': 'Milestones',
  'goals.completed': 'Completed',

  // Settings
  'settings.title': 'Settings',
  'settings.theme': 'Theme',
  'settings.language': 'Language',
  'settings.notifications': 'Notifications',
  'settings.export': 'Export Data',
  'settings.import': 'Import Data',
  'settings.security': 'Security',

  // Common
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.add': 'Add',
  'common.close': 'Close',
  'common.back': 'Back',
  'common.notes': 'Notes',
  'common.noData': 'No data yet',
  'common.loading': 'Loading...',
};

const locales: Record<string, Translations> = { en };
let currentLocale = 'en';

export function setLocale(locale: string) {
  if (locales[locale]) {
    currentLocale = locale;
  }
}

export function addLocale(locale: string, translations: Translations) {
  locales[locale] = { ...en, ...translations };
}

export function t(key: TranslationKey): string {
  return locales[currentLocale]?.[key] || locales.en[key] || key;
}

export function getLocale(): string {
  return currentLocale;
}

export function getAvailableLocales(): string[] {
  return Object.keys(locales);
}
