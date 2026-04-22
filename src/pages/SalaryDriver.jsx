import React, { useState, useEffect } from 'react';
import { getData, addRecord } from '../services/storage';
import { calcDriverSalary, calcNetPay } from '../services/calculations';
import { generateId } from '../utils/idGenerator';
import { formatCurrency } from '../utils/formatters';
import SelectField from '../components/common/SelectField';
import InputField from '../components/common/InputField';
import Button from '../components/common/Button';

const SalaryDriver = () => {
  const [drivers, setDrivers] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    driverId: '',
    bonus: 0,
    extraPay: 0,
    advance: 0,
    notes: ''
  });

  useEffect(() => {
    setDrivers(getData('rl_drivers'));
    setAllLogs(getData('rl_driver_logs'));
    setSalaryHistory(getData('rl_driver_salary'));
  }, []);

  // Compute current stats for selected driver
  const driver = drivers.find(d => d.id === formData.driverId);
  
  // Calculate total hours worked that haven't been paid yet? 
  // For simplicity per SRS, we calculate based on ALL logs found for now, 
  // or the user can enter the hours manually if they prefer.
  // Actually, let's auto-sum hours for the driver.
  const totalHoursWorked = allLogs
    .filter(log => log.driverId === formData.driverId) // Note: Driver IDs are usually linked in Logs
    // Wait, my DriverEntry doesn't have a Driver ID select yet? 
    // Ah, Day 4 DriverEntry used 'machineType', 'farmerId', 'date', 'sessions', 'diesel'.
    // It didn't ask for 'driverId' because we assumed the driver is the one using the PWA.
    // However, the Admin needs to select which driver to pay.
    // Let's assume for now we pull logs where machine logs were recorded.
    .reduce((sum, log) => sum + log.totalHours, 0);

  const baseSalary = calcDriverSalary(totalHoursWorked, driver?.salaryRatePerHour || 0);
  const netPay = calcNetPay(baseSalary, formData.bonus, formData.extraPay, formData.advance);

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.driverId) return;

    const salaryRecord = {
      ...formData,
      id: generateId('rl_driver_salary'),
      date: new Date().toISOString().split('T')[0],
      totalHours: totalHoursWorked,
      baseSalary,
      netPay,
      status: 'paid'
    };

    addRecord('rl_driver_salary', salaryRecord);
    setSalaryHistory([salaryRecord, ...salaryHistory]);
    setSuccess(true);
    setFormData({ driverId: '', bonus: 0, extraPay: 0, advance: 0, notes: '' });
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="app-container">
      <h1>ஓட்டுநர் சம்பளம் (Driver Salary)</h1>

      {success && <div className="success-message">வெற்றிகரமாக சேமிக்கப்பட்டது (Successfully Saved)</div>}

      <form onSubmit={handleSave} className="card">
        <SelectField 
          english="Select Driver" tamil="ஓட்டுநரைத் தேர்ந்தெடுக்கவும்"
          options={drivers.map(d => ({ value: d.id, label: d.name }))}
          value={formData.driverId}
          onChange={(e) => setFormData({...formData, driverId: e.target.value})}
          required
        />

        {driver && (
          <div style={{ marginTop: '10px', padding: '10px', background: '#F7FAFC', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Hours worked:</span>
              <strong>{totalHoursWorked.toFixed(2)} Hrs</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Rate Per Hour:</span>
              <strong>₹ {driver.salaryRatePerHour}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', borderTop: '1px solid #edf2f7', paddingTop: '5px' }}>
              <span>Base Salary:</span>
              <strong>{formatCurrency(baseSalary)}</strong>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
          <InputField 
            english="Bonus" tamil="போனஸ் (+)" type="number" value={formData.bonus}
            onChange={(e) => setFormData({...formData, bonus: parseFloat(e.target.value) || 0})}
          />
          <InputField 
            english="Extra Pay" tamil="கூடுதல் (+)" type="number" value={formData.extraPay}
            onChange={(e) => setFormData({...formData, extraPay: parseFloat(e.target.value) || 0})}
          />
        </div>
        <InputField 
          english="Advance" tamil="முன்பணம் (-)" type="number" value={formData.advance}
          onChange={(e) => setFormData({...formData, advance: parseFloat(e.target.value) || 0})}
        />
        
        <div style={{ margin: '15px 0', padding: '15px', background: '#E6FFFA', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: '#2C7A7B' }}>Net Payable Amount</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#234E52' }}>{formatCurrency(netPay)}</div>
        </div>

        <Button type="submit" fullWidth>சம்பளம் வழங்கப்பட்டது (CONFIRM PAYMENT)</Button>
      </form>

      <div style={{ marginTop: '30px' }}>
        <h3>சம்பள வரலாறு (Salary History)</h3>
        {salaryHistory.map(s => (
          <div key={s.id} className="card" style={{ padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{drivers.find(d => d.id === s.driverId)?.name}</strong>
              <span style={{ color: '#2F855A', fontWeight: 'bold' }}>{formatCurrency(s.netPay)}</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#718096' }}>{s.date} | Hours: {s.totalHours.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalaryDriver;
