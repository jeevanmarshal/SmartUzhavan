import React, { useState, useEffect } from 'react';
import { getData } from '../services/storage';
import Button from '../components/common/Button';
import InputField from '../components/common/InputField';
import SelectField from '../components/common/SelectField';

const Login = ({ onLogin }) => {
  const [role, setRole] = useState('driver');
  const [userId, setUserId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [farmers, setFarmers] = useState([]);

  useEffect(() => {
    setDrivers(getData('rl_drivers'));
    setFarmers(getData('rl_farmers'));
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (role === 'admin') {
      const savedPin = localStorage.getItem('admin_pin') || '1234';
      if (pin === savedPin) {
        onLogin({ role: 'admin', name: 'Administrator' });
      } else {
        setError('தவறான கடவுச்சொல் (Invalid Admin PIN)');
      }
    } else if (role === 'driver') {
      const driver = drivers.find(d => d.id === userId);
      if (driver && driver.pin === pin) {
        onLogin({ role: 'driver', id: driver.id, name: driver.name });
      } else {
        setError('தவறான விவரங்கள் (Invalid Driver Credentials)');
      }
    } else if (role === 'farmer') {
      const farmer = farmers.find(f => f.id === userId);
      if (farmer) {
        onLogin({ role: 'farmer', id: farmer.id, name: farmer.name });
      } else {
        setError('தவறான விவரங்கள் (Invalid Farmer Selection)');
      }
    }
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, #1B3A6B 0%, #1A6B55 100%)',
      padding: '20px'
    }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '30px' }}>
        <h1 style={{ textAlign: 'center', color: '#1B3A6B', marginBottom: '10px' }}>SmartUzhavan</h1>
        <p style={{ textAlign: 'center', color: '#718096', marginBottom: '30px' }}>அங்கீகார நுழைவு (Secure Login)</p>

        <form onSubmit={handleLogin}>
          <SelectField 
            english="Select Role" tamil="பயனர் வகை"
            options={[
              { value: 'admin', label: 'Admin (நிர்வாகி)' },
              { value: 'driver', label: 'Driver (ஓட்டுநர்)' },
              { value: 'farmer', label: 'Farmer (விவசாயி)' }
            ]}
            value={role}
            onChange={(e) => { setRole(e.target.value); setUserId(''); setPin(''); setError(''); }}
          />

          {role === 'driver' && (
            <SelectField 
              english="Select Driver" tamil="ஓட்டுநரைத் தேர்ந்தெடுக்கவும்"
              options={drivers.map(d => ({ value: d.id, label: d.name }))}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
          )}

          {role === 'farmer' && (
            <SelectField 
              english="Select Farmer" tamil="விவசாயியைத் தேர்ந்தெடுக்கவும்"
              options={farmers.map(f => ({ value: f.id, label: f.name }))}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
          )}

          {(role === 'admin' || role === 'driver') && (
            <InputField 
              english="PIN" tamil="கடவுச்சொல்"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="****"
              required
            />
          )}

          {error && (
            <div style={{ color: '#C53030', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'center', fontWeight: 'bold' }}>
              {error}
            </div>
          )}

          <Button type="submit" fullWidth>Login (உள்நுழைக)</Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
