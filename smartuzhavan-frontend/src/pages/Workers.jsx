import React, { useState, useEffect, useMemo } from 'react';
import { getData, addRecord, updateRecord, deleteRecord } from '../services/storage';
import { generateId } from '../utils/idGenerator';
import { formatCurrency } from '../utils/formatters';
import { workTypes } from '../data/workTypes';
import InputField from '../components/common/InputField';
import SelectField from '../components/common/SelectField';
import Button from '../components/common/Button';

const Workers = () => {
  const [activeTab, setActiveTab] = useState('tab2');
  const [workers, setWorkers] = useState([]);
  const [entries, setEntries] = useState([]);
  
  // Tab 1 state
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [workerData, setWorkerData] = useState({ name: '', phone: '', village: '' });

  // Tab 2 state
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    selectedWorkerIds: [],
    workType: 'Daily Wage',
    baseSalary: 0,
    bonus: 0,
    extraAmount: 0,
    advance: 0,
    notes: ''
  });
  const [filterWorker, setFilterWorker] = useState('all');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [filterWorkType, setFilterWorkType] = useState('all');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setWorkers(getData('rl_workers'));
    setEntries(getData('rl_work_entries'));
  }, []);

  const handleSaveWorker = (e) => {
    e.preventDefault();
    if (editingWorker) {
      updateRecord('rl_workers', editingWorker.id, workerData);
      setEditingWorker(null);
    } else {
      addRecord('rl_workers', { ...workerData, id: generateId('rl_workers') });
    }
    setWorkers(getData('rl_workers'));
    setShowAddWorker(false);
    setWorkerData({ name: '', phone: '', village: '' });
  };

  const netPayable = (parseFloat(formData.baseSalary) || 0) + (parseFloat(formData.bonus) || 0) + (parseFloat(formData.extraAmount) || 0) - (parseFloat(formData.advance) || 0);

  const handleSaveEntry = (e) => {
    e.preventDefault();
    if (formData.selectedWorkerIds.length === 0) {
      setError('குறைந்தது ஒரு வேலையாள் தேர்வு செய்யவும் (Select at least one worker)');
      return;
    }
    formData.selectedWorkerIds.forEach(workerId => {
      const entry = {
        id: generateId('rl_work_entries'),
        workerId,
        date: formData.date,
        workType: formData.workType,
        baseSalary: parseFloat(formData.baseSalary) || 0,
        bonus: parseFloat(formData.bonus) || 0,
        extraAmount: parseFloat(formData.extraAmount) || 0,
        advance: parseFloat(formData.advance) || 0,
        notes: formData.notes
      };
      addRecord('rl_work_entries', entry);
    });
    setEntries(getData('rl_work_entries'));
    setShowAddForm(false);
    setSuccess(`${formData.selectedWorkerIds.length} வேலையாட்கள் சேமிக்கப்பட்டனர்`);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      selectedWorkerIds: [],
      workType: 'Daily Wage',
      baseSalary: 0,
      bonus: 0,
      extraAmount: 0,
      advance: 0,
      notes: ''
    });
    setTimeout(() => { setSuccess(''); setError(''); }, 3000);
  };

  const handleWorkerCheck = (id) => {
    setFormData(prev => {
      const isSelected = prev.selectedWorkerIds.includes(id);
      return {
        ...prev,
        selectedWorkerIds: isSelected 
          ? prev.selectedWorkerIds.filter(wid => wid !== id)
          : [...prev.selectedWorkerIds, id]
      };
    });
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const matchWorker = filterWorker === 'all' || e.workerId === filterWorker || e.workerName === filterWorker;
      const matchFrom = !filterFromDate || e.date >= filterFromDate;
      const matchTo = !filterToDate || e.date <= filterToDate;
      const matchType = filterWorkType === 'all' || e.workType === filterWorkType;
      return matchWorker && matchFrom && matchTo && matchType;
    });
  }, [entries, filterWorker, filterFromDate, filterToDate, filterWorkType]);

  const handlePDF = async (type) => {
    const url = import.meta.env.VITE_PDF_API_URL || 'https://smartuzhavan-production.up.railway.app/api/pdf';
    let endpoint = '';
    let payload = {};

    if (type === 'individual') {
      if (filterWorker === 'all') {
        alert('Please select a specific worker first.');
        return;
      }
      endpoint = `${url}/worker/individual`;
      const worker = workers.find(w => w.id === filterWorker) || { name: filterWorker };
      payload = { worker, entries: filteredEntries };
    } else if (type === 'filtered') {
      endpoint = `${url}/worker/filtered`;
      payload = { entries: filteredEntries, filters: { worker: filterWorker, from: filterFromDate, to: filterToDate, type: filterWorkType } };
    } else {
      endpoint = `${url}/worker/overall`;
      const summary = workers.map(w => {
        const wEntries = entries.filter(e => e.workerId === w.id);
        const totalDays = wEntries.length;
        const totalEarned = wEntries.reduce((sum, e) => sum + ((e.baseSalary||0) + (e.bonus||0) + (e.extraAmount||0) - (e.advance||0)), 0);
        return { name: w.name, totalDays, totalEarned };
      });
      payload = { summary };
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('PDF generation failed');
      const blob = await response.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `worker_report_${type}.pdf`;
      a.click();
    } catch (err) {
      alert('Error generating PDF');
    }
  };

  return (
    <div className="app-container">
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('tab1')} style={{ flex: 1, padding: '10px', background: activeTab === 'tab1' ? '#1B3A6B' : '#EDF2F7', color: activeTab === 'tab1' ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Workers (வேலையாட்கள்)</button>
        <button onClick={() => setActiveTab('tab2')} style={{ flex: 1, padding: '10px', background: activeTab === 'tab2' ? '#1B3A6B' : '#EDF2F7', color: activeTab === 'tab2' ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Work Records (வேலை பதிவு)</button>
      </div>

      {activeTab === 'tab1' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{margin: 0}}>Workers</h2>
            {!showAddWorker && <Button onClick={() => setShowAddWorker(true)}>+ Add Worker</Button>}
          </div>
          {showAddWorker && (
            <form onSubmit={handleSaveWorker} className="card">
              <h3>{editingWorker ? 'Edit Worker' : 'New Worker'}</h3>
              <InputField english="Name" tamil="பெயர்" value={workerData.name} onChange={e => setWorkerData({...workerData, name: e.target.value})} required />
              <InputField english="Village" tamil="ஊர்" value={workerData.village} onChange={e => setWorkerData({...workerData, village: e.target.value})} />
              <InputField english="Phone" tamil="தொலைபேசி" value={workerData.phone} onChange={e => setWorkerData({...workerData, phone: e.target.value})} />
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <Button type="submit" fullWidth>Save</Button>
                <Button onClick={() => { setShowAddWorker(false); setEditingWorker(null); }} variant="danger" fullWidth>Cancel</Button>
              </div>
            </form>
          )}
          <div className="list-container">
            {workers.map(w => (
              <div key={w.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{fontWeight: 'bold'}}>{w.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#718096' }}>{w.village || 'No Village'} | {w.phone || 'No Phone'}</div>
                </div>
                <button onClick={() => { setWorkerData(w); setEditingWorker(w); setShowAddWorker(true); }} style={{ background: 'none', border: 'none', color: '#1A6B55', cursor: 'pointer', fontWeight: 'bold' }}>Edit</button>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'tab2' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{margin: 0}}>Work Records</h2>
            {!showAddForm && <Button onClick={() => setShowAddForm(true)}>+ New Entry</Button>}
          </div>

          {success && <div className="success-message">{success}</div>}
          {error && <div style={{ color: '#C53030', background: '#FFF5F5', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '0.85rem', textAlign: 'center', fontWeight: 'bold' }}>{error}</div>}

          {showAddForm && (
            <form onSubmit={handleSaveEntry} className="card">
              <h3>Daily Work Entry (தினசரி வேலை பதிவு)</h3>
              <InputField english="Date" tamil="தேதி" type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Select Workers (வேலையாட்கள்)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#F7FAFC', padding: '10px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                  {workers.map(w => (
                    <label key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={formData.selectedWorkerIds.includes(w.id)} onChange={() => handleWorkerCheck(w.id)} style={{width: '18px', height: '18px'}} />
                      {w.name}
                    </label>
                  ))}
                </div>
              </div>

              <SelectField english="Work Type" tamil="வேலை வகை" options={workTypes} value={formData.workType} onChange={(e) => setFormData({...formData, workType: e.target.value})} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <InputField english="Base Salary" tamil="சம்பளம்" type="number" value={formData.baseSalary} onChange={(e) => setFormData({...formData, baseSalary: e.target.value})} required />
                <InputField english="Bonus" tamil="போனஸ்" type="number" value={formData.bonus} onChange={(e) => setFormData({...formData, bonus: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <InputField english="Extra" tamil="கூடுதல்" type="number" value={formData.extraAmount} onChange={(e) => setFormData({...formData, extraAmount: e.target.value})} />
                <InputField english="Advance" tamil="முன்பணம்" type="number" value={formData.advance} onChange={(e) => setFormData({...formData, advance: e.target.value})} />
              </div>
              <InputField english="Notes" tamil="குறிப்பு" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />

              <div style={{ padding: '15px', background: netPayable >= 0 ? '#F0FFF4' : '#FFF5F5', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: netPayable >= 0 ? '#1A6B55' : '#C53030' }}>Net Payable: {formatCurrency(netPayable)}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button type="submit" fullWidth>Save (சேமி)</Button>
                <Button onClick={() => setShowAddForm(false)} variant="danger" fullWidth>Cancel (ரத்து)</Button>
              </div>
            </form>
          )}

          <div className="card" style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#4A5568' }}>Filters (வடிகட்டி)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <SelectField options={[{value:'all', label:'All Workers'}].concat(workers.map(w=>({value:w.id, label:w.name})))} value={filterWorker} onChange={e=>setFilterWorker(e.target.value)} />
              <SelectField options={[{value:'all', label:'All Work Types'}].concat(workTypes)} value={filterWorkType} onChange={e=>setFilterWorkType(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '0.8rem', color: '#718096', marginBottom: '4px' }}>From Date</label>
                <input type="date" value={filterFromDate} onChange={e=>setFilterFromDate(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E0', width: '100%' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '0.8rem', color: '#718096', marginBottom: '4px' }}>To Date</label>
                <input type="date" value={filterToDate} onChange={e=>setFilterToDate(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E0', width: '100%' }} />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
              <Button onClick={() => handlePDF('individual')} variant="outline" disabled={filterWorker==='all' || filteredEntries.length===0} style={{flex: 1, minWidth: '150px'}}>Individual PDF</Button>
              <Button onClick={() => handlePDF('filtered')} variant="outline" disabled={filteredEntries.length===0} style={{flex: 1, minWidth: '150px'}}>Filtered PDF</Button>
              <Button onClick={() => handlePDF('overall')} variant="outline" style={{flex: 1, minWidth: '150px'}}>Overall PDF</Button>
            </div>
          </div>

          <div className="list-container">
            {filteredEntries.map(entry => {
              const net = (parseFloat(entry.baseSalary)||0) + (parseFloat(entry.bonus)||0) + (parseFloat(entry.extraAmount)||0) - (parseFloat(entry.advance)||0);
              const workerName = workers.find(w => w.id === entry.workerId)?.name || entry.workerName || 'Unknown';
              return (
                <div key={entry.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{workerName} {entry.workerName && <span style={{ fontSize: '0.7rem', background: '#EDF2F7', padding: '2px 4px', borderRadius: '4px', color: '#718096' }}>Legacy</span>}</div>
                      <div style={{ fontSize: '0.8rem', color: '#718096' }}>{entry.date} | {entry.workType}</div>
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#1A6B55' }}>{formatCurrency(net)}</div>
                  </div>
                  <div style={{ fontSize: '0.75rem', marginTop: '5px', color: '#718096' }}>
                    Base: {entry.baseSalary} | Bonus: {entry.bonus} | Adv: {entry.advance}
                  </div>
                </div>
              );
            })}
            {filteredEntries.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#A0AEC0' }}>No records found</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Workers;
