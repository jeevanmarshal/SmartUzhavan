import React, { useState } from 'react';
import { apiService, authService, driverService } from '../services/api';
import Button from '../components/common/Button';
import InputField from '../components/common/InputField';

const Login = ({ onLogin }) => {
  const [identifier, setIdentifier] = useState(''); // Email or Phone
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use the new V6 authService
      const data = await authService.login(identifier, password);
      
      // data should contain { user, token }
      // The interceptor already stored the token, but we need to notify App.jsx
      if (data && data.user) {
        onLogin({
          id: data.user._id || data.user.id,
          name: data.user.firstName ? `${data.user.firstName} ${data.user.lastName}` : (data.user.username || data.user.name || 'User'),
          role: data.user.role.toLowerCase(),
          email: data.user.email
        });
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
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
      <div className="card" style={{ 
        maxWidth: '420px', 
        width: '100%', 
        padding: '40px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '5px', letterSpacing: '-1px' }}>SmartUzhavan</h1>
          <p style={{ color: '#718096', fontSize: '0.9rem', fontWeight: '500' }}>நிர்வாக நுழைவு (Executive Portal)</p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <InputField 
              english="Email / Phone" tamil="மின்னஞ்சல் / தொலைபேசி"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="admin@smartuzhavan.com"
              required
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <InputField 
              english="Password" tamil="கடவுச்சொல்"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div style={{ 
              color: '#C53030', 
              background: '#FFF5F5', 
              padding: '12px', 
              borderRadius: '8px', 
              fontSize: '0.85rem', 
              marginBottom: '20px', 
              textAlign: 'center', 
              fontWeight: '600',
              border: '1px solid #FEB2B2'
            }}>
              {error}
            </div>
          )}

          <Button type="submit" fullWidth disabled={loading} style={{ height: '50px', fontSize: '1rem', fontWeight: '700' }}>
            {loading ? 'Authenticating...' : 'Login (உள்நுழைக)'}
          </Button>
        </form>
        
        <div style={{ marginTop: '25px', textAlign: 'center', fontSize: '0.8rem', color: '#A0AEC0' }}>
          v3.1 Production | © 2026 SmartUzhavan
        </div>
      </div>
    </div>
  );
};

export default Login;
