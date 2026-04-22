import React, { useState, useEffect } from 'react';
import { getData, addRecord } from '../services/storage';
import { generateId } from '../utils/idGenerator';
import { workTypes } from '../data/workTypes';
import { formatCurrency } from '../utils/formatters';
import SelectField from '../components/common/SelectField';
import InputField from '../components/common/InputField';
import Button from '../components/common/Button';

const Workers = () => {
  const [workers, setWorkers] = useState([]);
  const [workEntries, setWorkEntries] = useState([]);
  const [salaryLogs, setSalaryLogs] = useState([]);
  const [success, setSuccess] = useState(false);

  const [newWork, setNewWork] = useState({
    date: new Date().toISOString().split('T')[0],
    workerId: '',
    workType: 'levelling',
    amount: 500 // Default daily pay
  });

  const [newSalary, setNewSalary] = useState({
    workerId: '',
    amount: 0,
    notes: ''
  });

  useEffect(() => {
    setWorkers(getData('rl_workers'));
    setWorkEntries(getData('rl_work_entries'));
    setSalaryLogs(getData('rl_worker_salary'));
    
    // Seed sample worker if none exist
    if (getData('rl_workers').length === 0) {
      const sample = [{ id: 'W001', name: 'Muthu', village: 'South Village', phone: '9988776655' }];
      setWorkers(sample);
      localStorage.setItem('rl_workers', JSON.stringify(sample));
    }
  }, []);

  const handleSaveWork = (e) => {
    e.preventDefault();
    const entry = {
      ...newWork,
      id: generateId('rl_work_entries'),
      amount: parseFloat(newWork.amount)
    };
    addRecord('rl_work_entries', entry);
    setWorkEntries([entry, ...workEntries]);
    setSuccess('Work entry saved!');
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleSaveSalary = (e) => {
    e.preventDefault();
    const worker = workers.find(w => w.id === newSalary.workerId);
    const log = {
      ...newSalary,
      id: generateId('rl_worker_salary'),
      date: new Date().toISOString().split('T')[0],
      workerName: worker?.name || 'Unknown'
    };
    addRecord('rl_worker_salary', log);
    setSalaryLogs([log, ...salaryLogs]);
    setSuccess('Salary payment recorded!');
    setNewSalary({ workerId: '', amount: 0, notes: '' });
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="app-container">
      <h1>பணியாளர் மேலாண்மை (Worker Management)</h1>
      {success && <div className="success-message">{success}</div>}

      <div className="card">
        <h3>Daily Work Entry (வேலை பதிவு)</h3>
        <form onSubmit={handleSaveWork}>
          <InputField 
            english="Date" tamil="தேதி" type="date" value={newWork.date}
            onChange={(e) => setNewWork({...newWork, date: e.target.value})} required
          />
          <SelectField 
            english="Select Worker" tamil="பணியாளர்"
            options={workers.map(w => ({ value: w.id, label: w.name }))}
            value={newWork.workerId}
            onChange={(e) => setNewWork({...newWork, workerId: e.target.value})} required
          />
          <SelectField 
            english="Work Type" tamil="வேலை வகை"
            options={workTypes}
            value={newWork.workType}
            onChange={(e) => setNewWork({...newWork, workType: e.target.value})} required
          />
          <InputField 
            english="Daily Pay (₹)" tamil="சம்பளம்" type="number" value={newWork.amount}
            onChange={(e) => setNewWork({...newWork, amount: e.target.value})} required
          />
          <Button type="submit" fullWidth>Save Work Entry (பதிவு செய்)</Button>
        </form>
      </div>

      <div className="card">
        <h3>Salary Payment (சம்பளம் வழங்குதல்)</h3>
        <form onSubmit={handleSaveSalary}>
          <SelectField 
            english="Select Worker" tamil="பணியாளர்"
            options={workers.map(w => ({ value: w.id, label: w.name }))}
            value={newSalary.workerId}
            onChange={(e) => setNewSalary({...newSalary, workerId: e.target.value})} required
          />
          <InputField 
            english="Amount Paid (₹)" tamil="தொகை" type="number" value={newSalary.amount}
            onChange={(e) => setNewSalary({...newSalary, amount: parseFloat(e.target.value) || 0})} required
          />
          <InputField 
            english="Notes" tamil="குறிப்பு" value={newSalary.notes}
            onChange={(e) => setNewSalary({...newSalary, notes: e.target.value})}
          />
          <Button type="submit" variant="secondary" fullWidth>Record Payment (சம்பளம் கொடு)</Button>
        </form>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>சமீபத்திய பணிகள் (Recent Work)</h3>
        <div className="list-container">
          {workEntries.slice(0, 5).map(we => (
            <div key={we.id} className="card" style={{ padding: '10px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <strong>{workers.find(w => w.id === we.workerId)?.name}</strong>
                 <span>{formatCurrency(we.amount)}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#718096' }}>{we.date} | {we.workType}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Workers;
