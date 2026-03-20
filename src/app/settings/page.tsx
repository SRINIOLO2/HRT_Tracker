'use client';

import React, { useState, useRef } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { exportAllData, importAllData } from '@/lib/db';
import { requestNotificationPermission } from '@/lib/notifications';
import {
  Sun, Moon, Monitor, Download, Upload, Bell, Shield, Globe, Info,
} from 'lucide-react';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [notifStatus, setNotifStatus] = useState<string>('');
  const [importStatus, setImportStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={16} /> Export Data (JSON)
          </button>
          <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} /> Import Data
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
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
            <strong>HRT Tracker</strong> v0.1.0<br />
            A privacy-first, offline-capable health tracking app for hormone medication management.<br />
            Open source · Made with ❤️
          </div>
        </div>
      </div>
    </div>
  );
}
