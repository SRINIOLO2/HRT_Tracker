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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBatchDelete(localStorage.getItem('hrt_batch_delete') === 'true');
    setSyncGraphs(localStorage.getItem('hrt_sync_graphs') === 'true');
  }, []);

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
      a.download = `hrt-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
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

      {/* Data Management */}
      <div className="card mb-16">
        <div className="card-header">
          <h3 className="card-title">Data Management</h3>
        </div>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          All your data is stored locally on this device. Export regularly to keep a backup.
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

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={16} /> Export Backup (JSON)
          </button>
          <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} /> Import Backup (JSON)
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
          <button className="btn btn-ghost" onClick={() => {
            const content = "medicationName,dose,unit,route,takenAtDate,takenAtTime,notes,forgotten\nEstradiol,2,mg,oral,2023-10-01,09:00,,false\nTestosterone,50,mg,injection,2023-10-01,10:00,Left Leg,false";
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([content], { type: 'text/csv' }));
            a.download = `hrt-doses-template.csv`;
            a.click();
          }}>
            <FileText size={16} /> Download CSV Template
          </button>
          
          <button className="btn btn-ghost" onClick={async () => {
            try {
              const logs = await db.doseLogs.toArray();
              const csvData = logs.map(l => {
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
              const csvContent = generateCSV(csvData, ['medicationName', 'dose', 'unit', 'route', 'takenAtDate', 'takenAtTime', 'notes', 'forgotten']);
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `hrt-doses-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            } catch (err) {
              console.error('CSV Export failed:', err);
            }
          }}>
            <Download size={16} /> Export Doses to CSV
          </button>

          <button className="btn btn-ghost" onClick={() => csvFileInputRef.current?.click()}>
            <Upload size={16} /> Import from CSV
          </button>
          <input ref={csvFileInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            if (!confirm('This will import doses from the CSV. Ensure the format matches the template.')) {
              e.target.value = '';
              return;
            }

            try {
              const text = await file.text();
              const records = parseCSV(text);
              if (records.length === 0) throw new Error('Empty CSV');

              const meds = (await db.medications.toArray()).reduce((acc, m) => {
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

              await db.doseLogs.bulkAdd(newDoses);
              setImportStatus(`✓ Imported ${newDoses.length} dose records!`);
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
            <a href={`https://github.com/SRINIOLO2/HRT_Tracker/releases/tag/v${pkg.version}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: 'var(--text-primary)' }}>
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
