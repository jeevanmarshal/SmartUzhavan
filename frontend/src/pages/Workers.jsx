import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/api';
import useAPI from '../hooks/useAPI';
import useRealTime from '../hooks/useRealTime';
import { formatCurrency } from '../utils/formatters';
import { workTypes } from '../data/workTypes';
import InputField from '../components/common/InputField';
import SelectField from '../components/common/SelectField';
import Button from '../components/common/Button';

const Workers = () => {
  const [activeTab, setActiveTab] = useState('tab2');
  
  const { execute: fetchWorkers, loading: loadingWorkers } = useAPI(apiService.getWorkers.bind(apiService));
  const { execute: fetchRecords, loading: loadingRecords } = useAPI(apiService.getAllWorkerRecords.bind(apiService));
  
  const { data: workers, syncData: setWorkers } = useRealTime('Worker', []);
  const { data: entries, syncData: setEntries } = useRealTime('WorkerRecord', []);
  
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
    const init = async () => {
      try {
        const w = await fetchWorkers();
        setWorkers(w?.workers || (Array.isArray(w) ? w : []));
        
        const r = await fetchRecords();
        setEntries(r?.records || r?.data || (Array.isArray(r) ? r : []));
      } catch (err) {
        setError('Failed to load initial data');
      }
    };
    init();
  }, []);

  const handleActionComplete = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleActionError = (err) => {
    setError(err.message || 'Operation failed');
    setTimeout(() => setError(''), 5000);
  };

  const handleSaveWorker = async (e) => {
    e.preventDefault();
    try {
      if (editingWorker) {
        await apiService.updateWorker(editingWorker._id, workerData);
      } else {
        await apiService.createWorker(workerData);
      }
      
      const w = await fetchWorkers();
      setWorkers(w?.workers || (Array.isArray(w) ? w : []));
      
      setShowAddWorker(false);
      setEditingWorker(null);
      setWorkerData({ name: '', phone: '', village: '' });
      handleActionComplete('Worker saved successfully');
    } catch (err) {
      handleActionError(err);
    }
  };

  const handleDeleteWorker = async (id) => {
    if (window.confirm('Delete this worker?')) {
      try {
        await apiService.deleteWorker(id);
        setWorkers(workers.filter(w => w._id !== id));
        handleActionComplete('Worker deleted');
      } catch (err) {
        handleActionError(err);
      }
    }
  };

  const netPayable = (parseFloat(formData.baseSalary) || 0) + (parseFloat(formData.bonus) || 0) + (parseFloat(formData.extraAmount) || 0) - (parseFloat(formData.advance) || 0);

  const handleSaveEntry = async (e) => {
    e.preventDefault();
    if (formData.selectedWorkerIds.length === 0) {
      setError('குறைந்தது ஒரு வேலையாள் தேர்வு செய்யவும் (Select at least one worker)');
      return;
    }
    
    try {
      const promises = formData.selectedWorkerIds.map(worker_id => {
        const entry = {
          worker_id,
          date: formData.date,
          work_type: formData.workType,
          baseSalary: parseFloat(formData.baseSalary) || 0,
          bonus: parseFloat(formData.bonus) || 0,
          extraAmount: parseFloat(formData.extraAmount) || 0,
          advance: parseFloat(formData.advance) || 0,
          notes: formData.notes
        };
        return apiService.createWorkerRecord(entry);
      });
      
      await Promise.all(promises);
      
      const r = await fetchRecords();
      setEntries(r?.records || r?.data || (Array.isArray(r) ? r : []));
      
      setShowAddForm(false);
      handleActionComplete(`${formData.selectedWorkerIds.length} வேலையாட்கள் சேமிக்கப்பட்டனர்`);
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
    } catch (err) {
      handleActionError(err);
    }
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
      // Backend populates worker_id, so e.worker_id._id or e.worker_id is the reference
      const workerIdVal = e.worker_id?._id || e.worker_id;
      const workerNameVal = e.worker_id?.name || e.workerName;
      
      const matchWorker = filterWorker === 'all' || workerIdVal === filterWorker || workerNameVal === filterWorker;
      
      // Dates
      const eDate = new Date(e.date).toISOString().split('T')[0];
      const matchFrom = !filterFromDate || eDate >= filterFromDate;
      const matchTo = !filterToDate || eDate <= filterToDate;
      
      const matchType = filterWorkType === 'all' || e.work_type === filterWorkType || e.workType === filterWorkType;
      
      return matchWorker && matchFrom && matchTo && matchType;
    });
  }, [entries, filterWorker, filterFromDate, filterToDate, filterWorkType]);

  const handleDeleteRecord = async (id) => {
    if (window.confirm('Delete this record?')) {
      try {
        await apiService.deleteWorkerRecord(id);
        setEntries(entries.filter(e => e._id !== id));
        handleActionComplete('Record deleted');
      } catch (err) {
        handleActionError(err);
      }
    }
  };

  const handlePDF = async (type) => {
    try {
      alert('PDF Generation will be connected in Phase 3/4 integration.');
    } catch (err) {
      alert('Error generating PDF');
    }
  };

  return (
    <div className="app-container">
      <div className="tab-container">
        <button onClick={() => setActiveTab('tab1')} style={{ flex: 1, padding: '10px', background: activeTab === 'tab1' ? '#1B3A6B' : '#EDF2F7', color: activeTab === 'tab1' ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Workers (வேலையாட்கள்)</button>
        <button onClick={() => setActiveTab('tab2')} style={{ flex: 1, padding: '10px', background: activeTab === 'tab2' ? '#1B3A6B' : '#EDF2F7', color: activeTab === 'tab2' ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Work Records (வேலை பதிவு)</button>
      </div>

      {success && <div className="success-message">{success}</div>}
      {error && <div style={{ color: '#C53030', background: '#FFF5F5', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '0.85rem', textAlign: 'center', fontWeight: 'bold' }}>{error}</div>}

      {activeTab === 'tab1' && (
        <>
          <div className="page-header">
            <h2 style={{margin: 0}}>Workers</h2>
            {!showAddWorker && <Button onClick={() => setShowAddWorker(true)}>+ Add Worker</Button>}
          </div>
          {loadingWorkers && <p>Loading workers...</p>}
          {showAddWorker && (
            <form onSubmit={handleSaveWorker} className="card">
              <h3>{editingWorker ? 'Edit Worker' : 'New Worker'}</h3>
              <InputField english="Name" tamil="பெயர்" value={workerData.name} onChange={e => setWorkerData({...workerData, name: e.target.value})} required />
              <InputField english="Village" tamil="ஊர்" value={workerData.village} onChange={e => setWorkerData({...workerData, village: e.target.value})} required />
              <InputField english="Phone" tamil="தொலைபேசி" type="tel" value={workerData.phone} onChange={e => setWorkerData({...workerData, phone: e.target.value})} />
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <Button type="submit" fullWidth>Save</Button>
                <Button type="button" onClick={() => { setShowAddWorker(false); setEditingWorker(null); }} variant="danger" fullWidth>Cancel</Button>
              </div>
            </form>
          )}
          <div className="list-container">
            {workers.map(w => (
              <div key={w._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{fontWeight: 'bold'}}>{w.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#718096' }}>{w.village || 'No Village'} | {w.phone || 'No Phone'}</div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => { 
                    setWorkerData({name: w.name, village: w.village, phone: w.phone || ''}); 
                    setEditingWorker(w); 
                    setShowAddWorker(true); 
                  }} style={{ background: 'none', border: 'none', color: '#1A6B55', cursor: 'pointer', fontWeight: 'bold' }}>Edit</button>
                  <button onClick={() => handleDeleteWorker(w._id)} style={{ background: 'none', border: 'none', color: '#C53030', cursor: 'pointer', fontWeight: 'bold' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'tab2' && (
        <>
          <div className="page-header">
            <h2 style={{margin: 0}}>Work Records</h2>
            {!showAddForm && <Button onClick={() => setShowAddForm(true)}>+ New Entry</Button>}
          </div>

          {loadingRecords && <p>Loading records...</p>}

          {showAddForm && (
            <form onSubmit={handleSaveEntry} className="card">
              <h3>Daily Work Entry (தினசரி வேலை பதிவு)</h3>
              <InputField english="Date" tamil="தேதி" type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Select Workers (வேலையாட்கள்)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#F7FAFC', padding: '10px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                  {workers.map(w => (
                    <label key={w._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={formData.selectedWorkerIds.includes(w._id)} onChange={() => handleWorkerCheck(w._id)} style={{width: '18px', height: '18px'}} />
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
                <Button type="button" onClick={() => setShowAddForm(false)} variant="danger" fullWidth>Cancel (ரத்து)</Button>
              </div>
            </form>
          )}

          <div className="card" style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#4A5568' }}>Filters (வடிகட்டி)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <SelectField options={[{value:'all', label:'All Workers'}].concat(workers.map(w=>({value:w._id, label:w.name})))} value={filterWorker} onChange={e=>setFilterWorker(e.target.value)} />
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
              const workerIdVal = entry.worker_id?._id || entry.worker_id;
              const workerName = entry.worker_id?.name || workers.find(w => w._id === workerIdVal)?.name || entry.workerName || 'Unknown';
              return (
                <div key={entry._id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{workerName} {entry.workerName && <span style={{ fontSize: '0.7rem', background: '#EDF2F7', padding: '2px 4px', borderRadius: '4px', color: '#718096' }}>Legacy</span>}</div>
                      <div style={{ fontSize: '0.8rem', color: '#718096' }}>{new Date(entry.date).toLocaleDateString()} | {entry.work_type || entry.workType}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', color: '#1A6B55' }}>{formatCurrency(net)}</div>
                      <button onClick={() => handleDeleteRecord(entry._id)} style={{ background: 'none', border: 'none', color: '#C53030', cursor: 'pointer', fontSize: '0.8rem', marginTop: '5px' }}>Delete</button>
                    </div>
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
