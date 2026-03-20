'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type LifeEvent } from '@/lib/db';
import { format, differenceInYears, differenceInDays } from 'date-fns';
import { Plus, CalendarHeart, Edit2, Trash2, Bell, BellOff, Calendar, CheckSquare, Square, AlertTriangle } from 'lucide-react';

const categoryOptions = [
  { value: 'milestone', label: 'Milestone', color: '#f5a623' },
  { value: 'medication-change', label: 'Medication Change', color: '#7c5cfc' },
  { value: 'medical', label: 'Medical', color: '#4da6ff' },
  { value: 'surgical', label: 'Surgical', color: '#ff6b9d' },
  { value: 'personal', label: 'Personal', color: '#22c997' },
  { value: 'other', label: 'Other', color: '#9ba1bc' },
];

function getCategoryInfo(value: string) {
  return categoryOptions.find((c: any) => c.value === value) || categoryOptions[categoryOptions.length - 1];
}

function formatTimeSince(dateMs: number): string {
  const now = Date.now();
  const years = differenceInYears(now, dateMs);
  const days = differenceInDays(now, dateMs);

  if (days < 0) return `in ${Math.abs(days)} days`;
  if (days === 0) return 'Today';
  if (years === 0) return `${days} day${days !== 1 ? 's' : ''} ago`;
  const remainingDays = days - years * 365;
  if (remainingDays === 0) return `${years} year${years !== 1 ? 's' : ''} ago`;
  return `${years}y ${remainingDays}d ago`;
}

const emptyEvent: Omit<LifeEvent, 'id'> = {
  title: '',
  date: Date.now(),
  category: 'milestone',
  description: '',
  isRecurring: false,
  recurringType: 'yearly',
  notifyOnAnniversary: false,
  createdAt: Date.now(),
};

