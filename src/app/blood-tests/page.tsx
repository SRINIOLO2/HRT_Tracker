'use client';

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type BloodTest } from '@/lib/db';
import { format } from 'date-fns';
import { Plus, TestTubes, Edit2, Trash2 } from 'lucide-react';
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
  const [form, setForm] = useState<Omit<BloodTest, 'id'>>(emptyTest);

  function openAddForm() {
    setForm({ ...emptyTest, testDate: Date.now(), createdAt: Date.now() });
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(test: BloodTest) {
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

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Blood Tests</h1>
          <p className="page-subtitle">Track your hormone levels over time</p>
        </div>
        <button className="btn btn-primary" onClick={openAddForm}>
          <Plus size={16} /> Add Result
        </button>
      </div>

      {/* Chart */}
      {bloodTests.length > 0 && (
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
            <div key={test.id} className="list-item">
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
              <div className="list-actions">
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEditForm(test)}><Edit2 size={14} /></button>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteTest(test.id!)} style={{ color: 'var(--accent-danger)' }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editingId ? 'Edit Blood Test' : 'Add Blood Test Result'}</h2>

            <div className="form-group">
              <label className="form-label">Test Date</label>
              <input className="form-input" type="date" value={format(new Date(form.testDate), 'yyyy-MM-dd')} onChange={e => setForm({ ...form, testDate: new Date(e.target.value).getTime() })} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Hormone</label>
                <input className="form-input" list="hormone-suggestions" value={form.hormone} onChange={e => setForm({ ...form, hormone: e.target.value })} placeholder="Type or select a hormone" />
                <datalist id="hormone-suggestions">
                  {hormoneSuggestions.map(h => <option key={h} value={h} />)}
                </datalist>
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <select className="form-select" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                  {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Value</label>
              <input className="form-input" type="number" step="0.01" value={form.value || ''} onChange={e => setForm({ ...form, value: parseFloat(e.target.value) || 0 })} placeholder="Enter test value" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Reference Min (optional)</label>
                <input className="form-input" type="number" step="0.01" value={form.referenceMin || ''} onChange={e => setForm({ ...form, referenceMin: parseFloat(e.target.value) || undefined })} />
              </div>
              <div className="form-group">
                <label className="form-label">Reference Max (optional)</label>
                <input className="form-input" type="number" step="0.01" value={form.referenceMax || ''} onChange={e => setForm({ ...form, referenceMax: parseFloat(e.target.value) || undefined })} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Lab (optional)</label>
              <input className="form-input" value={form.lab} onChange={e => setForm({ ...form, lab: e.target.value })} placeholder="e.g. Quest Diagnostics" />
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any additional notes..." />
            </div>

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
