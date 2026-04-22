import React, { useState, useEffect } from 'react';
import { getData, getConfig, addRecord } from '../services/storage';
import { machineTypes } from '../data/machineTypes';
import SelectField from '../components/common/SelectField';
import InputField from '../components/common/InputField';
import Button from '../components/common/Button';
import SessionEntry from '../components/driver/SessionEntry';
import DieselInput from '../components/driver/DieselInput';
import { getHours, getDieselCost } from '../services/calculations';
import { getDuration } from '../utils/timeUtils';
import { generateId } from '../utils/idGenerator';

const DriverEntry = () => {
  const [drivers, setDrivers] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [todaysLogs, setTodaysLogs] = useState([]);
  const [success, setSuccess] = useState(false);
  const [dieselPrice, setDieselPrice] = useState(0);
  
  const [formData, setFormData] = useState({
    driverId: '',
    machineType: '',
    farmerId: '',
    date: new Date().toISOString().split('T')[0],
    sessions: [{ start: '', end: '', durationHours: 0 }],
    diesel: {
      mode: 'none',
      value: 0,
      pricePerLitre: 0,
      total: 0
    }
  });

  useEffect(() => {
    setDrivers(getData('rl_drivers'));
    const savedFarmers = getData('rl_farmers');
    setFarmers(savedFarmers.map(f => ({ value: f.id, label: `${f.name} (${f.village})` })));
    
    const config = getConfig('rl_pricing_config');
    const price = config?.diesel?.pricePerLitre || 0;
    setDieselPrice(price);
    
    setFormData(prev => ({
      ...prev,
      diesel: { ...prev.diesel, pricePerLitre: price }
    }));

    const logs = getData('rl_driver_logs');
    const today = new Date().toISOString().split('T')[0];
    setTodaysLogs(logs.filter(l => l.date === today));
  }, []);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSessionChange = (index, field, value) => {
    const newSessions = [...formData.sessions];
    newSessions[index][field] = value;
    const { start, end } = newSessions[index];
    if (start && end) {
      newSessions[index].durationHours = getDuration(start, end);
    } else {
      newSessions[index].durationHours = 0;
    }
    setFormData(prev => ({ ...prev, sessions: newSessions }));
  };

  const totalHours = getHours(formData.sessions);

  const addSession = () => {
    setFormData(prev => ({
      ...prev,
      sessions: [...prev.sessions, { start: '', end: '', durationHours: 0 }]
    }));
  };

  const removeSession = (index) => {
    if (formData.sessions.length > 1) {
      setFormData(prev => ({
        ...prev,
        sessions: prev.sessions.filter((_, i) => i !== index)
      }));
    }
  };

  const handleDieselChange = (field, value) => {
    setFormData(prev => {
      const newDiesel = { ...prev.diesel, [field]: value };
      newDiesel.total = getDieselCost(newDiesel.mode, newDiesel.value, dieselPrice);
      return { ...prev, diesel: newDiesel };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.driverId) {
      alert('Please select a driver');
      return;
    }

    const logId = generateId('rl_driver_logs');
    const newLog = {
      ...formData,
      id: logId,
      totalHours,
      source: 'driver_log'
    };

    addRecord('rl_driver_logs', newLog);
    setTodaysLogs(prev => [newLog, ...prev]);
    setSuccess(true);
    
    setFormData({
      driverId: '',
      machineType: '',
      farmerId: '',
      date: new Date().toISOString().split('T')[0],
      sessions: [{ start: '', end: '', durationHours: 0 }],
      diesel: {
        mode: 'none',
        value: 0,
        pricePerLitre: dieselPrice,
        total: 0
      }
    });

    setTimeout(() => setSuccess(false), 3000);
  };

  const machineOptions = Object.keys(machineTypes).map(key => ({
    value: key,
    label: `${machineTypes[key].en} (${machineTypes[key].ta})`
  }));

  return (
    <div className="app-container">
      <h1>ஓட்டுநர் பதிவு (Driver Entry)</h1>
      {success && <div className="success-message">வெற்றிகரமாக சேமிக்கப்பட்டது (Successfully Saved)</div>}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <SelectField 
            english="Select Driver" tamil="ஓட்டுநர்" 
            options={drivers.map(d => ({ value: d.id, label: d.name }))}
            value={formData.driverId}
            onChange={(e) => handleFieldChange('driverId', e.target.value)}
            required
          />
          <SelectField 
            english="Machine Type" tamil="இயந்திர வகை"
            value={formData.machineType}
            onChange={(e) => handleFieldChange('machineType', e.target.value)}
            options={machineOptions}
            required
          />
          <SelectField 
            english="Farmer Name" tamil="விவசாயி"
            value={formData.farmerId}
            onChange={(e) => handleFieldChange('farmerId', e.target.value)}
            options={farmers}
            required
          />
          <InputField 
            english="Date" tamil="தேதி" type="date"
            value={formData.date}
            onChange={(e) => handleFieldChange('date', e.target.value)}
            required
          />
        </div>

        <div className="card">
          <h3>வேலை நேரம் (Work Sessions)</h3>
          {formData.sessions.map((session, index) => (
            <SessionEntry 
              key={index} index={index} session={session}
              onChange={handleSessionChange} onRemove={removeSession}
            />
          ))}
          <Button onClick={addSession} variant="outline" fullWidth>+ Add Session</Button>
          <div style={{ marginTop: '20px', textAlign: 'right', fontWeight: '700', color: '#1B3A6B' }}>
            Total Hours: {totalHours.toFixed(2)}
          </div>
        </div>

        <div className="card">
          <DieselInput 
            mode={formData.diesel.mode} value={formData.diesel.value}
            pricePerLitre={formData.diesel.pricePerLitre} onChange={handleDieselChange}
          />
        </div>

        <Button type="submit" fullWidth>பதிவு செய்க (SAVE LOG)</Button>
      </form>

      {todaysLogs.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3>இன்றைய பதிவுகள் (Today's Logs)</h3>
          {todaysLogs.map(log => (
            <div key={log.id} className="card" style={{ padding: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{drivers.find(d => d.id === log.driverId)?.name}</strong>
                <span style={{ color: '#1A6B55', fontWeight: 'bold' }}>{log.totalHours.toFixed(2)} Hrs</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#4a5568' }}>{log.id} | {farmers.find(f => f.value === log.farmerId)?.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverEntry;