export default function EventsPage() {
  const events = useLiveQuery(() => db.events.orderBy('date').reverse().toArray()) || [];
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Omit<LifeEvent, 'id'>>(emptyEvent);

  const [batchMode, setBatchMode] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<Set<number>>(new Set());
  const [batchEnabled, setBatchEnabled] = useState(false);

  useEffect(() => {
    setBatchEnabled(localStorage.getItem('hrt_batch_delete') === 'true');
  }, []);

  function openAddForm() {
    setForm({ ...emptyEvent, createdAt: Date.now(), date: Date.now() });
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(event: LifeEvent) {
    setForm({ ...event });
    setEditingId(event.id!);
    setShowForm(true);
  }

  async function saveEvent() {
    if (!form.title.trim()) return;
    if (editingId) {
      await db.events.update(editingId, form);
    } else {
      await db.events.add(form);
    }
    setShowForm(false);
    setEditingId(null);
  }

  async function deleteEvent(id: number) {
    if (confirm('Delete this event?')) {
      await db.events.delete(id);
    }
  }

  async function toggleAnniversary(event: LifeEvent) {
    await db.events.update(event.id!, {
      notifyOnAnniversary: !event.notifyOnAnniversary,
      isRecurring: !event.notifyOnAnniversary,
    });
  }

  async function batchDeleteSelected() {
    if (selectedEvents.size === 0) return;
    if (confirm(`WARNING: Please make sure you have backed up your data first!\n\nAre you sure you want to delete these ${selectedEvents.size} selected events?`)) {
      await Promise.all(Array.from(selectedEvents).map(id => db.events.delete(id)));
      setSelectedEvents(new Set());
      setBatchMode(false);
    }
  }

  function toggleEventSelect(id: number) {
    const nextSet = new Set(selectedEvents);
    if (nextSet.has(id)) nextSet.delete(id);
    else nextSet.add(id);
    setSelectedEvents(nextSet);
  }

  // Group events by year
  const groupedByYear: Record<string, LifeEvent[]> = {};
  events.forEach((event: LifeEvent) => {
    const year = new Date(event.date).getFullYear().toString();
    if (!groupedByYear[year]) groupedByYear[year] = [];
    groupedByYear[year].push(event);
  });
  const sortedYears = Object.keys(groupedByYear).sort((a, b) => parseInt(b) - parseInt(a));

  // Upcoming anniversaries
  const upcomingAnniversaries = events
    .filter((e: LifeEvent) => e.notifyOnAnniversary && differenceInDays(new Date(e.date), new Date()) < 0)
    .map((e: LifeEvent) => {
      const years = differenceInYears(Date.now(), e.date);
      const nextAnniversary = new Date(e.date);
      nextAnniversary.setFullYear(new Date().getFullYear());
      if (nextAnniversary.getTime() < Date.now()) {
        nextAnniversary.setFullYear(new Date().getFullYear() + 1);
      }
      const daysUntil = differenceInDays(nextAnniversary, new Date());
      return { ...e, yearsCompleted: years, daysUntilNext: daysUntil };
    })
    .filter((e: any) => e.daysUntilNext <= 60)
    .sort((a: any, b: any) => a.daysUntilNext - b.daysUntilNext);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Timeline</h1>
          <p className="page-subtitle">Your personal health journey</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {events.length > 0 && batchEnabled && (
            batchMode ? (
              <>
                <button className="btn btn-secondary btn-sm" onClick={() => { setBatchMode(false); setSelectedEvents(new Set()); }}>Cancel</button>
                <button className="btn btn-danger btn-sm" onClick={batchDeleteSelected} disabled={selectedEvents.size === 0}>
                  <Trash2 size={14} /> Delete Selected ({selectedEvents.size})
                </button>
              </>
            ) : (
              <button className="btn btn-ghost btn-sm" onClick={() => setBatchMode(true)}>Select Multiple</button>
            )
          )}
          <button className="btn btn-primary" onClick={openAddForm}>
            <Plus size={16} /> Add Event
          </button>
        </div>
      </div>

      {/* Upcoming Anniversaries */}
      {upcomingAnniversaries.length > 0 && (
        <div className="card mb-16" style={{ background: 'linear-gradient(135deg, var(--accent-primary-soft), var(--accent-secondary-soft))' }}>
          <div className="card-header">
            <h3 className="card-title">🎉 Upcoming Anniversaries</h3>
          </div>
          {upcomingAnniversaries.map((a: any) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', fontSize: 'var(--font-size-sm)' }}>
              <span style={{ fontSize: '20px' }}>🎂</span>
              <div>
                <strong>{a.title}</strong> — {a.yearsCompleted + 1} year{a.yearsCompleted + 1 !== 1 ? 's' : ''}
                <span style={{ color: 'var(--text-tertiary)', marginLeft: '8px' }}>
                  {a.daysUntilNext === 0 ? 'Today!' : `in ${a.daysUntilNext} days`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Timeline */}
      {events.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><CalendarHeart size={28} /></div>
            <div className="empty-state-title">No events yet</div>
            <div className="empty-state-desc">
              Add important dates to your timeline — starting HRT, doctor changes, surgeries, milestones, or any event worth remembering.
            </div>
            <button className="btn btn-primary" onClick={openAddForm}>
              <Plus size={16} /> Add Your First Event
            </button>
          </div>
        </div>
      ) : (
        <div className="timeline">
          {sortedYears.map((year: string) => (
            <div key={year} className="section">
              <h2 className="section-title mb-16" style={{ position: 'sticky', top: '0', background: 'var(--bg-primary)', zIndex: 1, padding: '4px 0' }}>
                {year}
              </h2>
              <div style={{ borderLeft: '2px solid var(--border-primary)', marginLeft: '16px', paddingLeft: '24px' }}>
                {groupedByYear[year].map((event: LifeEvent) => {
                  const cat = getCategoryInfo(event.category);
                  return (
                    <div key={event.id} className="card mb-16" style={{ position: 'relative' }}>
                      {/* Timeline dot */}
                      <div style={{
                        position: 'absolute',
                        left: '-33px',
                        top: '20px',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: cat.color,
                        border: '2px solid var(--bg-secondary)',
                      }} />

                      <div className="card-header" onClick={() => batchMode && toggleEventSelect(event.id!)} style={{ cursor: batchMode ? 'pointer' : 'default' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                          {batchMode && (
                            <input 
                              type="checkbox" 
                              checked={selectedEvents.has(event.id!)} 
                              onChange={() => toggleEventSelect(event.id!)}
                              style={{ marginRight: '8px', cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                            />
                          )}
                          <span className="badge" style={{ background: `${cat.color}20`, color: cat.color, fontSize: 'var(--font-size-xs)' }}>
                            {cat.label}
                          </span>
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                            {format(new Date(event.date), 'MMMM d, yyyy')}
                          </span>
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                            {formatTimeSince(event.date)}
                          </span>
                        </div>
                        {!batchMode && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              onClick={() => toggleAnniversary(event)}
                              title={event.notifyOnAnniversary ? 'Disable anniversary reminder' : 'Enable anniversary reminder'}
                              style={{ color: event.notifyOnAnniversary ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}
                            >
                              {event.notifyOnAnniversary ? <Bell size={14} /> : <BellOff size={14} />}
                            </button>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEditForm(event)}><Edit2 size={14} /></button>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteEvent(event.id!)} style={{ color: 'var(--accent-danger)' }}><Trash2 size={14} /></button>
                          </div>
                        )}
                      </div>

                      <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, margin: '4px 0 6px' }}>
                        {event.title}
                      </h4>

                      {event.description && (
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                          {event.description}
                        </p>
                      )}

                      {event.notifyOnAnniversary && (
                        <div style={{ marginTop: '8px', fontSize: 'var(--font-size-xs)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Bell size={12} /> Anniversary reminder enabled
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Event Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <h2 className="modal-title">{editingId ? 'Edit Event' : 'Add Event'}</h2>

            <div className="form-group">
              <label className="form-label">Event Title</label>
              <input className="form-input" value={form.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, title: e.target.value })} placeholder='e.g. "Started HRT", "Changed doctor", "Top surgery"' />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={format(new Date(form.date), 'yyyy-MM-dd')} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, date: new Date(e.target.value).getTime() })} />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, category: e.target.value })}>
                  {categoryOptions.map((c: any) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <textarea className="form-textarea" value={form.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, description: e.target.value })} placeholder="What happened? Why is this significant?" />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.notifyOnAnniversary}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, notifyOnAnniversary: e.target.checked, isRecurring: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                />
                <Calendar size={16} />
                Celebrate yearly anniversary
              </label>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', margin: '4px 0 0 26px' }}>
                Get a notification on the anniversary of this event each year
              </p>
            </div>

            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEvent}>
                {editingId ? 'Save Changes' : 'Add Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
