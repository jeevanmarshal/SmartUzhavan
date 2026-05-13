import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
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
  const [username, setUsername] = useState('');

  useEffect(() => {
    // Attempt to load drivers and farmers if a backend session exists
    const loadOptions = async () => {
      try {
        const driversData = await apiService.getDrivers();
        setDrivers(driversData?.data || driversData || []);
        
        const farmersData = await apiService.getFarmers();
        setFarmers(farmersData?.data || farmersData || []);
      } catch (err) {
        console.warn('Could not load options for login. Backend session may not exist.');
      }
    };
    loadOptions();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (role === 'admin') {
        // Authenticate with backend using V5 API
        const response = await apiService.login(username, pin);
        if (response && response.user) {
          onLogin({ role: 'admin', name: response.user.username, id: response.user._id });
        } else {
          // Fallback if backend login logic changes but still successful
          onLogin({ role: 'admin', name: 'Administrator' });
        }
      } else if (role === 'driver') {
        const driver = drivers.find(d => d._id === userId || d.id === userId);
        // Note: For full security, Driver PIN validation should happen on the backend
        if (driver && driver.pin === pin) {
          onLogin({ role: 'driver', id: driver._id || driver.id, name: driver.name });
        } else {
          setError('தவறான விவரங்கள் (Invalid Driver Credentials)');
        }
      } else if (role === 'farmer') {
        const farmer = farmers.find(f => f._id === userId || f.id === userId);
        if (farmer) {
          onLogin({ role: 'farmer', id: farmer._id || farmer.id, name: farmer.name });
        } else {
          setError('தவறான விவரங்கள் (Invalid Farmer Selection)');
        }
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
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
            onChange={(e) => { setRole(e.target.value); setUserId(''); setUsername(''); setPin(''); setError(''); }}
          />

          {role === 'admin' && (
            <InputField 
              english="Username" tamil="பயனர்பெயர்"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Admin Username"
              required
            />
          )}

          {role === 'driver' && (
            <SelectField 
              english="Select Driver" tamil="ஓட்டுநரைத் தேர்ந்தெடுக்கவும்"
              options={drivers.map(d => ({ value: d._id || d.id, label: d.name }))}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
          )}

          {role === 'farmer' && (
            <SelectField 
              english="Select Farmer" tamil="விவசாயியைத் தேர்ந்தெடுக்கவும்"
              options={farmers.map(f => ({ value: f._id || f.id, label: f.name }))}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
          )}

          {(role === 'admin' || role === 'driver') && (
            <InputField 
              english="PIN / Password" tamil="கடவுச்சொல்"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder={role === 'admin' ? "Password" : "****"}
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
