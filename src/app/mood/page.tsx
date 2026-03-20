'use client';

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type MoodEntry } from '@/lib/db';
import { format } from 'date-fns';
import { Plus, SmilePlus, Trash2 } from 'lucide-react';
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
  const [form, setForm] = useState<Omit<MoodEntry, 'id'>>({
    date: format(new Date(), 'yyyy-MM-dd'),
    mood: 3,
    energy: 3,
    notes: '',
    tags: [],
    createdAt: Date.now(),
  });

  function toggleTag(tag: string) {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }));
  }

  async function saveMood() {
    await db.moods.add({ ...form, createdAt: Date.now() });
    setShowForm(false);
    setForm({ date: format(new Date(), 'yyyy-MM-dd'), mood: 3, energy: 3, notes: '', tags: [], createdAt: Date.now() });
  }

  async function deleteMood(id: number) {
    if (confirm('Delete this mood entry?')) {
      await db.moods.delete(id);
    }
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Mood Tracker</h1>
          <p className="page-subtitle">Track how you&apos;re feeling over time</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Log Mood
        </button>
      </div>

      {/* Mood Trend Chart */}
      {moods.length > 0 && (
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
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Log Your Mood
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {moods.map((entry) => (
            <div key={entry.id} className="list-item">
              <div className="list-icon" style={{ background: 'var(--accent-secondary-soft)', fontSize: '24px' }}>
                {moodEmojis.find(m => m.value === entry.mood)?.emoji || '😐'}
              </div>
              <div className="list-content">
                <div className="list-title">
                  {moodEmojis.find(m => m.value === entry.mood)?.label} · Energy: {energyLevels.find(e => e.value === entry.energy)?.label}
                </div>
                <div className="list-subtitle">
                  {format(new Date(entry.createdAt), 'MMMM d, yyyy h:mm a')}
                </div>
                {entry.tags.length > 0 && (
                  <div className="tag-group mt-8">
                    {entry.tags.map(tag => (
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
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteMood(entry.id!)} style={{ color: 'var(--accent-danger)' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Log Mood Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">How are you feeling?</h2>

            <div className="form-group">
              <label className="form-label">Mood</label>
              <div className="mood-scale">
                {moodEmojis.map(m => (
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
