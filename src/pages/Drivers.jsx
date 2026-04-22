import React, { useState, useEffect } from 'react';
import { getData, saveData, updateRecord, deleteRecord } from '../services/storage';
import { generateId } from '../utils/idGenerator';
import InputField from '../components/common/InputField';
import Button from '../components/common/Button';

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    pin: '',
    salaryRatePerHour: 150,
    active: true
  });

  useEffect(() => {
    setDrivers(getData('rl_drivers'));
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    if (editingDriver) {
      updateRecord('rl_drivers', editingDriver.id, formData);
      setEditingDriver(null);
    } else {
      const newDriver = {
        ...formData,
        id: generateId('rl_drivers')
      };
      const list = [...drivers, newDriver];
      saveData('rl_drivers', list);
    }
    
    setDrivers(getData('rl_drivers'));
    setShowAddForm(false);
    setFormData({ name: '', phone: '', pin: '', salaryRatePerHour: 150, active: true });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleEdit = (driver) => {
    setFormData({
      name: driver.name,
      phone: driver.phone,
      pin: driver.pin,
      salaryRatePerHour: driver.salaryRatePerHour,
      active: driver.active
    });
    setEditingDriver(driver);
    setShowAddForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this driver? (ஓட்டுநரை நீக்க வேண்டுமா?)')) {
      deleteRecord('rl_drivers', id);
      setDrivers(getData('rl_drivers'));
    }
  };

  return (
    <div className="app-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>ஓட்டுநர்கள் (Drivers Master)</h1>
        {!showAddForm && <Button onClick={() => setShowAddForm(true)}>+ Add Driver</Button>}
      </div>

      {success && <div className="success-message">வெற்றிகரமாகச் சேமிக்கப்பட்டது (Saved)</div>}

      {showAddForm && (
        <form onSubmit={handleSave} className="card">
          <h3>{editingDriver ? 'Edit Driver' : 'Add New Driver'}</h3>
          <InputField 
            english="Name" tamil="பெயர்" value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})} required
          />
          <InputField 
            english="Phone" tamil="தொலைபேசி" type="tel" value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})} required
          />
          <InputField 
            english="Security PIN" tamil="கடவுச்சொல்" type="password" value={formData.pin}
            onChange={(e) => setFormData({...formData, pin: e.target.value})} placeholder="4 digits"
          />
          <InputField 
            english="Salary Rate (₹/hr)" tamil="மணி சம்பளம்" type="number" value={formData.salaryRatePerHour}
            onChange={(e) => setFormData({...formData, salaryRatePerHour: parseFloat(e.target.value) || 0})} required
          />
          <div style={{ marginBottom: '15px' }}>
             <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              />
              <span>Active Employee (பணியில் உள்ளார்)</span>
            </label>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button type="submit" fullWidth>Save (சேமி)</Button>
            <Button onClick={() => { setShowAddForm(false); setEditingDriver(null); }} variant="danger" fullWidth>Cancel (ரத்து)</Button>
          </div>
        </form>
      )}

      <div className="list-container">
        {drivers.map(driver => (
          <div key={driver.id} className="card" style={{ padding: '15px', borderLeft: driver.active ? '4px solid #1A6B55' : '4px solid #e53e3e' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: '700' }}>{driver.name} <span style={{ color: '#718096', fontSize: '0.8rem' }}>[{driver.id}]</span></div>
                <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>Rate: ₹ {driver.salaryRatePerHour}/hr | {driver.phone}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleEdit(driver)} style={{ background: 'none', border: 'none', color: '#1A6B55', cursor: 'pointer', fontWeight: '600' }}>Edit</button>
                <button onClick={() => handleDelete(driver.id)} style={{ background: 'none', border: 'none', color: '#C53030', cursor: 'pointer', fontWeight: '600' }}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Drivers;
