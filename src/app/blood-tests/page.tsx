'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type BloodTest } from '@/lib/db';
import { format } from 'date-fns';
import { Plus, TestTubes, Edit2, Trash2, CheckSquare, Square, AlertTriangle } from 'lucide-react';
import { HormoneLevelChart } from '@/components/charts/HormoneLevelChart';

// Common hormones as suggestions — users can type any custom hormone name
const hormoneSuggestions = [
  'Estradiol (E2)', 'Estrone (E1)', 'Testosterone (T)', 'Free Testosterone',
  'Progesterone (P4)', 'SHBG', 'LH', 'FSH', 'Prolactin', 'DHT',
  'DHEA-S', 'Albumin', 'Cortisol', 'TSH', 'Free T3', 'Free T4',
];

const unitOptions = ['pg/mL', 'ng/dL', 'nmol/L', 'pmol/L', 'mIU/mL', 'μg/dL', 'ng/mL', 'IU/L'];

const emptyTest: Omit<BloodTest, 'id'> = {
  testDate: Date.now(), hormone: 'Estradiol (E2)', value: 0, unit: 'pg/mL',
  referenceMin: undefined, referenceMax: undefined,
  lab: '', notes: '', createdAt: Date.now(),
};

export default function BloodTestsPage() {
  const bloodTests = useLiveQuery(() => db.bloodTests.orderBy('testDate').reverse().toArray()) || [];
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchEnabled, setBatchEnabled] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  useEffect(() => {
    setBatchEnabled(localStorage.getItem('hrt_batch_delete') === 'true');
  }, []);
  const [form, setForm] = useState<Omit<BloodTest, 'id'>>(emptyTest);

  function openAddForm() {
    setShowOptionalFields(false);
    setForm({ ...emptyTest, testDate: Date.now(), createdAt: Date.now() });
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(test: BloodTest) {
    setShowOptionalFields(false);
    setForm({ ...test });
    setEditingId(test.id!);
    setShowForm(true);
  }

  async function saveTest() {
    if (form.value <= 0) return;
    if (editingId) {
      await db.bloodTests.update(editingId, form);
    } else {
      await db.bloodTests.add(form);
    }
    setShowForm(false);
    setEditingId(null);
  }

  async function deleteTest(id: number) {
    if (confirm('Delete this blood test result?')) {
      await db.bloodTests.delete(id);
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
    if (confirm(`WARNING: You are about to delete ${selectedIds.size} blood test results.\n\nAre you sure you want to proceed?`)) {
      await db.bloodTests.bulkDelete(Array.from(selectedIds));
      setIsBatchMode(false);
      setSelectedIds(new Set());
    }
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Blood Tests</h1>
          <p className="page-subtitle">Track your hormone levels over time</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {batchEnabled && bloodTests.length > 0 && (
            <button className={`btn ${isBatchMode ? 'btn-primary' : 'btn-ghost'}`} onClick={() => {
              setIsBatchMode(!isBatchMode);
              setSelectedIds(new Set());
            }}>
              {isBatchMode ? 'Cancel' : 'Select Multiple'}
            </button>
          )}
          {!isBatchMode && (
            <button className="btn btn-primary" onClick={openAddForm}>
              <Plus size={16} /> Add Result
            </button>
          )}
        </div>
      </div>

      {isBatchMode && (
        <div className="card mb-16" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--accent-danger-soft)', border: '1px solid var(--accent-danger)' }}>
          <div>
            <span style={{ fontWeight: 600 }}>{selectedIds.size} selected</span>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>Select multiple results to batch delete.</div>
          </div>
          <button className="btn" style={{ background: 'var(--accent-danger)', color: 'white' }} disabled={selectedIds.size === 0} onClick={batchDeleteSelected}>
            <AlertTriangle size={16} /> Batch Delete
          </button>
        </div>
      )}

      {/* Chart */}
      {bloodTests.length > 0 && !isBatchMode && (
        <div className="card mb-16">
          <div className="card-header">
            <h3 className="card-title">Hormone Trends</h3>
          </div>
          <HormoneLevelChart data={bloodTests} />
        </div>
      )}

      {/* Test Results List */}
      {bloodTests.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><TestTubes size={28} /></div>
            <div className="empty-state-title">No blood tests yet</div>
            <div className="empty-state-desc">Log your blood test results to track hormone levels over time.</div>
            <button className="btn btn-primary" onClick={openAddForm}>
              <Plus size={16} /> Add First Result
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {bloodTests.map((test) => (
            <div key={test.id} className="list-item" style={{ cursor: isBatchMode ? 'pointer' : 'default' }} onClick={() => isBatchMode && toggleSelect(test.id!)}>
              {isBatchMode && (
                <div style={{ marginRight: '12px', color: selectedIds.has(test.id!) ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}>
                  {selectedIds.has(test.id!) ? <CheckSquare size={20} /> : <Square size={20} />}
                </div>
              )}
              <div className="list-icon" style={{ background: 'var(--accent-success-soft)', color: 'var(--accent-success)' }}>
                <TestTubes size={18} />
              </div>
              <div className="list-content">
                <div className="list-title">{test.hormone}</div>
                <div className="list-subtitle">
                  <strong>{test.value} {test.unit}</strong>
                  {test.referenceMin != null && test.referenceMax != null && (
                    <> · Ref: {test.referenceMin}–{test.referenceMax} {test.unit}</>
                  )}
                  {test.lab && <> · {test.lab}</>}
                </div>
                <div className="list-subtitle">
                  {format(new Date(test.testDate), 'MMMM d, yyyy')}
                </div>
              </div>
              {!isBatchMode && (
                <div className="list-actions">
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={(e: React.MouseEvent) => { e.stopPropagation(); openEditForm(test); }}><Edit2 size={14} /></button>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={(e: React.MouseEvent) => { e.stopPropagation(); deleteTest(test.id!); }} style={{ color: 'var(--accent-danger)' }}><Trash2 size={14} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal">
            <h2 className="modal-title">{editingId ? 'Edit Blood Test' : 'Add Blood Test Result'}</h2>

            <div className="ios-form-group">
              <div className="ios-form-row">
                <label className="ios-form-label">Date <span style={{color: 'var(--accent-danger)'}}>*</span></label>
                <input className="ios-form-input" type="date" value={format(new Date(form.testDate), 'yyyy-MM-dd')} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, testDate: new Date(e.target.value).getTime() })} />
              </div>

              <div className="ios-form-row">
                <label className="ios-form-label">Hormone <span style={{color: 'var(--accent-danger)'}}>*</span></label>
                <input className="ios-form-input" list="hormone-suggestions" value={form.hormone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, hormone: e.target.value })} placeholder="Type or select" />
                <datalist id="hormone-suggestions">
                  {hormoneSuggestions.map((h: string) => <option key={h} value={h} />)}
                </datalist>
              </div>
              
              <div className="ios-form-row">
                <label className="ios-form-label">Value <span style={{color: 'var(--accent-danger)'}}>*</span></label>
                <div style={{ display: 'flex', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
                  <input className="ios-form-input" type="number" step="0.01" value={form.value || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })} placeholder="0.0" style={{ width: '80px' }} />
                  <select className="ios-form-select" value={form.unit} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, unit: e.target.value })} style={{ width: '80px' }}>
                    {unitOptions.map((u: string) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <button 
              type="button" 
              onClick={() => setShowOptionalFields(!showOptionalFields)} 
              style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', marginBottom: '16px', fontWeight: 'bold' }}>
              {showOptionalFields ? '▼ Hide Optional Fields' : '▶ Show Optional Fields'}
            </button>

            {showOptionalFields && (
              <div className="ios-form-group">
                <div className="ios-form-row">
                  <label className="ios-form-label">Ref. Min</label>
                  <input className="ios-form-input" type="number" step="0.01" value={form.referenceMin || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, referenceMin: parseFloat(e.target.value) || undefined })} placeholder="Optional" />
                </div>
                <div className="ios-form-row">
                  <label className="ios-form-label">Ref. Max</label>
                  <input className="ios-form-input" type="number" step="0.01" value={form.referenceMax || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, referenceMax: parseFloat(e.target.value) || undefined })} placeholder="Optional" />
                </div>
                <div className="ios-form-row">
                  <label className="ios-form-label">Lab</label>
                  <input className="ios-form-input" value={form.lab} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, lab: e.target.value })} placeholder="e.g. Quest Diagnostics" />
                </div>
                <div className="ios-form-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <label className="ios-form-label">Notes</label>
                    <span style={{ fontSize: '0.8em', color: 'var(--text-tertiary)' }}>{form.notes?.length || 0}/500</span>
                  </div>
                  <textarea className="form-textarea" maxLength={500} value={form.notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, notes: e.target.value })} placeholder="Any additional notes..." style={{ width: '100%', border: 'none', padding: 0, background: 'transparent' }} />
                </div>
              </div>
            )}

            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveTest}>
                {editingId ? 'Save Changes' : 'Add Result'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
