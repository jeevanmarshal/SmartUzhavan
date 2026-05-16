import React, { useState } from 'react';
import { authService } from '../services/api';
import Button from '../components/common/Button';
import InputField from '../components/common/InputField';

const Login = ({ onLogin }) => {
  const [role, setRole] = useState(null); // 'admin' | 'driver' | 'farmer'
  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let data;
      if (role === 'driver') {
        data = await authService.driverLogin(identifier, password);
      } else if (role === 'farmer') {
        data = await authService.farmerLogin(identifier);
      } else {
        data = await authService.login(identifier, password);
      }
      
      if (data && data.user) {
        onLogin({
          id: data.user._id || data.user.id,
          name: data.user.name || data.user.username || 'User',
          role: data.user.role.toLowerCase(),
          email: data.user.email,
          token: data.token
        });
      }
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  if (!role) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1B3A6B 0%, #1A6B55 100%)', padding: '20px' }}>
        <div style={{ maxWidth: '800px', width: '100%' }}>
          <h1 style={{ textAlign: 'center', color: 'white', marginBottom: '10px', fontSize: '2.5rem', fontWeight: '800' }}>SmartUzhavan</h1>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', marginBottom: '40px', fontSize: '1.1rem' }}>பயன்பாட்டைத் தொடங்க உங்கள் பங்கைத் தேர்ந்தெடுக்கவும் (Select your role to begin)</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div className="card" onClick={() => setRole('admin')} style={{ cursor: 'pointer', textAlign: 'center', padding: '40px 20px', transition: 'transform 0.2s' }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>👨‍💼</div>
              <h3 style={{ margin: 0 }}>Administrator</h3>
              <p style={{ fontSize: '0.8rem', color: '#718096', marginTop: '10px' }}>நிர்வாகி (Price & Reports)</p>
            </div>
            <div className="card" onClick={() => setRole('driver')} style={{ cursor: 'pointer', textAlign: 'center', padding: '40px 20px', transition: 'transform 0.2s' }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🚜</div>
              <h3 style={{ margin: 0 }}>Driver</h3>
              <p style={{ fontSize: '0.8rem', color: '#718096', marginTop: '10px' }}>ஓட்டுநர் (Log Entries)</p>
            </div>
            <div className="card" onClick={() => setRole('farmer')} style={{ cursor: 'pointer', textAlign: 'center', padding: '40px 20px', transition: 'transform 0.2s' }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🌾</div>
              <h3 style={{ margin: 0 }}>Farmer</h3>
              <p style={{ fontSize: '0.8rem', color: '#718096', marginTop: '10px' }}>விவசாயி (View Bills)</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1B3A6B 0%, #1A6B55 100%)', padding: '20px' }}>
      <div className="card" style={{ maxWidth: '420px', width: '100%', padding: '40px' }}>
        <button onClick={() => setRole(null)} style={{ background: 'none', border: 'none', color: '#718096', cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          ← Back to Selection
        </button>
        
        <h2 style={{ color: '#1B3A6B', marginBottom: '5px' }}>
          {role === 'admin' ? 'Admin Login' : role === 'driver' ? 'Driver Login' : 'Farmer Access'}
        </h2>
        <p style={{ color: '#718096', fontSize: '0.9rem', marginBottom: '30px' }}>
          {role === 'driver' ? 'தொலைபேசி மற்றும் பின்னைப் பயன்படுத்தவும்' : 'உங்கள் விவரங்களைப் பயன்படுத்தவும்'}
        </p>

        <form onSubmit={handleLogin}>
          <InputField 
            english={role === 'admin' ? 'Email' : 'Phone Number'} 
            tamil={role === 'admin' ? 'மின்னஞ்சல்' : 'தொலைபேசி எண்'}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            disabled={loading}
          />

          {role !== 'farmer' && (
            <InputField 
              english={role === 'driver' ? 'PIN' : 'Password'} 
              tamil={role === 'driver' ? 'பின்' : 'கடவுச்சொல்'}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          )}

          {error && <div style={{ color: '#C53030', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'center', fontWeight: 'bold' }}>{error}</div>}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Authenticating...' : 'Login (உள்நுழைக)'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
