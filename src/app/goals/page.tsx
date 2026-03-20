'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Goal, type GoalMilestone } from '@/lib/db';
import { format, differenceInDays } from 'date-fns';
import { Plus, Target, Edit2, Trash2, Check, Calendar, CheckSquare, Square, AlertTriangle } from 'lucide-react';

const categoryOptions = ['physical', 'mental', 'social', 'medical', 'milestone', 'other'];
const categoryColors: Record<string, string> = {
  physical: '#22c997', mental: '#7c5cfc', social: '#ff6b9d',
  medical: '#4da6ff', milestone: '#f5a623', other: '#9ba1bc',
};

const emptyGoal: Omit<Goal, 'id'> = {
  title: '', description: '', targetDate: Date.now() + 90 * 86400000,
  category: 'milestone', progress: 0, milestones: [],
  completed: false, createdAt: Date.now(),
};

export default function GoalsPage() {
  const goals = useLiveQuery(() => db.goals.orderBy('createdAt').reverse().toArray()) || [];
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Omit<Goal, 'id'>>(emptyGoal);
  const [newMilestone, setNewMilestone] = useState('');
  
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchEnabled, setBatchEnabled] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  useEffect(() => {
    setBatchEnabled(localStorage.getItem('hrt_batch_delete') === 'true');
  }, []);

  function openAddForm() {
    setShowOptionalFields(false);
    setForm({ ...emptyGoal, createdAt: Date.now(), targetDate: Date.now() + 90 * 86400000 });
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(goal: Goal) {
    setShowOptionalFields(false);
    setForm({ ...goal });
    setEditingId(goal.id!);
    setShowForm(true);
  }

  async function saveGoal() {
    if (!form.title.trim()) return;
    if (editingId) {
      await db.goals.update(editingId, form);
    } else {
      await db.goals.add(form);
    }
    setShowForm(false);
    setEditingId(null);
  }

  async function deleteGoal(id: number) {
    if (confirm('Delete this goal or event?')) {
      await db.goals.delete(id);
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
    if (confirm(`WARNING: You are about to delete ${selectedIds.size} goals/events.\n\nAre you sure you want to proceed?`)) {
      await db.goals.bulkDelete(Array.from(selectedIds));
      setIsBatchMode(false);
      setSelectedIds(new Set());
    }
  }

  async function toggleComplete(goal: Goal) {
    await db.goals.update(goal.id!, {
      completed: !goal.completed,
      progress: !goal.completed ? 100 : goal.progress,
    });
  }

  async function updateProgress(goal: Goal, progress: number) {
    await db.goals.update(goal.id!, { progress });
  }

  function addMilestone() {
    if (!newMilestone.trim()) return;
    setForm({
      ...form,
      milestones: [...form.milestones, {
        title: newMilestone,
        targetDate: form.targetDate,
        completed: false,
      }],
    });
    setNewMilestone('');
  }

  function removeMilestone(index: number) {
    setForm({
      ...form,
      milestones: form.milestones.filter((_: any, i: number) => i !== index),
    });
  }

  function toggleMilestoneComplete(index: number) {
    const milestones = [...form.milestones];
    milestones[index] = {
      ...milestones[index],
      completed: !milestones[index].completed,
      completedAt: !milestones[index].completed ? Date.now() : undefined,
    };
    setForm({ ...form, milestones });
  }

  const activeGoals = goals.filter((g: Goal) => !g.completed);
  const completedGoals = goals.filter((g: Goal) => g.completed);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Goals & Events</h1>
          <p className="page-subtitle">Set goals or track notable events</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {batchEnabled && goals.length > 0 && (
            <button className={`btn ${isBatchMode ? 'btn-primary' : 'btn-ghost'}`} onClick={() => {
              setIsBatchMode(!isBatchMode);
              setSelectedIds(new Set());
            }}>
              {isBatchMode ? 'Cancel' : 'Select Multiple'}
            </button>
          )}
          {!isBatchMode && (
            <button className="btn btn-primary" onClick={openAddForm}>
              <Plus size={16} /> Add Goal/Event
            </button>
          )}
        </div>
      </div>

      {isBatchMode && (
        <div className="card mb-16" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--accent-danger-soft)', border: '1px solid var(--accent-danger)' }}>
          <div>
            <span style={{ fontWeight: 600 }}>{selectedIds.size} selected</span>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>Select multiple goals/events to batch delete.</div>
          </div>
          <button className="btn" style={{ background: 'var(--accent-danger)', color: 'white' }} disabled={selectedIds.size === 0} onClick={batchDeleteSelected}>
            <AlertTriangle size={16} /> Batch Delete
          </button>
        </div>
      )}

      {/* Active Goals */}
      {goals.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><Target size={28} /></div>
            <div className="empty-state-title">No goals yet</div>
            <div className="empty-state-desc">Set goals with target dates to track your progress.</div>
            <button className="btn btn-primary" onClick={openAddForm}>
              <Plus size={16} /> Set Your First Goal
            </button>
          </div>
        </div>
      ) : (
        <>
          {activeGoals.length > 0 && (
            <div className="section">
              <h2 className="section-title mb-16">Active Goals</h2>
              <div style={{ display: 'grid', gap: '16px' }}>
                {activeGoals.map((goal: Goal) => {
                  const daysLeft = differenceInDays(new Date(goal.targetDate), new Date());
                  const color = categoryColors[goal.category] || '#9ba1bc';
                  return (
                    <div key={goal.id} className="card" style={{ cursor: isBatchMode ? 'pointer' : 'default' }} onClick={() => isBatchMode && toggleSelect(goal.id!)}>
                      <div className="card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {isBatchMode && (
                            <div style={{ color: selectedIds.has(goal.id!) ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}>
                              {selectedIds.has(goal.id!) ? <CheckSquare size={20} /> : <Square size={20} />}
                            </div>
                          )}
                          <div className="card-icon" style={{ background: `${color}20`, color }}>
                            <Target size={18} />
                          </div>
                          <div>
                            <div className="card-title">{goal.title}</div>
                            <div className="card-subtitle">
                              <span className="badge" style={{ background: `${color}20`, color }}>
                                {goal.category}
                              </span>
                              {' · '}
                              <Calendar size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
                              {' '}
                              {daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Today!' : `${Math.abs(daysLeft)} days overdue`}
                            </div>
                          </div>
                        </div>
                        {!isBatchMode && (
                          <div className="list-actions">
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={(e: React.MouseEvent) => { e.stopPropagation(); openEditForm(goal); }}><Edit2 size={14} /></button>
                            <button className="btn btn-success btn-icon btn-sm" onClick={(e: React.MouseEvent) => { e.stopPropagation(); toggleComplete(goal); }}><Check size={14} /></button>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={(e: React.MouseEvent) => { e.stopPropagation(); deleteGoal(goal.id!); }} style={{ color: 'var(--accent-danger)' }}><Trash2 size={14} /></button>
                          </div>
                        )}
                      </div>

                      {goal.description && (
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                          {goal.description}
                        </p>
                      )}

                      {/* Progress Bar */}
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>Progress</span>
                          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>{goal.progress}%</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${goal.progress}%` }} />
                        </div>
                      </div>

                      {/* Progress Slider */}
                      <input
                        type="range" min="0" max="100" value={goal.progress}
                        onChange={e => updateProgress(goal, parseInt(e.target.value))}
                        style={{ width: '100%', marginTop: '4px' }}
                      />

                      {/* Milestones */}
                      {goal.milestones.length > 0 && (
                        <div style={{ marginTop: '12px' }}>
                          <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                            Milestones
                          </div>
                          {goal.milestones.map((ms: GoalMilestone, i: number) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', fontSize: 'var(--font-size-sm)' }}>
                              <span style={{ color: ms.completed ? 'var(--accent-success)' : 'var(--text-tertiary)' }}>
                                {ms.completed ? '✓' : '○'}
                              </span>
                              <span style={{ textDecoration: ms.completed ? 'line-through' : 'none', color: ms.completed ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
                                {ms.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <div className="section mt-24">
              <h2 className="section-title mb-16" style={{ color: 'var(--text-tertiary)' }}>Completed Goals</h2>
              <div className="card" style={{ padding: 0, opacity: 0.7 }}>
                {completedGoals.map((goal: Goal) => (
                  <div key={goal.id} className="list-item" style={{ cursor: isBatchMode ? 'pointer' : 'default' }} onClick={() => isBatchMode && toggleSelect(goal.id!)}>
                    {isBatchMode && (
                      <div style={{ marginRight: '12px', color: selectedIds.has(goal.id!) ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}>
                        {selectedIds.has(goal.id!) ? <CheckSquare size={20} /> : <Square size={20} />}
                      </div>
                    )}
                    <div className="list-icon" style={{ background: 'var(--accent-success-soft)', color: 'var(--accent-success)' }}>
                      <Check size={18} />
                    </div>
                    <div className="list-content">
                      <div className="list-title" style={{ textDecoration: 'line-through' }}>{goal.title}</div>
                      <div className="list-subtitle">{format(new Date(goal.targetDate), 'MMMM d, yyyy')}</div>
                    </div>
                    {!isBatchMode && (
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={(e: React.MouseEvent) => { e.stopPropagation(); toggleComplete(goal); }} title="Mark incomplete">↩</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Goal Modal */}
      {showForm && (
        <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal">
            <h2 className="modal-title">{editingId ? 'Edit Goal' : 'Add Goal'}</h2>

            <div className="form-group">
              <label className="form-label">Goal Title</label>
              <input className="form-input" value={form.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, title: e.target.value })} placeholder="e.g. 6 months on HRT" />
            </div>

            <div className="form-group">
              <label className="form-label">Target Date <span style={{color: 'var(--accent-danger)'}}>*</span></label>
              <input className="form-input" type="date" value={format(new Date(form.targetDate), 'yyyy-MM-dd')} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, targetDate: new Date(e.target.value).getTime() })} />
            </div>

            <button 
              type="button" 
              onClick={() => setShowOptionalFields(!showOptionalFields)} 
              style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', marginBottom: '16px', fontWeight: 'bold' }}>
              {showOptionalFields ? '▼ Hide Optional Fields' : '▶ Show Optional Fields'}
            </button>

            {showOptionalFields && (
              <>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={form.category} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, category: e.target.value })}>
                    {categoryOptions.map((c: string) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Description (optional)</span>
                    <span style={{ fontSize: '0.8em', color: 'var(--text-tertiary)' }}>{form.description?.length || 0}/500</span>
                  </label>
                  <textarea className="form-textarea" maxLength={500} value={form.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, description: e.target.value })} placeholder="What does this goal mean to you?" />
                </div>

                {/* Milestones */}
                <div className="form-group">
                  <label className="form-label">Milestones</label>
                  {form.milestones.map((ms: GoalMilestone, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => toggleMilestoneComplete(i)}>
                        {ms.completed ? '✓' : '○'}
                      </button>
                      <span style={{ flex: 1, fontSize: 'var(--font-size-sm)' }}>{ms.title}</span>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => removeMilestone(i)} style={{ color: 'var(--accent-danger)' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input className="form-input" value={newMilestone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMilestone(e.target.value)} placeholder="Add a milestone..." onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && addMilestone()} />
                    <button className="btn btn-secondary btn-sm" onClick={addMilestone}>Add</button>
                  </div>
                </div>
              </>
            )}

            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveGoal}>
                {editingId ? 'Save Changes' : 'Add Goal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
