'use client';

import React, { useState, useRef, useEffect } from 'react';
import pkg from '../../../package.json';
import { useTheme } from '@/components/ThemeProvider';
import { exportAllData, importAllData, db } from '@/lib/db';
import { generateCSV, parseCSV } from '@/lib/csv';
import { requestNotificationPermission } from '@/lib/notifications';
import { format } from 'date-fns';
import {
  Sun, Moon, Monitor, Download, Upload, Bell, Shield, Globe, Info, FileText, ToggleLeft, ToggleRight
} from 'lucide-react';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [notifStatus, setNotifStatus] = useState<string>('');
  const [importStatus, setImportStatus] = useState<string>('');
  const [batchDelete, setBatchDelete] = useState(false);
  const [syncGraphs, setSyncGraphs] = useState(false);
  const [csvDataType, setCsvDataType] = useState<'doses' | 'blood' | 'mood' | 'events' | 'goals'>('doses');
  const [enabledModules, setEnabledModules] = useState({
    bloodTests: true,
    mood: true,
    goals: true,
    events: true,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBatchDelete(localStorage.getItem('hrt_batch_delete') === 'true');
    setSyncGraphs(localStorage.getItem('hrt_sync_graphs') === 'true');
    setEnabledModules({
      bloodTests: localStorage.getItem('hrt_enable_blood_tests') !== 'false',
      mood: localStorage.getItem('hrt_enable_mood') !== 'false',
      goals: localStorage.getItem('hrt_enable_goals') !== 'false',
      events: localStorage.getItem('hrt_enable_events') !== 'false',
    });
  }, []);

  function toggleModule(mod: keyof typeof enabledModules) {
    const newVal = !enabledModules[mod];
    setEnabledModules(prev => ({ ...prev, [mod]: newVal }));
    
    const keyMap = {
      bloodTests: 'hrt_enable_blood_tests',
      mood: 'hrt_enable_mood',
      goals: 'hrt_enable_goals',
      events: 'hrt_enable_events'
    };
    
    localStorage.setItem(keyMap[mod], String(newVal));
    window.dispatchEvent(new Event('hrt_settings_changed'));
  }

  function toggleBatchDelete() {
    const newVal = !batchDelete;
    setBatchDelete(newVal);
    localStorage.setItem('hrt_batch_delete', String(newVal));
  }

  function toggleSyncGraphs() {
    const newVal = !syncGraphs;
    setSyncGraphs(newVal);
    localStorage.setItem('hrt_sync_graphs', String(newVal));
  }

  async function handleExport() {
    try {
      const data = await exportAllData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hrt-tracker-v${pkg.version}-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('This will replace ALL existing data. Are you sure?')) {
      e.target.value = '';
      return;
    }

    try {
      const text = await file.text();
      await importAllData(text);
      setImportStatus('✓ Data imported successfully!');
      setTimeout(() => setImportStatus(''), 3000);
    } catch (err) {
      setImportStatus('✗ Import failed. Invalid backup file.');
      setTimeout(() => setImportStatus(''), 3000);
    }
    e.target.value = '';
  }

  async function handleNotificationPermission() {
    const permission = await requestNotificationPermission();
    setNotifStatus(permission === 'granted' ? '✓ Notifications enabled!' : '✗ Notifications blocked. Check browser settings.');
    setTimeout(() => setNotifStatus(''), 3000);
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Customize your experience</p>
      </div>

      {/* Theme */}
      <div className="card mb-16">
        <div className="card-header">
          <h3 className="card-title">Appearance</h3>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTheme('light')}
          >
            <Sun size={16} /> Light
          </button>
          <button
            className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTheme('dark')}
          >
            <Moon size={16} /> Dark
          </button>
          <button
            className={`btn ${theme === 'system' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTheme('system')}
          >
            <Monitor size={16} /> System
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="card mb-16">
        <div className="card-header">
          <h3 className="card-title">Notifications</h3>
        </div>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          Enable browser notifications to receive medication reminders.
        </p>
        <button className="btn btn-secondary" onClick={handleNotificationPermission}>
          <Bell size={16} /> Enable Notifications
        </button>
        {notifStatus && (
          <p className="mt-8" style={{ fontSize: 'var(--font-size-sm)', color: notifStatus.startsWith('✓') ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
            {notifStatus}
          </p>
        )}
      </div>

      {/* Modules */}
      <div className="card mb-16">
        <div className="card-header">
          <h3 className="card-title">Features & Modules</h3>
        </div>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Enable or disable features to keep your interface clean and focused. Options disabled here are hidden from the sidebar but data is retained.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { id: 'bloodTests', label: 'Blood Tests', desc: 'Track hormone and lab results' },
            { id: 'mood', label: 'Mood Tracking', desc: 'Track daily mood, energy, and symptoms' },
            { id: 'goals', label: 'Goals & Milestones', desc: 'Set and track transition goals' },
            { id: 'events', label: 'Life Events Timeline', desc: 'Record important transition milestones' }
          ].map(mod => (
            <div key={mod.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 500 }}>{mod.label}</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>{mod.desc}</div>
              </div>
              <button 
                className="btn btn-ghost btn-icon" 
                onClick={() => toggleModule(mod.id as keyof typeof enabledModules)} 
                style={{ color: enabledModules[mod.id as keyof typeof enabledModules] ? 'var(--accent-success)' : 'var(--text-tertiary)' }}
              >
                {enabledModules[mod.id as keyof typeof enabledModules] ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Data Management */}
      <div className="card mb-16">
        <div className="card-header">
          <h3 className="card-title">Data Management</h3>
        </div>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          <strong>JSON Backup</strong> includes all app data, settings, and customizations. Use this to backup or restore your entire app.<br />
          <strong>CSV Export</strong> is for human-readable records and manual data entry in spreadsheet apps.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 500 }}>Enable Batch Deletion</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>Allow deleting multiple records at once across the app.</div>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={toggleBatchDelete} style={{ color: batchDelete ? 'var(--accent-success)' : 'var(--text-tertiary)' }}>
              {batchDelete ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 500 }}>Sync Graph Timelines</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>Align all charts in the app to display the exact same date range.</div>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={toggleSyncGraphs} style={{ color: syncGraphs ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}>
              {syncGraphs ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '16px', paddingBottom: '16px' }}>
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={16} /> Export Backup (JSON)
          </button>
          <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} /> Import Backup (JSON)
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '16px', alignItems: 'center' }}>
          <select 
            className="input" 
            value={csvDataType} 
            onChange={(e) => setCsvDataType(e.target.value as any)}
            style={{ padding: '8px', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            <option value="doses">Dose Logs</option>
            <option value="blood">Blood Tests</option>
            <option value="mood">Mood Logs</option>
            <option value="events">Events</option>
            <option value="goals">Goals</option>
          </select>

          <button className="btn btn-ghost" onClick={() => {
            let content = '';
            let filename = '';
            if (csvDataType === 'doses') {
              content = "medicationName,dose,unit,route,takenAtDate,takenAtTime,notes,forgotten\nEstradiol,2,mg,oral,2023-10-01,09:00,,false";
              filename = "hrt-doses-template.csv";
            } else if (csvDataType === 'blood') {
              content = "testDate,hormone,value,unit,lab,notes\n2023-10-01,Estradiol,200,pg/mL,Quest,";
              filename = "hrt-blood-tests-template.csv";
            } else if (csvDataType === 'mood') {
              content = "date,mood,energy,notes,tags\n2023-10-01,4,3,Felt good today,happy;focused";
              filename = "hrt-mood-template.csv";
            } else if (csvDataType === 'events') {
              content = "title,date,category,description\nStarted HRT,2023-10-01,medical,";
              filename = "hrt-events-template.csv";
            } else if (csvDataType === 'goals') {
              content = "title,description,targetDate,category,progress,completed\nStart HRT,Find an endo,2023-10-01,medical,100,true";
              filename = "hrt-goals-template.csv";
            }
            
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([content], { type: 'text/csv' }));
            a.download = filename;
            a.click();
          }}>
            <FileText size={16} /> Template
          </button>
          
          <button className="btn btn-ghost" onClick={async () => {
            try {
              let csvData: any[] = [];
              let headers: string[] = [];
              let filename = '';

              if (csvDataType === 'doses') {
                const logs = await db.doseLogs.toArray();
                csvData = logs.map((l: any) => {
                  const d = new Date(l.takenAt);
                  return {
                    medicationName: l.medicationName,
                    dose: l.dose,
                    unit: l.unit,
                    route: l.route,
                    takenAtDate: format(d, 'yyyy-MM-dd'),
                    takenAtTime: format(d, 'HH:mm'),
                    notes: l.notes || '',
                    forgotten: l.forgotten ? 'true' : 'false'
                  };
                });
                headers = ['medicationName', 'dose', 'unit', 'route', 'takenAtDate', 'takenAtTime', 'notes', 'forgotten'];
                filename = `hrt-doses-v${pkg.version}-${new Date().toISOString().split('T')[0]}.csv`;
              } else if (csvDataType === 'blood') {
                const tests = await db.bloodTests.toArray();
                csvData = tests.map((t: any) => ({
                  testDate: format(new Date(t.testDate), 'yyyy-MM-dd'),
                  hormone: t.hormone,
                  value: t.value,
                  unit: t.unit,
                  lab: t.lab || '',
                  notes: t.notes || ''
                }));
                headers = ['testDate', 'hormone', 'value', 'unit', 'lab', 'notes'];
                filename = `hrt-blood-tests-v${pkg.version}-${new Date().toISOString().split('T')[0]}.csv`;
              } else if (csvDataType === 'mood') {
                const moods = await db.moods.toArray();
                csvData = moods.map((m: any) => ({
                  date: m.date,
                  mood: m.mood,
                  energy: m.energy,
                  notes: m.notes || '',
                  tags: Array.isArray(m.tags) ? m.tags.join(';') : ''
                }));
                headers = ['date', 'mood', 'energy', 'notes', 'tags'];
                filename = `hrt-mood-v${pkg.version}-${new Date().toISOString().split('T')[0]}.csv`;
              } else if (csvDataType === 'events') {
                const events = await db.events.toArray();
                csvData = events.map((e: any) => ({
                  title: e.title,
                  date: format(new Date(e.date), 'yyyy-MM-dd'),
                  category: e.category,
                  description: e.description || ''
                }));
                headers = ['title', 'date', 'category', 'description'];
                filename = `hrt-events-v${pkg.version}-${new Date().toISOString().split('T')[0]}.csv`;
              } else if (csvDataType === 'goals') {
                const goals = await db.goals.toArray();
                csvData = goals.map((g: any) => ({
                  title: g.title,
                  description: g.description || '',
                  targetDate: format(new Date(g.targetDate), 'yyyy-MM-dd'),
                  category: g.category,
                  progress: g.progress,
                  completed: g.completed ? 'true' : 'false'
                }));
                headers = ['title', 'description', 'targetDate', 'category', 'progress', 'completed'];
                filename = `hrt-goals-v${pkg.version}-${new Date().toISOString().split('T')[0]}.csv`;
              }

              const csvContent = generateCSV(csvData, headers);
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = filename;
              a.click();
              URL.revokeObjectURL(url);
            } catch (err) {
              console.error('CSV Export failed:', err);
            }
          }}>
            <Download size={16} /> Export
          </button>

          <button className="btn btn-ghost" onClick={() => csvFileInputRef.current?.click()}>
            <Upload size={16} /> Import
          </button>
          <input ref={csvFileInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            if (!confirm(`This will import records into ${csvDataType.toUpperCase()}. Ensure the format matches the template.`)) {
              e.target.value = '';
              return;
            }

            try {
              const text = await file.text();
              const records = parseCSV(text);
              if (records.length === 0) throw new Error('Empty CSV');

              if (csvDataType === 'doses') {
                const meds = (await db.medications.toArray()).reduce((acc: any, m: any) => {
                  acc[m.name.toLowerCase()] = m.id!;
                  return acc;
                }, {} as Record<string, number>);

                const newDoses = [];
                for (const rec of records) {
                  if (!rec.medicationName || !rec.takenAtDate || !rec.takenAtTime) continue;
                  
                  let medId = meds[rec.medicationName.toLowerCase()];
                  if (!medId) {
                    const newMId = await db.medications.add({
                      name: rec.medicationName,
                      type: rec.medicationName,
                      defaultDose: parseFloat(rec.dose) || 0,
                      defaultUnit: rec.unit || 'mg',
                      route: rec.route || 'oral',
                      color: '#9ba1bc',
                      scheduleHours: 12,
                      scheduleUnit: 'hours',
                      scheduleTime: '09:00',
                      active: true,
                      notes: 'Imported from CSV',
                      createdAt: Date.now()
                    });
                    meds[rec.medicationName.toLowerCase()] = newMId;
                    medId = newMId as number;
                  }

                  const dateStr = `${rec.takenAtDate}T${rec.takenAtTime}`;
                  let timestamp = Date.now();
                  try {
                    timestamp = new Date(dateStr).getTime();
                    if (isNaN(timestamp)) timestamp = Date.now();
                  } catch (err) { }

                  newDoses.push({
                    medicationId: medId,
                    medicationName: rec.medicationName,
                    dose: parseFloat(rec.dose) || 0,
                    unit: rec.unit || 'mg',
                    route: rec.route || 'oral',
                    takenAt: timestamp,
                    forgotten: String(rec.forgotten).toLowerCase() === 'true',
                    late: false,
                    notes: rec.notes || ''
                  });
                }
                if (newDoses.length > 0) {
                  await db.doseLogs.bulkAdd(newDoses);
                }
                setImportStatus(`✓ Imported ${newDoses.length} dose records!`);

              } else if (csvDataType === 'blood') {
                const newTests = [];
                for (const rec of records) {
                  if (!rec.testDate || !rec.hormone || !rec.value) continue;
                  
                  let timestamp = Date.now();
                  try {
                    timestamp = new Date(`${rec.testDate}T00:00:00`).getTime();
                    if (isNaN(timestamp)) timestamp = Date.now();
                  } catch (err) {}

                  newTests.push({
                    testDate: timestamp,
                    hormone: rec.hormone,
                    value: parseFloat(rec.value) || 0,
                    unit: rec.unit || '',
                    lab: rec.lab || '',
                    notes: rec.notes || '',
                    createdAt: Date.now()
                  });
                }
                if (newTests.length > 0) {
                  await db.bloodTests.bulkAdd(newTests);
                }
                setImportStatus(`✓ Imported ${newTests.length} blood test records!`);

              } else if (csvDataType === 'mood') {
                const newMoods = [];
                for (const rec of records) {
                  if (!rec.date || !rec.mood) continue;
                  newMoods.push({
                    date: rec.date,
                    mood: parseInt(rec.mood) || 3,
                    energy: parseInt(rec.energy) || 3,
                    notes: rec.notes || '',
                    tags: rec.tags ? rec.tags.split(';').filter(Boolean) : [],
                    createdAt: Date.now()
                  });
                }
                if (newMoods.length > 0) {
                  await db.moods.bulkAdd(newMoods);
                }
                setImportStatus(`✓ Imported ${newMoods.length} mood records!`);

              } else if (csvDataType === 'events') {
                const newEvents = [];
                for (const rec of records) {
                  if (!rec.title || !rec.date || !rec.category) continue;
                  
                  let timestamp = Date.now();
                  try {
                    timestamp = new Date(`${rec.date}T00:00:00`).getTime();
                    if (isNaN(timestamp)) timestamp = Date.now();
                  } catch(e) {}
                  
                  newEvents.push({
                    title: rec.title,
                    date: timestamp,
                    category: rec.category,
                    description: rec.description || '',
                    isRecurring: false,
                    notifyOnAnniversary: false,
                    createdAt: Date.now()
                  });
                }
                if (newEvents.length > 0) {
                  await db.events.bulkAdd(newEvents);
                }
                setImportStatus(`✓ Imported ${newEvents.length} life events!`);

              } else if (csvDataType === 'goals') {
                const newGoals = [];
                for (const rec of records) {
                  if (!rec.title || !rec.targetDate) continue;

                  let timestamp = Date.now();
                  try {
                    timestamp = new Date(`${rec.targetDate}T00:00:00`).getTime();
                    if (isNaN(timestamp)) timestamp = Date.now();
                  } catch(e) {}

                  newGoals.push({
                    title: rec.title,
                    description: rec.description || '',
                    targetDate: timestamp,
                    category: rec.category || 'medical',
                    progress: parseInt(rec.progress) || 0,
                    completed: String(rec.completed).toLowerCase() === 'true',
                    milestones: [],
                    createdAt: Date.now()
                  });
                }
                if (newGoals.length > 0) {
                  await db.goals.bulkAdd(newGoals);
                }
                setImportStatus(`✓ Imported ${newGoals.length} goals!`);
              }

              setTimeout(() => setImportStatus(''), 4000);
            } catch (err) {
              console.error(err);
              setImportStatus('✗ CSV Import failed. Check format.');
              setTimeout(() => setImportStatus(''), 4000);
            }
            e.target.value = '';
          }} />
        </div>

        {importStatus && (
          <p className="mt-8" style={{ fontSize: 'var(--font-size-sm)', color: importStatus.startsWith('✓') ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
            {importStatus}
          </p>
        )}
      </div>

      {/* Privacy */}
      <div className="card mb-16">
        <div className="card-header">
          <h3 className="card-title">Privacy &amp; Security</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--accent-success-soft)', borderRadius: 'var(--radius-md)' }}>
          <Shield size={20} style={{ color: 'var(--accent-success)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Your data stays on your device</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
              HRT Tracker stores all data locally using IndexedDB. Nothing is ever sent to any server.
            </div>
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="card mb-16">
        <div className="card-header">
          <h3 className="card-title">Language</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={16} style={{ color: 'var(--text-tertiary)' }} />
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
            English (more languages coming soon)
          </span>
        </div>
      </div>

      {/* About */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">About</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Info size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
            <strong>HRT Tracker</strong>{' '}
            <a href="https://github.com/SRINIOLO2/HRT_Tracker" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: 'var(--text-primary)' }}>
              v{pkg.version}
            </a><br />
            A privacy-first, offline-capable health tracking app for hormone medication management.<br />
            Open source · Made with ❤️
          </div>
        </div>
      </div>
    </div>
  );
}
