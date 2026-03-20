'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type MoodEntry } from '@/lib/db';
import { format } from 'date-fns';
import { Plus, SmilePlus, Trash2, Edit3, CheckSquare, Square, AlertTriangle } from 'lucide-react';
import { MoodTrendChart } from '@/components/charts/MoodTrendChart';

const moodEmojis = [
  { value: 1, emoji: '😞', label: 'Awful' },
  { value: 2, emoji: '😕', label: 'Bad' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😊', label: 'Great' },
];

const energyLevels = [
  { value: 1, label: 'Exhausted' },
  { value: 2, label: 'Low' },
  { value: 3, label: 'Moderate' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Energized' },
];

const moodTags = [
  'happy', 'anxious', 'calm', 'irritable', 'focused', 'foggy',
  'confident', 'dysphoric', 'euphoric', 'tired', 'motivated', 'emotional',
  'social', 'isolated', 'creative', 'restless', 'peaceful', 'grateful',
];

export default function MoodPage() {
  const moods = useLiveQuery(() => db.moods.orderBy('createdAt').reverse().toArray()) || [];
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchEnabled, setBatchEnabled] = useState(false);

  useEffect(() => {
    setBatchEnabled(localStorage.getItem('hrt_batch_delete') === 'true');
  }, []);

  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    mood: 3,
    energy: 3,
    notes: '',
    tags: [] as string[],
  });

  function openNewForm() {
    setForm({ date: format(new Date(), 'yyyy-MM-dd'), time: format(new Date(), 'HH:mm'), mood: 3, energy: 3, notes: '', tags: [] });
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(entry: MoodEntry) {
    const d = new Date(entry.createdAt);
    setForm({
      date: format(d, 'yyyy-MM-dd'),
      time: format(d, 'HH:mm'),
      mood: entry.mood,
      energy: entry.energy,
      notes: entry.notes || '',
      tags: entry.tags || [],
    });
    setEditingId(entry.id!);
    setShowForm(true);
  }

  function toggleTag(tag: string) {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag],
    }));
  }

  async function saveMood() {
    const d = new Date(`${form.date}T${form.time}`);
    const data = {
      date: form.date,
      mood: form.mood,
      energy: form.energy,
      notes: form.notes,
      tags: form.tags,
      createdAt: d.getTime(),
    };

    if (editingId) {
      await db.moods.update(editingId, data);
    } else {
      await db.moods.add(data);
    }
    setShowForm(false);
  }

  async function deleteMood(id: number) {
    if (confirm('Delete this mood entry?')) {
      await db.moods.delete(id);
    }
  }

  function toggleSelect(id: number) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  async function batchDeleteSelected() {
    if (selectedIds.size === 0) return;
    if (confirm(`WARNING: You are about to delete ${selectedIds.size} mood entries.\n\nIt's recommended to export a backup from Settings first.\n\nAre you sure you want to proceed?`)) {
      await db.moods.bulkDelete(Array.from(selectedIds));
      setIsBatchMode(false);
      setSelectedIds(new Set());
    }
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Mood Tracker</h1>
          <p className="page-subtitle">Track how you&apos;re feeling over time</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {batchEnabled && moods.length > 0 && (
            <button className={`btn ${isBatchMode ? 'btn-primary' : 'btn-ghost'}`} onClick={() => {
              setIsBatchMode(!isBatchMode);
              setSelectedIds(new Set());
            }}>
              {isBatchMode ? 'Cancel' : 'Select Multiple'}
            </button>
          )}
          {!isBatchMode && (
            <button className="btn btn-primary" onClick={openNewForm}>
              <Plus size={16} /> Log Mood
            </button>
          )}
        </div>
      </div>

      {isBatchMode && (
        <div className="card mb-16" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--accent-danger-soft)', border: '1px solid var(--accent-danger)' }}>
          <div>
            <span style={{ fontWeight: 600 }}>{selectedIds.size} selected</span>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>Select multiple moods to batch delete.</div>
          </div>
          <button className="btn" style={{ background: 'var(--accent-danger)', color: 'white' }} disabled={selectedIds.size === 0} onClick={batchDeleteSelected}>
            <AlertTriangle size={16} /> Batch Delete
          </button>
        </div>
      )}

      {/* Mood Trend Chart */}
      {moods.length > 0 && !isBatchMode && (
        <div className="card mb-16">
          <div className="card-header">
            <h3 className="card-title">Mood &amp; Energy Trends</h3>
          </div>
          <MoodTrendChart data={moods} />
        </div>
      )}

      {/* Mood History */}
      {moods.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><SmilePlus size={28} /></div>
            <div className="empty-state-title">No mood entries yet</div>
            <div className="empty-state-desc">Start logging how you feel to see trends over time.</div>
            <button className="btn btn-primary" onClick={openNewForm}>
              <Plus size={16} /> Log Your Mood
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {moods.map((entry: MoodEntry) => (
            <div key={entry.id} className="list-item" style={{ cursor: isBatchMode ? 'pointer' : 'default' }} onClick={() => isBatchMode && toggleSelect(entry.id!)}>
              {isBatchMode && (
                <div style={{ marginRight: '12px', color: selectedIds.has(entry.id!) ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}>
                  {selectedIds.has(entry.id!) ? <CheckSquare size={20} /> : <Square size={20} />}
                </div>
              )}
              <div className="list-icon" style={{ background: 'var(--accent-secondary-soft)', fontSize: '24px' }}>
                {moodEmojis.find((m: any) => m.value === entry.mood)?.emoji || '😐'}
              </div>
              <div className="list-content">
                <div className="list-title">
                  {moodEmojis.find((m: any) => m.value === entry.mood)?.label} · Energy: {energyLevels.find((e: any) => e.value === entry.energy)?.label}
                </div>
                <div className="list-subtitle">
                  {format(new Date(entry.createdAt), 'MMMM d, yyyy h:mm a')}
                </div>
                {entry.tags && entry.tags.length > 0 && (
                  <div className="tag-group mt-8">
                    {entry.tags.map((tag: string) => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
                {entry.notes && (
                  <div className="list-subtitle mt-8" style={{ color: 'var(--text-secondary)' }}>
                    {entry.notes}
                  </div>
                )}
              </div>
              {!isBatchMode && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={(e: React.MouseEvent) => { e.stopPropagation(); openEditForm(entry); }} style={{ color: 'var(--text-secondary)' }}>
                    <Edit3 size={16} />
                  </button>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={(e: React.MouseEvent) => { e.stopPropagation(); deleteMood(entry.id!); }} style={{ color: 'var(--accent-danger)' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Log Mood Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <h2 className="modal-title">{editingId ? 'Edit Mood' : 'How are you feeling?'}</h2>
            
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                <label className="form-label">Date</label>
                <input type="date" className="form-input" value={form.date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                <label className="form-label">Time</label>
                <input type="time" className="form-input" value={form.time} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, time: e.target.value })} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mood</label>
              <div className="mood-scale">
                {moodEmojis.map((m: any) => (
                  <button
                    key={m.value}
                    className={`mood-option ${form.mood === m.value ? 'selected' : ''}`}
                    onClick={() => setForm({ ...form, mood: m.value })}
                    title={m.label}
                  >
                    {m.emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Energy Level</label>
              <div className="mood-scale">
                {energyLevels.map(e => (
                  <button
                    key={e.value}
                    className={`mood-option ${form.energy === e.value ? 'selected' : ''}`}
                    onClick={() => setForm({ ...form, energy: e.value })}
                    title={e.label}
                    style={{ fontSize: '14px', fontWeight: 600 }}
                  >
                    {e.value}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tags</label>
              <div className="tag-group">
                {moodTags.map(tag => (
                  <button
                    key={tag}
                    className={`tag ${form.tags.includes(tag) ? 'active' : ''}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <textarea className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="How are you feeling today?" />
            </div>

            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveMood}>
                <SmilePlus size={16} /> Save Mood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
