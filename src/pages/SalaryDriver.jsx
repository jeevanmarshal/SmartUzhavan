import React, { useState, useEffect, useMemo } from 'react';
import { getData, addRecord, addPayment, updateRecord } from '../services/storage';
import { generateId } from '../utils/idGenerator';
import { formatCurrency } from '../utils/formatters';
import { getPaymentStatus } from '../services/calculations';
import SelectField from '../components/common/SelectField';
import InputField from '../components/common/InputField';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import PaymentHistory from '../components/common/PaymentHistory';

const SalaryDriver = ({ userId }) => {
  const [drivers, setDrivers] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [activeSalId, setActiveSalId] = useState(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    driverId: userId || '',
    bonus: 0,
    extraAmount: 0,
    advance: 0,
    description: ''
  });

  useEffect(() => {
    setDrivers(getData('rl_drivers'));
    setAllLogs(getData('rl_driver_logs'));
    setSalaries(getData('rl_driver_salary'));
  }, []);

  // Filter logs for the selected driver that have NO linkedSalaryId
  const availableLogs = useMemo(() => {
    if (!formData.driverId) return [];
    return allLogs.filter(log => log.driverId === formData.driverId && !log.linkedSalaryId);
  }, [formData.driverId, allLogs]);

  const selectedDriver = drivers.find(d => d.id === formData.driverId);
  const totalHours = availableLogs.reduce((sum, log) => sum + (log.totalHours || 0), 0);
  const baseSalary = totalHours * (selectedDriver?.salaryRatePerHour || 0);
  const netPay = (baseSalary + parseFloat(formData.bonus || 0) + parseFloat(formData.extraAmount || 0)) - parseFloat(formData.advance || 0);

  const handleSave = (e) => {
    e.preventDefault();
    if (availableLogs.length === 0) {
      setError('இந்த ஓட்டுநருக்கு ஊதியம் வழங்கப்படாத வேலை நேரங்கள் எதுவும் இல்லை. (No unpaid work logs found.)');
      return;
    }

    const salId = generateId('rl_driver_salary');
    const salaryRecord = {
      ...formData,
      id: salId,
      totalHours,
      baseSalary,
      netPay,
      logIds: availableLogs.map(l => l.id),
      payments: [], // Support partial payments (SRS pattern)
      status: 'active'
    };

    // 1. Save salary record
    addRecord('rl_driver_salary', salaryRecord);
    
    // 2. Mark logs as paid
    const updatedLogs = allLogs.map(log => {
      if (salaryRecord.logIds.includes(log.id)) {
        return { ...log, linkedSalaryId: salId };
      }
      return log;
    });
    // We need an updateAllRecords or similar, but for now we'll do it manually in storage or loop
    // Actually, updateRecord is for one record. I'll loop.
    salaryRecord.logIds.forEach(id => {
        const log = allLogs.find(l => l.id === id);
        if (log) {
            updateRecord('rl_driver_logs', id, { ...log, linkedSalaryId: salId });
        }
    });

    setSalaries(getData('rl_driver_salary'));
    setAllLogs(getData('rl_driver_logs'));
    setFormData({ ...formData, bonus: 0, extraAmount: 0, advance: 0, description: '' });
    setSuccess(true);
    setError('');
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleAddPayment = (id, payment) => {
    addPayment('rl_driver_salary', id, payment);
    setSalaries(getData('rl_driver_salary'));
  };

  const isReadOnly = !!userId;

  return (
    <div className="app-container">
      <h1>ஓட்டுநர் சம்பளம் (Driver Salary)</h1>

      {!isReadOnly && (
        <form onSubmit={handleSave} className="card">
          <h3>New Salary Calculation</h3>
          <InputField 
            english="Date" tamil="தேதி" type="date" 
            value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required 
          />
          <SelectField 
            english="Select Driver" tamil="ஓட்டுநர்"
            options={drivers.map(d => ({ value: d.id, label: d.name }))}
            value={formData.driverId}
            onChange={(e) => setFormData({...formData, driverId: e.target.value})}
            required
          />
          
          <div style={{ background: '#F7FAFC', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>Unpaid Hours:</span>
              <span style={{ fontWeight: 'bold' }}>{totalHours.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>Rate/Hr:</span>
              <span>{selectedDriver?.salaryRatePerHour || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 'bold', color: '#1B3A6B' }}>
              <span>Base Salary:</span>
              <span>{formatCurrency(baseSalary)}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <InputField english="Bonus" tamil="போனஸ்" type="number" value={formData.bonus} onChange={(e) => setFormData({...formData, bonus: e.target.value})} />
            <InputField english="Extra" tamil="கூடுதல்" type="number" value={formData.extraAmount} onChange={(e) => setFormData({...formData, extraAmount: e.target.value})} />
          </div>
          <InputField english="Advance" tamil="முன்பணம்" type="number" value={formData.advance} onChange={(e) => setFormData({...formData, advance: e.target.value})} />
          
          <div style={{ padding: '15px', background: '#F0FFF4', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1A6B55' }}>Net Payable: {formatCurrency(netPay)}</span>
          </div>

          {success && <div className="success-message">சம்பளப் பதிவு வெற்றிகரமாகச் சேமிக்கப்பட்டது (Salary record saved successfully)</div>}
          {error && <div style={{ color: '#C53030', background: '#FFF5F5', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '0.85rem', textAlign: 'center', fontWeight: 'bold' }}>{error}</div>}

          <Button type="submit" fullWidth>Confirm Salary (சம்பளம் உறுதிசெய்)</Button>
        </form>
      )}

      <div className="list-container">
        <h3>{isReadOnly ? 'My Salary History (சம்பள விவரம்)' : 'சம்பள பதிவுகள் (Salary Records)'}</h3>
        {salaries.filter(s => !userId || s.driverId === userId).map(sal => {
          const driver = drivers.find(d => d.id === sal.driverId);
          const isExpanded = activeSalId === sal.id;
          const status = getPaymentStatus(sal.netPay, sal.payments);
          const paid = (sal.payments || []).reduce((sum, p) => sum + p.amount, 0);

          return (
            <div key={sal.id} className="card" onClick={() => setActiveSalId(isExpanded ? null : sal.id)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{driver?.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#718096' }}>{sal.date} | {sal.totalHours.toFixed(2)} Hrs</div>
                </div>
                <Badge status={status} />
              </div>
              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>Net: {formatCurrency(sal.netPay)}</span>
                <span style={{ color: '#C53030' }}>Due: {formatCurrency(sal.netPay - paid)}</span>
              </div>
              
              {isExpanded && (
                <div onClick={e => e.stopPropagation()} style={{ marginTop: '15px' }}>
                  <PaymentHistory 
                    payments={sal.payments} 
                    totalAmount={sal.netPay} 
                    onAddPayment={(p) => handleAddPayment(sal.id, p)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SalaryDriver;
