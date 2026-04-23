import React, { useState, useEffect } from 'react';
import { getData, addRecord } from '../services/storage';
import { generateId } from '../utils/idGenerator';
import { formatCurrency } from '../utils/formatters';
import { workTypes } from '../data/workTypes';
import InputField from '../components/common/InputField';
import SelectField from '../components/common/SelectField';
import Button from '../components/common/Button';

const Workers = () => {
  const [workers, setWorkers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    workerId: '',
    workType: 'Daily Wage',
    baseSalary: 0,
    bonus: 0,
    extraAmount: 0,
    advance: 0,
    description: ''
  });

  useEffect(() => {
    // Note: We use rl_farmers as worker list for now or we could have a separate rl_workers.
    // The SRS mentions workers, but the previous dev used farmers or ad-hoc.
    // I'll check if rl_workers exists, else I'll create a simple list.
    const savedWorkers = getData('rl_workers');
    if (savedWorkers.length === 0) {
        // Initial dummy workers if none exist
        const initial = [
            { id: 'W001', name: 'Mani' },
            { id: 'W002', name: 'Selvam' }
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

  const handleSave = (e) => {
    e.preventDefault();
    const entry = {
      ...formData,
      id: generateId('rl_work_entries'),
      netPayable,
      status: 'paid'
    };

    addRecord('rl_work_entries', entry);
    setEntries(getData('rl_work_entries'));
    setShowAddForm(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      workerId: formData.workerId,
      workType: 'Daily Wage',
      baseSalary: 0,
      bonus: 0,
      extraAmount: 0,
      advance: 0,
      description: ''
    });
  };

  return (
    <div className="app-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>வேலையாட்கள் மேலாண்மை (Worker Management)</h1>
        {!showAddForm && <Button onClick={() => setShowAddForm(true)}>+ New Work Entry</Button>}
      </div>

      {showAddForm && (
        <form onSubmit={handleSave} className="card">
          <h3>Daily Work Entry (தினசரி வேலை பதிவு)</h3>
          <InputField 
            english="Date" tamil="தேதி" type="date" 
            value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required 
          />
          <SelectField 
            english="Worker" tamil="வேலையாள்"
            options={workers.map(w => ({ value: w.id, label: w.name }))}
            value={formData.workerId}
            onChange={(e) => setFormData({...formData, workerId: e.target.value})}
            required
          />
          <SelectField 
            english="Work Type" tamil="வேலை வகை"
            options={workTypes}
            value={formData.workType}
            onChange={(e) => setFormData({...formData, workType: e.target.value})}
          />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <InputField english="Base Salary" tamil="சம்பளம்" type="number" value={formData.baseSalary} onChange={(e) => setFormData({...formData, baseSalary: e.target.value})} required />
            <InputField english="Bonus" tamil="போனஸ்" type="number" value={formData.bonus} onChange={(e) => setFormData({...formData, bonus: e.target.value})} />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <InputField english="Extra" tamil="கூடுதல்" type="number" value={formData.extraAmount} onChange={(e) => setFormData({...formData, extraAmount: e.target.value})} />
            <InputField english="Advance" tamil="முன்பணம்" type="number" value={formData.advance} onChange={(e) => setFormData({...formData, advance: e.target.value})} />
          </div>

          <div style={{ padding: '15px', background: netPayable >= 0 ? '#F0FFF4' : '#FFF5F5', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: netPayable >= 0 ? '#1A6B55' : '#C53030' }}>
              Net Payable: {formatCurrency(netPayable)}
            </span>
            {netPayable < 0 && <p style={{ fontSize: '0.75rem', color: '#C53030', marginTop: '5px' }}>எச்சரிக்கை: முன்பணம் சம்பளத்தை விட அதிகமாக உள்ளது (Warning: Advance exceeds salary)</p>}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Button type="submit" fullWidth>Save (சேமி)</Button>
            <Button onClick={() => setShowAddForm(false)} variant="danger" fullWidth>Cancel (ரத்து)</Button>
          </div>
        </form>
      )}

      <div className="list-container">
        {entries.map(entry => (
          <div key={entry.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>{workers.find(w => w.id === entry.workerId)?.name || 'Unknown Worker'}</div>
                <div style={{ fontSize: '0.8rem', color: '#718096' }}>{entry.date} | {entry.workType}</div>
              </div>
              <div style={{ fontWeight: 'bold', color: '#1A6B55' }}>{formatCurrency(entry.netPayable)}</div>
            </div>
            <div style={{ fontSize: '0.75rem', marginTop: '5px', color: '#718096' }}>
              Base: {entry.baseSalary} | Bonus: {entry.bonus} | Adv: {entry.advance}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Workers;
