'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Medication, type DoseLog } from '@/lib/db';
import { format } from 'date-fns';
import {
  Plus, Pill, Check, X, Clock, Edit2, Trash2, AlertCircle, CalendarCheck,
} from 'lucide-react';

const routeOptions = ['oral', 'sublingual', 'injection', 'transdermal', 'topical', 'gel', 'patch', 'implant', 'rectal'];
const unitOptions = ['mg', 'ml', 'mcg', 'patch', 'pump', 'IU'];
const defaultColors = ['#7c5cfc', '#ff6b9d', '#22c997', '#f5a623', '#4da6ff', '#b44dff', '#ff8a50', '#69db7c'];

const emptyMed: Omit<Medication, 'id'> = {
  name: '', type: '', defaultDose: 0, defaultUnit: 'mg', route: 'oral',
  color: '#7c5cfc', scheduleHours: 24, scheduleUnit: 'hours', scheduleTime: '09:00',
  active: true, notes: '', createdAt: Date.now(),
};

export default function MedicationsPage() {
  const medications = useLiveQuery(() => db.medications.toArray()) || [];
  const doseLogs = useLiveQuery(() => db.doseLogs.orderBy('takenAt').reverse().limit(50).toArray()) || [];

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Omit<Medication, 'id'>>(emptyMed);
  
  const [showDoseModal, setShowDoseModal] = useState(false);
  const [doseForMed, setDoseForMed] = useState<Medication | null>(null);
  const [editingDoseId, setEditingDoseId] = useState<number | null>(null);
  const [doseForm, setDoseForm] = useState({ 
    dose: 0, 
    unit: 'mg', 
    notes: '', 
    forgotten: false,
    takenAtDate: format(Date.now(), 'yyyy-MM-dd'),
    takenAtTime: format(Date.now(), 'HH:mm')
  });

  const [scheduleInputValue, setScheduleInputValue] = useState(24);

  const [batchMode, setBatchMode] = useState(false);
  const [selectedDoses, setSelectedDoses] = useState<Set<number>>(new Set());
  const [batchEnabled, setBatchEnabled] = useState(false);

  const [formError, setFormError] = useState('');
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [doseError, setDoseError] = useState('');

  useEffect(() => {
    setBatchEnabled(localStorage.getItem('hrt_batch_delete') === 'true');
  }, []);

  function openAddForm() {
    setFormError('');
    setShowOptionalFields(false);
    setForm({ ...emptyMed, createdAt: Date.now(), color: defaultColors[medications.length % defaultColors.length] });
    setScheduleInputValue(24);
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(med: Medication) {
    setFormError('');
    setShowOptionalFields(false);
    setForm({ ...med, scheduleUnit: med.scheduleUnit || 'hours' });
    setScheduleInputValue(med.scheduleUnit === 'days' ? med.scheduleHours / 24 : med.scheduleHours);
    setEditingId(med.id!);
    setShowForm(true);
  }

  async function saveMedication() {
    if (!form.name.trim()) { setFormError('Name is required.'); return; }
    if (!form.type.trim()) { setFormError('Type / Category is required.'); return; }
    if (form.defaultDose === 0 || isNaN(form.defaultDose)) { setFormError('A valid dosage amount is required.'); return; }
    if (scheduleInputValue <= 0 || isNaN(scheduleInputValue)) { setFormError('A valid interval is required.'); return; }
    
    setFormError('');
    const computedHours = form.scheduleUnit === 'days' ? scheduleInputValue * 24 : scheduleInputValue;
    const finalForm = { ...form, scheduleHours: computedHours };

    if (editingId) {
      await db.medications.update(editingId, finalForm);
    } else {
      await db.medications.add(finalForm);
    }
    setShowForm(false);
    setEditingId(null);
  }

  async function deleteMedication(id: number) {
    if (confirm('Delete this medication and all its dose logs?')) {
      await db.medications.delete(id);
      await db.doseLogs.where('medicationId').equals(id).delete();
    }
  }

  function openDoseLog(med: Medication) {
    setDoseError('');
    setDoseForMed(med);
    setDoseForm({ 
      dose: med.defaultDose, 
      unit: med.defaultUnit, 
      notes: '', 
      forgotten: false,
      takenAtDate: format(Date.now(), 'yyyy-MM-dd'),
      takenAtTime: format(Date.now(), 'HH:mm')
    });
    setEditingDoseId(null);
    setShowDoseModal(true);
  }

  function openEditDoseLog(dose: DoseLog, med: Medication | undefined) {
    if (!med) return;
    setDoseError('');
    setDoseForMed(med);
    const doseDate = new Date(dose.takenAt);
    setDoseForm({ 
      dose: dose.dose, 
      unit: dose.unit, 
      notes: dose.notes, 
      forgotten: dose.forgotten,
      takenAtDate: format(doseDate, 'yyyy-MM-dd'),
      takenAtTime: format(doseDate, 'HH:mm')
    });
    setEditingDoseId(dose.id!);
    setShowDoseModal(true);
  }

  async function saveDoseLog() {
    if (!doseForMed) return;
    if (doseForm.dose === 0 && !doseForm.forgotten) { setDoseError('A valid dose amount is required.'); return; }
    
    setDoseError('');
    
    // Parse combined date and time
    const dateTimeString = `${doseForm.takenAtDate}T${doseForm.takenAtTime}`;
    let finalTakenAt = Date.now();
    try {
      finalTakenAt = new Date(dateTimeString).getTime();
      if (isNaN(finalTakenAt)) finalTakenAt = Date.now();
    } catch(e) {}

    if (editingDoseId) {
      await db.doseLogs.update(editingDoseId, {
        dose: doseForm.dose,
        unit: doseForm.unit,
        notes: doseForm.notes,
        forgotten: doseForm.forgotten,
        takenAt: finalTakenAt,
      });
    } else {
      await db.doseLogs.add({
        medicationId: doseForMed.id!,
        medicationName: doseForMed.name,
        dose: doseForm.dose,
        unit: doseForm.unit,
        route: doseForMed.route,
        takenAt: finalTakenAt,
        forgotten: doseForm.forgotten,
        late: false,
        notes: doseForm.notes,
      });
    }
    setShowDoseModal(false);
    setEditingDoseId(null);
  }

  async function deleteDoseLog(id: number) {
    if (confirm('Delete this dose record?')) {
      await db.doseLogs.delete(id);
    }
  }

  async function batchDeleteSelected() {
    if (selectedDoses.size === 0) return;
    if (confirm(`WARNING: Please make sure you have backed up your data first!\n\nAre you sure you want to delete these ${selectedDoses.size} selected doses?`)) {
      await Promise.all(Array.from(selectedDoses).map(id => db.doseLogs.delete(id)));
      setSelectedDoses(new Set());
      setBatchMode(false);
    }
  }

  function toggleDoseSelect(id: number) {
    const nextSet = new Set(selectedDoses);
    if (nextSet.has(id)) nextSet.delete(id);
    else nextSet.add(id);
    setSelectedDoses(nextSet);
  }

  async function markForgotten(med: Medication) {
    await db.doseLogs.add({
      medicationId: med.id!,
      medicationName: med.name,
      dose: 0,
      unit: med.defaultUnit,
      route: med.route,
      takenAt: Date.now(),
      forgotten: true,
      late: false,
      notes: 'Marked as skipped/forgotten',
    });
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Medications</h1>
          <p className="page-subtitle">Manage your medications and log doses</p>
        </div>
        <button className="btn btn-primary" onClick={openAddForm}>
          <Plus size={16} /> Add Medication
        </button>
      </div>

      {/* Medication List */}
      {medications.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><Pill size={28} /></div>
            <div className="empty-state-title">No medications yet</div>
            <div className="empty-state-desc">Add your first medication to start tracking doses and schedules.</div>
            <button className="btn btn-primary" onClick={openAddForm}>
              <Plus size={16} /> Add Medication
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {medications.map((med: Medication) => (
            <div key={med.id} className="list-item" style={{ padding: '16px', gap: '16px', alignItems: 'center' }}>
              <div style={{
                width: '46px', height: '46px', borderRadius: '14px',
                background: `linear-gradient(135deg, ${med.color}30, ${med.color}10)`,
                color: med.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 12px ${med.color}15`
              }}>
                <Pill size={24} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
              </div>
              <div className="list-content" style={{ flex: 1 }}>
                <div className="list-title" style={{ fontSize: '1.1rem', fontWeight: 600 }}>{med.name}</div>
                <div className="list-subtitle" style={{ fontSize: '0.85rem', marginTop: '2px' }}>
                  {med.defaultDose}{med.defaultUnit} · {med.route}<br/>
                  Every {med.scheduleHours < 24 ? `${med.scheduleHours} hrs` : `${Math.round(med.scheduleHours/24)} days`}
                </div>
              </div>
              <div className="list-actions" style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-ghost btn-icon" onClick={() => openEditForm(med)} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-secondary)', border: 'none' }} title="Edit">
                  <Edit2 size={16} />
                </button>
                <button className="btn btn-primary btn-icon" onClick={() => openDoseLog(med)} style={{ width: '36px', height: '36px', borderRadius: '50%', background: med.color, color: '#fff', border: 'none', boxShadow: `0 4px 12px ${med.color}40` }} title="Log Dose">
                  <Check size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dose History */}
      {doseLogs.length > 0 && (
        <div className="section mt-24">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="section-title">Dose History</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              {batchEnabled && (
                batchMode ? (
                  <>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setBatchMode(false); setSelectedDoses(new Set()); }}>Cancel</button>
                    <button className="btn btn-danger btn-sm" onClick={batchDeleteSelected} disabled={selectedDoses.size === 0}>
                      <Trash2 size={14} /> Delete Selected ({selectedDoses.size})
                    </button>
                  </>
                ) : (
                  <button className="btn btn-ghost btn-sm" onClick={() => setBatchMode(true)}>Select Multiple</button>
                )
              )}
            </div>
          </div>
          <div className="card" style={{ padding: 0 }}>
            {doseLogs.map((dose: DoseLog) => {
              const medReference = medications.find((m: Medication) => m.id === dose.medicationId);
              return (
                <div key={dose.id} className="list-item" onClick={() => batchMode && toggleDoseSelect(dose.id!)} style={{ cursor: batchMode ? 'pointer' : 'default' }}>
                  {batchMode && (
                    <input 
                      type="checkbox" 
                      checked={selectedDoses.has(dose.id!)} 
                      onChange={() => toggleDoseSelect(dose.id!)}
                      style={{ marginRight: '8px', cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                    />
                  )}
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
                      {dose.dose} {dose.unit} · {dose.route} · {format(new Date(dose.takenAt), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                  {!batchMode && (
                    <div className="list-actions">
                      {medReference && (
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEditDoseLog(dose, medReference)}><Edit2 size={14} /></button>
                      )}
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteDoseLog(dose.id!)} style={{ color: 'var(--accent-danger)' }}><Trash2 size={14} /></button>
                    </div>
                  )}
                  {batchMode && (
                    <span className={`badge ${dose.forgotten ? 'badge-forgotten' : 'badge-taken'}`}>
                      {dose.forgotten ? 'Missed' : 'Taken'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add/Edit Medication Modal */}
      {showForm && (
        <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal">
            <h2 className="modal-title">{editingId ? 'Edit Medication' : 'Add Medication'}</h2>
            
            {formError && <div style={{ color: 'var(--accent-danger)', fontSize: '0.9rem', marginBottom: '1rem' }}>{formError}</div>}

            <div className="ios-form-group">
              <div className="ios-form-row">
                <label className="ios-form-label">Name <span style={{color: 'var(--accent-danger)'}}>*</span></label>
                <input className="ios-form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Estradiol Valerate" />
              </div>

              <div className="ios-form-row">
                <label className="ios-form-label">Category <span style={{color: 'var(--accent-danger)'}}>*</span></label>
                <input className="ios-form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} placeholder="e.g. Estrogen, Anti-androgen" />
              </div>

              <div className="ios-form-row">
                <label className="ios-form-label">Dosage <span style={{color: 'var(--accent-danger)'}}>*</span></label>
                <div style={{ display: 'flex', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
                  <input className="ios-form-input" type="number" step="0.01" value={form.defaultDose || ''} onChange={e => setForm({ ...form, defaultDose: parseFloat(e.target.value) || 0 })} style={{ width: '60px' }} />
                  <select className="ios-form-select" value={form.defaultUnit} onChange={e => setForm({ ...form, defaultUnit: e.target.value })} style={{ width: '70px' }}>
                    {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="ios-form-row">
                <label className="ios-form-label">Interval <span style={{color: 'var(--accent-danger)'}}>*</span></label>
                <div style={{ display: 'flex', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
                  <input className="ios-form-input" type="number" step="any" value={scheduleInputValue || ''} onChange={e => setScheduleInputValue(parseFloat(e.target.value) || 0)} style={{ width: '60px' }} />
                  <select className="ios-form-select" value={form.scheduleUnit || 'hours'} onChange={e => setForm({ ...form, scheduleUnit: e.target.value })} style={{ width: '80px' }}>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
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
                  <label className="ios-form-label">Route</label>
                  <select className="ios-form-select" value={form.route} onChange={e => setForm({ ...form, route: e.target.value })}>
                    {routeOptions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="ios-form-row">
                  <label className="ios-form-label">Preferred Time</label>
                  <input className="ios-form-input" type="time" value={form.scheduleTime} onChange={e => setForm({ ...form, scheduleTime: e.target.value })} />
                </div>
                <div className="ios-form-row">
                  <label className="ios-form-label">Color</label>
                  <input className="form-color-input" type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} style={{ border: 'none', padding: 0, height: '28px', width: '28px', borderRadius: '50%' }} />
                </div>
                <div className="ios-form-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <label className="ios-form-label">Notes</label>
                    <span style={{ fontSize: '0.8em', color: 'var(--text-tertiary)' }}>{form.notes?.length || 0}/500</span>
                  </div>
                  <textarea className="form-textarea" maxLength={500} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any notes about this medication..." style={{ width: '100%', border: 'none', padding: 0, background: 'transparent' }} />
                </div>
              </div>
            )}

            <div className="form-actions" style={{ justifyContent: editingId ? 'space-between' : 'flex-end', width: '100%' }}>
              {editingId && (
                 <button className="btn btn-ghost btn-icon" onClick={() => { deleteMedication(editingId); setShowForm(false); }} style={{ color: 'var(--accent-danger)' }} title="Delete Medication">
                   <Trash2 size={20} />
                 </button>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={saveMedication}>
                  {editingId ? 'Save Changes' : 'Add Medication'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log Dose Modal */}
      {showDoseModal && doseForMed && (
        <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowDoseModal(false); }}>
          <div className="modal">
            <h2 className="modal-title">{editingDoseId ? 'Edit Dose Log' : 'Log Dose'} — {doseForMed.name}</h2>
            
            {doseError && <div style={{ color: 'var(--accent-danger)', fontSize: '0.9rem', marginBottom: '1rem' }}>{doseError}</div>}

            <div className="ios-form-group">
              <div className="ios-form-row">
                <label className="ios-form-label">Date <span style={{color: 'var(--accent-danger)'}}>*</span></label>
                <input className="ios-form-input" type="date" value={doseForm.takenAtDate} onChange={e => setDoseForm({ ...doseForm, takenAtDate: e.target.value })} />
              </div>
              <div className="ios-form-row">
                <label className="ios-form-label">Time <span style={{color: 'var(--accent-danger)'}}>*</span></label>
                <input className="ios-form-input" type="time" value={doseForm.takenAtTime} onChange={e => setDoseForm({ ...doseForm, takenAtTime: e.target.value })} />
              </div>
              <div className="ios-form-row">
                <label className="ios-form-label">Dose <span style={{color: 'var(--accent-danger)'}}>*</span></label>
                <div style={{ display: 'flex', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
                  <input className="ios-form-input" type="number" step="0.01" value={doseForm.dose === 0 && doseForm.forgotten ? '' : doseForm.dose} onChange={e => setDoseForm({ ...doseForm, dose: parseFloat(e.target.value) || 0 })} disabled={doseForm.forgotten} style={{ width: '60px' }} />
                  <select className="ios-form-select" value={doseForm.unit} onChange={e => setDoseForm({ ...doseForm, unit: e.target.value })} disabled={doseForm.forgotten} style={{ width: '70px' }}>
                    {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="ios-form-row">
                <label className="ios-form-label" style={{ width: 'auto' }}>Mark as Missed/Forgotten</label>
                <input type="checkbox" checked={doseForm.forgotten} onChange={e => {
                  const isForgotten = e.target.checked;
                  setDoseForm({ ...doseForm, forgotten: isForgotten, dose: isForgotten ? 0 : doseForMed.defaultDose });
                }} style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)' }} />
              </div>
              <div className="ios-form-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <label className="ios-form-label">Notes</label>
                  <span style={{ fontSize: '0.8em', color: 'var(--text-tertiary)' }}>{doseForm.notes?.length || 0}/500</span>
                </div>
                <textarea className="form-textarea" maxLength={500} value={doseForm.notes} onChange={e => setDoseForm({ ...doseForm, notes: e.target.value })} placeholder="Optional notes..." style={{ width: '100%', border: 'none', padding: 0, background: 'transparent' }} />
              </div>
            </div>

            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setShowDoseModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveDoseLog}>
                <Check size={16} /> Log Dose
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
