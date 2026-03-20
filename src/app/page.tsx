'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Medication, type DoseLog, type BloodTest, type MoodEntry } from '@/lib/db';
import { format, subDays } from 'date-fns';
import {
  Pill, TestTubes, SmilePlus, Target, Plus,
  Activity, CalendarCheck, AlertCircle, Edit3, Check, GripVertical, Eye, EyeOff, ChevronUp, ChevronDown
} from 'lucide-react';
import { HormoneLevelChart } from '@/components/charts/HormoneLevelChart';
import { MoodTrendChart } from '@/components/charts/MoodTrendChart';

const moodEmojis = ['', '😞', '😕', '😐', '🙂', '😊'];

const DEFAULT_LAYOUT = ['summary', 'actions', 'doses', 'hormone', 'mood'];

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
  const goals = useLiveQuery(async () => {
    const all = await db.goals.toArray();
    return all.filter(g => !g.completed);
  }) || [];

  const [layout, setLayout] = useState<string[]>(DEFAULT_LAYOUT);
  const [hiddenSections, setHiddenSections] = useState<Record<string, boolean>>({});
  const [editMode, setEditMode] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  function moveItem(index: number, direction: number) {
    const newLayout = [...layout];
    const target = index + direction;
    if (target >= 0 && target < newLayout.length) {
      const temp = newLayout[index];
      newLayout[index] = newLayout[target];
      newLayout[target] = temp;
      saveLayout(newLayout);
    }
  }

  const [syncGraphs, setSyncGraphs] = useState(false);

  useEffect(() => {
    const savedLayout = localStorage.getItem('dashboardLayout');
    if (savedLayout) setLayout(JSON.parse(savedLayout));
    const savedHidden = localStorage.getItem('dashboardHidden');
    if (savedHidden) setHiddenSections(JSON.parse(savedHidden));
    setSyncGraphs(localStorage.getItem('hrt_sync_graphs') === 'true');
  }, []);

  const latestMood = recentMoods.length > 0 ? recentMoods[0] : null;
  const latestBloodTest = recentBloodTests.length > 0 ? recentBloodTests[0] : null;
  const forgottenCount = recentDoses.filter(d => d.forgotten).length;
  const takenCount = recentDoses.filter(d => !d.forgotten).length;

  const renderSectionContent = (id: string) => {
    switch (id) {
      case 'summary':
        return (
          <div className="summary-grid">
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

            <Link href="/goals" style={{ textDecoration: 'none' }}>
              <div className="card card-gradient" style={{ cursor: 'pointer', height: '100%' }}>
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
            </Link>
          </div>
        );

      case 'actions':
        return (
          <div className="section mt-24">
            <div className="section-header">
              <h2 className="section-title">Quick Actions</h2>
            </div>
            <div className="summary-grid">
              <Link href="/medications" style={{ textDecoration: 'none' }}>
                <button className="quick-action" style={{ width: '100%' }}>
                  <div className="quick-action-icon" style={{ background: 'var(--accent-primary)' }}>
                    <Pill size={20} />
                  </div>
                  <div className="quick-action-text" style={{ textAlign: 'left' }}>
                    <div className="quick-action-title">Log a Dose</div>
                    <div className="quick-action-subtitle">Record medication taken</div>
                  </div>
                </button>
              </Link>
              <Link href="/mood" style={{ textDecoration: 'none' }}>
                <button className="quick-action" style={{ width: '100%' }}>
                  <div className="quick-action-icon" style={{ background: 'var(--accent-secondary)' }}>
                    <SmilePlus size={20} />
                  </div>
                  <div className="quick-action-text" style={{ textAlign: 'left' }}>
                    <div className="quick-action-title">Log Mood</div>
                    <div className="quick-action-subtitle">How are you feeling?</div>
                  </div>
                </button>
              </Link>
              <Link href="/blood-tests" style={{ textDecoration: 'none' }}>
                <button className="quick-action" style={{ width: '100%' }}>
                  <div className="quick-action-icon" style={{ background: 'var(--accent-success)' }}>
                    <TestTubes size={20} />
                  </div>
                  <div className="quick-action-text" style={{ textAlign: 'left' }}>
                    <div className="quick-action-title">Log Blood Test</div>
                    <div className="quick-action-subtitle">Add test results</div>
                  </div>
                </button>
              </Link>
            </div>
          </div>
        );

      case 'doses':
        if (recentDoses.length === 0 && !editMode) return null;
        return (
          <div className="section mt-24">
            <div className="section-header">
              <h2 className="section-title">Recent Doses</h2>
              <Link href="/medications" className="btn btn-ghost btn-sm">View All</Link>
            </div>
            {recentDoses.length === 0 ? (
               <div className="card" style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '16px' }}>No recent doses</div>
            ) : (
              <div className="card" style={{ padding: 0 }}>
                {recentDoses.slice(0, 5).map((dose) => (
                  <div key={dose.id} className="list-item">
                     <div className="list-icon" style={{
                      background: dose.forgotten ? 'var(--accent-warning-soft)' : 'var(--accent-success-soft)',
                      color: dose.forgotten ? 'var(--accent-warning)' : 'var(--accent-success)',
                      border: 'none'
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
            )}
          </div>
        );

      case 'hormone': {
        const bloodData = syncGraphs ? recentBloodTests.filter(b => b.testDate >= subDays(Date.now(), 30).getTime()) : recentBloodTests;
        if (bloodData.length === 0 && !editMode) return null;
        return (
          <div className="section mt-24">
            <div className="section-header">
              <h2 className="section-title">Hormone Trends {syncGraphs && '(Last 30 Days)'}</h2>
            </div>
            {bloodData.length === 0 ? (
               <div className="card" style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '16px' }}>No blood tests yet</div>
            ) : (
              <div className="card">
                <HormoneLevelChart data={bloodData} syncId={syncGraphs ? "dashboardSync" : undefined} />
              </div>
            )}
          </div>
        );
      }

      case 'mood': {
        const moodData = syncGraphs ? recentMoods.filter(m => m.createdAt >= subDays(Date.now(), 30).getTime()) : recentMoods;
        if (moodData.length === 0 && !editMode) return null;
        return (
          <div className="section mt-24">
            <div className="section-header">
              <h2 className="section-title">Mood Trends {syncGraphs && '(Last 30 Days)'}</h2>
            </div>
             {moodData.length === 0 ? (
               <div className="card" style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '16px' }}>No moods logged yet</div>
            ) : (
              <div className="card">
                <MoodTrendChart data={moodData} syncId={syncGraphs ? "dashboardSync" : undefined} />
              </div>
            )}
          </div>
        );
      }

      default: return null;
    }
  };

  const sectionNames: Record<string, string> = {
    summary: 'Summary Cards',
    actions: 'Quick Actions',
    doses: 'Recent Doses',
    hormone: 'Hormone Trends',
    mood: 'Mood Trends'
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your health overview at a glance</p>
        </div>
        <button 
          className={`btn ${editMode ? 'btn-primary' : 'btn-secondary'} btn-sm`} 
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? <Check size={16} /> : <Edit3 size={16} />}
          {editMode ? 'Done' : 'Edit Layout'}
        </button>
      </div>

      {editMode && (
        <div className="card" style={{ marginBottom: '24px', background: 'var(--accent-primary-soft)', border: '1px solid var(--accent-primary)' }}>
          <p style={{ margin: 0, fontWeight: 500, color: 'var(--text-primary)' }}>Customize Dashboard</p>
          <p style={{ margin: '4px 0 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
            Rearrange sections using the arrows, or toggle visibility.
          </p>
        </div>
      )}

      {/* Empty state when no data and empty layout */}
      {medications.length === 0 && recentDoses.length === 0 && !editMode && (
        <div className="card mt-24">
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

      <div>
        {layout.map((id, index) => {
          const isHidden = hiddenSections[id];
          if (isHidden && !editMode) return null;
          
          return (
            <div 
              key={id} 
              style={{ 
                position: 'relative', 
                opacity: isHidden ? 0.5 : 1,
                padding: editMode ? '16px' : 0,
                marginBottom: editMode ? '16px' : 0,
                border: editMode ? '2px dashed var(--border-color)' : 'none',
                borderRadius: '12px',
                background: editMode ? 'var(--bg-card)' : 'transparent',
                transition: 'all 0.2s ease'
              }}
            >
              {editMode && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <GripVertical size={20} style={{ color: 'var(--text-tertiary)' }} />
                    <span style={{ fontWeight: 600 }}>{sectionNames[id]}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => toggleVisibility(id)} title={isHidden ? 'Show section' : 'Hide section'}>
                      {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <button className="btn btn-ghost btn-icon" style={{ padding: '2px' }} onClick={() => moveItem(index, -1)} disabled={index === 0}>
                        <ChevronUp size={16} />
                      </button>
                      <button className="btn btn-ghost btn-icon" style={{ padding: '2px' }} onClick={() => moveItem(index, 1)} disabled={index === layout.length - 1}>
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div style={{ pointerEvents: editMode ? 'none' : 'auto' }}>
                {renderSectionContent(id)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
