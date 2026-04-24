import React, { useState, useEffect } from 'react';
import { getData, addRecord } from '../services/storage';
import { generateId } from '../utils/idGenerator';
import { formatCurrency } from '../utils/formatters';
import { workTypes } from '../data/workTypes';
import InputField from '../components/common/InputField';
import SelectField from '../components/common/SelectField';
import Button from '../components/common/Button';

const Workers = () => {
  const [activeTab, setActiveTab] = useState('records'); // 'workers' or 'records'
  const [workers, setWorkers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [showWorkerForm, setShowWorkerForm] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Worker Form State
  const [workerData, setWorkerData] = useState({ name: '', phone: '', village: '', status: 'active' });
  
  // Entry Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    selectedWorkerIds: [],
    workType: 'Daily Wage',
    baseSalary: 0,
    bonus: 0,
    extraAmount: 0,
    advance: 0,
    description: ''
  });

  // Filters State
  const [filters, setFilters] = useState({
    workerId: 'all',
    fromDate: '',
    toDate: '',
    workType: 'all'
  });

  useEffect(() => {
    const savedWorkers = getData('rl_workers');
    if (savedWorkers.length === 0) {
        const initial = [
            { id: 'W001', name: 'Mani', phone: '', village: '', status: 'active' },
            { id: 'W002', name: 'Selvam', phone: '', village: '', status: 'active' }
        ];
        addRecord('rl_workers', initial[0]);
        addRecord('rl_workers', initial[1]);
        setWorkers(initial);
    } else {
        setWorkers(savedWorkers);
    }
    setEntries(getData('rl_work_entries'));
  }, []);

  const netPayable = (parseFloat(formData.baseSalary) + parseFloat(formData.bonus) + parseFloat(formData.extraAmount)) - parseFloat(formData.advance);

  const handleSaveWorker = (e) => {
    e.preventDefault();
    const newWorker = {
      ...workerData,
      id: generateId('rl_workers')
    };
    addRecord('rl_workers', newWorker);
    setWorkers(getData('rl_workers'));
    setShowWorkerForm(false);
    setWorkerData({ name: '', phone: '', village: '', status: 'active' });
  };

  const handleSaveEntry = (e) => {
    e.preventDefault();
    if (formData.selectedWorkerIds.length === 0) {
      setError('குறைந்தது ஒரு வேலையாள் தேர்வு செய்யவும் (Select at least one worker)');
      return;
    }

    formData.selectedWorkerIds.forEach(workerId => {
      const entry = {
        ...formData,
        id: generateId('rl_work_entries'),
        workerId,
        netPayable,
        status: 'paid'
      };
      delete entry.selectedWorkerIds;
      addRecord('rl_work_entries', entry);
    });

    setEntries(getData('rl_work_entries'));
    setShowEntryForm(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      selectedWorkerIds: [],
      workType: 'Daily Wage',
      baseSalary: 0,
      bonus: 0,
      extraAmount: 0,
      advance: 0,
      description: ''
    });
    setSuccess(`${formData.selectedWorkerIds.length} வேலையாட்கள் சேமிக்கப்பட்டனர் (${formData.selectedWorkerIds.length} workers saved)`);
    setTimeout(() => { setSuccess(''); setError(''); }, 3000);
  };

  const filteredEntries = entries.filter(e => {
    const matchWorker = filters.workerId === 'all' || e.workerId === filters.workerId;
    const matchType = filters.workType === 'all' || e.workType === filters.workType;
    const matchFrom = !filters.fromDate || e.date >= filters.fromDate;
    const matchTo = !filters.toDate || e.date <= filters.toDate;
    return matchWorker && matchType && matchFrom && matchTo;
  });

  return (
    <div className="app-container">
      <h1>வேலையாட்கள் மேலாண்மை (Workers)</h1>
      {error && <div className="error-message" style={{ color: '#E53E3E', background: '#FFF5F5', padding: '10px', borderRadius: '8px', marginBottom: '15px', textAlign: 'center', fontWeight: 'bold' }}>{error}</div>}
      {success && <div className="success-message" style={{ color: '#38A169', background: '#F0FFF4', padding: '10px', borderRadius: '8px', marginBottom: '15px', textAlign: 'center', fontWeight: 'bold' }}>{success}</div>}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('workers')}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'workers' ? '#1B3A6B' : '#E2E8F0', color: activeTab === 'workers' ? 'white' : '#4A5568', fontWeight: 'bold' }}
        >
          Workers (பட்டியல்)
        </button>
        <button 
          onClick={() => setActiveTab('records')}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'records' ? '#1B3A6B' : '#E2E8F0', color: activeTab === 'records' ? 'white' : '#4A5568', fontWeight: 'bold' }}
        >
          Work Records (பதிவுகள்)
        </button>
      </div>

      {activeTab === 'workers' ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>Workers List</h3>
            <Button onClick={() => setShowWorkerForm(true)}>+ Add Worker</Button>
          </div>

          {showWorkerForm && (
            <form onSubmit={handleSaveWorker} className="card">
              <InputField english="Name" tamil="பெயர்" value={workerData.name} onChange={e => setWorkerData({...workerData, name: e.target.value})} required />
              <InputField english="Phone" tamil="தொலைபேசி" value={workerData.phone} onChange={e => setWorkerData({...workerData, phone: e.target.value})} />
              <InputField english="Village" tamil="ஊர்" value={workerData.village} onChange={e => setWorkerData({...workerData, village: e.target.value})} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button type="submit" fullWidth>Save Worker</Button>
                <Button onClick={() => setShowWorkerForm(false)} variant="danger" fullWidth>Cancel</Button>
              </div>
            </form>
          )}

          <div className="list-container">
            {workers.map(w => (
              <div key={w.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{w.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#718096' }}>{w.phone} | {w.village}</div>
                </div>
                <div style={{ color: w.status === 'active' ? '#38A169' : '#E53E3E', fontWeight: 'bold', fontSize: '0.8rem' }}>
                  {w.status.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>Work Records</h3>
            <Button onClick={() => setShowEntryForm(true)}>+ New Entry</Button>
          </div>

          {showEntryForm && (
            <form onSubmit={handleSaveEntry} className="card">
              <InputField english="Date" tamil="தேதி" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
              <div className="input-group">
                <label>வேலையாட்கள் தேர்வு (Select Workers)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '10px', background: '#F7FAFC', borderRadius: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                  {workers.filter(w => w.status === 'active').map(w => (
                    <label key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input 
                        type="checkbox"
                        checked={formData.selectedWorkerIds.includes(w.id)}
                        onChange={(e) => {
                          const ids = e.target.checked 
                            ? [...formData.selectedWorkerIds, w.id]
                            : formData.selectedWorkerIds.filter(id => id !== w.id);
                          setFormData({...formData, selectedWorkerIds: ids});
                        }}
                      />
                      {w.name}
                    </label>
                  ))}
                </div>
              </div>
              <SelectField 
                english="Work Type" tamil="வேலை வகை"
                options={workTypes}
                value={formData.workType}
                onChange={e => setFormData({...formData, workType: e.target.value})}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <InputField english="Base Salary" tamil="சம்பளம்" type="number" value={formData.baseSalary} onChange={e => setFormData({...formData, baseSalary: e.target.value})} required />
                <InputField english="Bonus" tamil="போனஸ்" type="number" value={formData.bonus} onChange={e => setFormData({...formData, bonus: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <InputField english="Extra" tamil="கூடுதல்" type="number" value={formData.extraAmount} onChange={e => setFormData({...formData, extraAmount: e.target.value})} />
                <InputField english="Advance" tamil="முன்பணம்" type="number" value={formData.advance} onChange={e => setFormData({...formData, advance: e.target.value})} />
              </div>
              <div style={{ padding: '15px', background: netPayable >= 0 ? '#F0FFF4' : '#FFF5F5', borderRadius: '8px', marginBottom: '15px', textAlign: 'center' }}>
                <span style={{ fontWeight: 'bold', color: netPayable >= 0 ? '#1A6B55' : '#C53030' }}>Net Payable: {formatCurrency(netPayable)}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button type="submit" fullWidth>Save Entry</Button>
                <Button onClick={() => setShowEntryForm(false)} variant="danger" fullWidth>Cancel</Button>
              </div>
            </form>
          )}

          <div className="card" style={{ marginBottom: '20px', background: '#F7FAFC' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>Filters (வடிகட்டி)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <SelectField 
                english="Worker" options={[{value: 'all', label: 'All Workers'}, ...workers.map(w => ({value: w.id, label: w.name}))]}
                value={filters.workerId} onChange={e => setFilters({...filters, workerId: e.target.value})}
              />
              <SelectField 
                english="Work Type" options={[{value: 'all', label: 'All Types'}, ...workTypes]}
                value={filters.workType} onChange={e => setFilters({...filters, workType: e.target.value})}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
              <InputField type="date" english="From" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} />
              <InputField type="date" english="To" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} />
            </div>
            <Button variant="outline" fullWidth style={{ marginTop: '10px' }} onClick={() => setFilters({workerId: 'all', fromDate: '', toDate: '', workType: 'all'})}>Clear Filters</Button>
          </div>

          <div className="list-container">
            {filteredEntries.map(entry => (
              <div key={entry.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>
                      {workers.find(w => w.id === entry.workerId)?.name || entry.workerName || 'Unknown'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#718096' }}>{entry.date} | {entry.workType}</div>
                  </div>
                  <div style={{ fontWeight: 'bold', color: '#1A6B55' }}>{formatCurrency(entry.netPayable || ((parseFloat(entry.baseSalary)+parseFloat(entry.bonus)+parseFloat(entry.extraAmount))-parseFloat(entry.advance)))}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Workers;
