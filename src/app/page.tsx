'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Medication, type DoseLog, type BloodTest, type MoodEntry } from '@/lib/db';
import { format, formatDistanceToNow, subDays } from 'date-fns';
import {
  Pill,
  TestTubes,
  SmilePlus,
  Target,
  Plus,
  Clock,
  Activity,
  TrendingUp,
  CalendarCheck,
  AlertCircle,
} from 'lucide-react';
import { HormoneLevelChart } from '@/components/charts/HormoneLevelChart';
import { MoodTrendChart } from '@/components/charts/MoodTrendChart';

const moodEmojis = ['', '😞', '😕', '😐', '🙂', '😊'];

export default function DashboardPage() {
  const medications = useLiveQuery(() => db.medications.where('active').equals(1).toArray()) || [];
  const recentDoses = useLiveQuery(() =>
    db.doseLogs.where('takenAt').above(subDays(Date.now(), 7).getTime()).reverse().sortBy('takenAt')
  ) || [];
  const recentBloodTests = useLiveQuery(() =>
    db.bloodTests.orderBy('testDate').reverse().limit(5).toArray()
  ) || [];
  const recentMoods = useLiveQuery(() =>
    db.moods.orderBy('createdAt').reverse().limit(7).toArray()
  ) || [];
  const goals = useLiveQuery(() =>
    db.goals.where('completed').equals(0).toArray()
  ) || [];

  const latestMood = recentMoods.length > 0 ? recentMoods[0] : null;
  const latestBloodTest = recentBloodTests.length > 0 ? recentBloodTests[0] : null;

  // Calculate forgotten doses this week
  const forgottenCount = recentDoses.filter(d => d.forgotten).length;
  const takenCount = recentDoses.filter(d => !d.forgotten).length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Your health overview at a glance</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        {/* Active Medications */}
        <div className="card card-gradient">
          <div className="card-header">
            <div>
              <div className="card-value">{medications.length}</div>
              <div className="card-label">Active Medications</div>
            </div>
            <div className="card-icon" style={{ background: 'var(--accent-primary-soft)', color: 'var(--accent-primary)' }}>
              <Pill size={20} />
            </div>
          </div>
          {takenCount > 0 && (
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
              {takenCount} doses taken this week
              {forgottenCount > 0 && <span style={{ color: 'var(--accent-warning)' }}> · {forgottenCount} missed</span>}
            </div>
          )}
        </div>

        {/* Latest Mood */}
        <div className="card card-gradient">
          <div className="card-header">
            <div>
              <div className="card-value">
                {latestMood ? moodEmojis[latestMood.mood] : '—'}
              </div>
              <div className="card-label">Recent Mood</div>
            </div>
            <div className="card-icon" style={{ background: 'var(--accent-secondary-soft)', color: 'var(--accent-secondary)' }}>
              <SmilePlus size={20} />
            </div>
          </div>
          {latestMood && (
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
              {format(new Date(latestMood.createdAt), 'MMM d')} · Energy {latestMood.energy}/5
            </div>
          )}
        </div>

        {/* Latest Blood Test */}
        <div className="card card-gradient">
          <div className="card-header">
            <div>
              <div className="card-value" style={{ fontSize: 'var(--font-size-xl)' }}>
                {latestBloodTest ? `${latestBloodTest.value} ${latestBloodTest.unit}` : '—'}
              </div>
              <div className="card-label">
                {latestBloodTest ? latestBloodTest.hormone : 'Latest Blood Test'}
              </div>
            </div>
            <div className="card-icon" style={{ background: 'var(--accent-success-soft)', color: 'var(--accent-success)' }}>
              <TestTubes size={20} />
            </div>
          </div>
          {latestBloodTest && (
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
              {format(new Date(latestBloodTest.testDate), 'MMM d, yyyy')}
            </div>
          )}
        </div>

        {/* Active Goals */}
        <div className="card card-gradient">
          <div className="card-header">
            <div>
              <div className="card-value">{goals.length}</div>
              <div className="card-label">Active Goals</div>
            </div>
            <div className="card-icon" style={{ background: 'var(--accent-info-soft)', color: 'var(--accent-info)' }}>
              <Target size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Quick Actions</h2>
        </div>
        <div className="summary-grid">
          <Link href="/medications" style={{ textDecoration: 'none' }}>
            <button className="quick-action">
              <div className="quick-action-icon" style={{ background: 'var(--accent-primary)' }}>
                <Pill size={20} />
              </div>
              <div className="quick-action-text">
                <div className="quick-action-title">Log a Dose</div>
                <div className="quick-action-subtitle">Record medication taken</div>
              </div>
            </button>
          </Link>
          <Link href="/mood" style={{ textDecoration: 'none' }}>
            <button className="quick-action">
              <div className="quick-action-icon" style={{ background: 'var(--accent-secondary)' }}>
                <SmilePlus size={20} />
              </div>
              <div className="quick-action-text">
                <div className="quick-action-title">Log Mood</div>
                <div className="quick-action-subtitle">How are you feeling?</div>
              </div>
            </button>
          </Link>
          <Link href="/blood-tests" style={{ textDecoration: 'none' }}>
            <button className="quick-action">
              <div className="quick-action-icon" style={{ background: 'var(--accent-success)' }}>
                <TestTubes size={20} />
              </div>
              <div className="quick-action-text">
                <div className="quick-action-title">Log Blood Test</div>
                <div className="quick-action-subtitle">Add test results</div>
              </div>
            </button>
          </Link>
        </div>
      </div>

      {/* Recent Dose History */}
      {recentDoses.length > 0 && (
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Recent Doses</h2>
            <Link href="/medications" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          <div className="card">
            {recentDoses.slice(0, 5).map((dose) => (
              <div key={dose.id} className="list-item">
                <div className="list-icon" style={{
                  background: dose.forgotten ? 'var(--accent-danger-soft)' : 'var(--accent-success-soft)',
                  color: dose.forgotten ? 'var(--accent-danger)' : 'var(--accent-success)',
                }}>
                  {dose.forgotten ? <AlertCircle size={18} /> : <CalendarCheck size={18} />}
                </div>
                <div className="list-content">
                  <div className="list-title">{dose.medicationName}</div>
                  <div className="list-subtitle">
                    {dose.dose} {dose.unit} · {format(new Date(dose.takenAt), 'MMM d, h:mm a')}
                  </div>
                </div>
                <span className={`badge ${dose.forgotten ? 'badge-forgotten' : 'badge-taken'}`}>
                  {dose.forgotten ? 'Missed' : 'Taken'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Section */}
      {recentBloodTests.length > 0 && (
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Hormone Trends</h2>
          </div>
          <div className="card">
            <HormoneLevelChart data={recentBloodTests} />
          </div>
        </div>
      )}

      {recentMoods.length > 0 && (
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Mood Trends</h2>
          </div>
          <div className="card">
            <MoodTrendChart data={recentMoods} />
          </div>
        </div>
      )}

      {/* Empty state when no data */}
      {medications.length === 0 && recentDoses.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Activity size={28} />
            </div>
            <div className="empty-state-title">Welcome to HRT Tracker</div>
            <div className="empty-state-desc">
              Start by adding your medications, then log doses, blood tests, and mood to see your health data visualized here.
            </div>
            <Link href="/medications" className="btn btn-primary">
              <Plus size={16} /> Add Your First Medication
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
