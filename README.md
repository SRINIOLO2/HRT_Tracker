# HRT Tracker

A privacy-first, offline-capable health tracking app for hormone medication management.

**Version:** 1.0.1

---

## 🌟 Features

- **Medication Tracking** — Log doses of any hormone medication (estrogen, testosterone, progesterone, etc.) across all delivery methods: pills, patches, injections, gels, and more
- **Blood Test Results** — Track any hormone level over time with interactive charts. Enter any hormone name — no fixed lists
- **Mood & Energy** — Daily mood and energy logging with tags and trend visualization
- **Goals** — Set personal goals with progress bars, milestones, and target dates
- **Timeline** — Record life events (starting HRT, doctor changes, surgeries) with anniversary reminders
- **Data Export/Import** — Full JSON backup and restore of all your data
- **Dark Mode** — Light, dark, and system-matched themes

## 🔒 Privacy

**All data stays on your device.** HRT Tracker uses IndexedDB (via Dexie.js) for local storage. Nothing is ever sent to any server. There are no accounts, no analytics, no tracking.

## 🤝 Inclusivity

This app is designed for **everyone** who tracks hormone medications — regardless of gender identity or expression:

- No gendered language or assumptions
- No preset "typical" ranges based on sex or gender — you set your own goals and reference ranges
- Hormone and medication options are open-ended, not limited to a fixed list

## 🛠 Tech Stack

| Technology | Why | Alternatives Considered |
|---|---|---|
| **Next.js 14** | Static HTML export for offline PWA deployment. App Router gives clean file-based routing. Huge React ecosystem. | Vite + React (lighter but no built-in SSG routing), SvelteKit, Remix |
| **TypeScript** | Type safety for health data interfaces. Catches data-shape bugs at compile time, which matters for medical-adjacent data. | Plain JavaScript (less safe for structured health data) |
| **Dexie.js (IndexedDB)** | All data stays on-device for privacy. Works completely offline. No server needed. Supports complex queries and schema migrations. | localStorage (5MB limit, no indexing), SQLite via WASM (heavier bundle), PouchDB (sync-focused, more complex) |
| **Recharts** | React-native composable charting library. Great for time-series data like hormone levels and mood trends. | Chart.js (requires React wrapper), D3 (powerful but steep learning curve), Nivo (heavier) |
| **date-fns** | Tree-shakeable date utilities. Only imports what's used. | Moment.js (deprecated, large bundle), Luxon, dayjs |
| **Lucide React** | Clean, consistent icon set with treeshaking. | Heroicons, Phosphor, Font Awesome (larger) |

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Dashboard
│   ├── medications/        # Medication management
│   ├── blood-tests/        # Blood test results & charts
│   ├── mood/               # Mood & energy tracking
│   ├── goals/              # Personal goals
│   ├── events/             # Life event timeline
│   └── settings/           # App settings
├── components/
│   ├── AppShell.tsx         # Layout with responsive nav
│   ├── ThemeProvider.tsx    # Light/dark theme context
│   └── charts/             # Recharts visualizations
└── lib/
    ├── db.ts               # Dexie.js database & models
    ├── i18n.ts             # Internationalization scaffold
    └── notifications.ts    # Browser notification API
```

## 🚀 Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production (static export)
npm run build
```

## 📋 Changelog

### v1.0.1

- **Dashboard Customization:** Added layout reordering (drag & drop) and visibility toggles for sections
- **CSV Data Management:** Implemented CSV Export and Import for all logs (including a downloadable template)
- **Graph Synchronization:** Added optional timeline locking for Hormone and Mood trend graphs
- **Batch Deletion:** New global "Batch Mode" toggle in settings to enable safety-first bulk removal across all trackers
- **UI Improvements:** Enhanced visibility for forgotten doses and fixed dark mode contrast issues
- **Medication Cadence:** Added support for flexible days/hours scheduling (e.g., "3.5 days")
- **GitHub Integration:** Linked app version in Settings to official GitHub repository releases

### v0.2.0

- Added Events/Timeline page with anniversary reminders
- Moved theme toggle from sidebar to Settings
- Added gel and patch as medication delivery routes
- Made hormone input open-ended (type any hormone name)
- Removed all gendered language
- Created README with tech rationale

### v0.1.0

- Initial build: Dashboard, Medications, Blood Tests, Mood, Goals, Settings
- Dexie.js database with offline-first architecture
- Recharts visualizations for hormone levels and mood trends
- Light/dark theme support
- Data export/import (JSON)
- PWA manifest

## 📜 License

Open source — made with ❤️
