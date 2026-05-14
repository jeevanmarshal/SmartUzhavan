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
      <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '30px' }}>
        <h1 style={{ textAlign: 'center', color: '#1B3A6B', marginBottom: '10px' }}>SmartUzhavan</h1>
        <p style={{ textAlign: 'center', color: '#718096', marginBottom: '30px' }}>அங்கீகார நுழைவு (Secure Login)</p>

        <form onSubmit={handleLogin}>
          <InputField 
            english="Email / Phone" tamil="மின்னஞ்சல் / தொலைபேசி"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Enter Email or Phone"
            required
            disabled={loading}
          />

          <InputField 
            english="Password" tamil="கடவுச்சொல்"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="****"
            required
            disabled={loading}
          />

          {error && (
            <div style={{ color: '#C53030', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'center', fontWeight: 'bold' }}>
              {error}
            </div>
          )}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Logging in...' : 'Login (உள்நுழைக)'}
          </Button>
        </form>
        
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem', color: '#718096' }}>
          நிர்வாகி அல்லது ஓட்டுநர் விவரங்களைப் பயன்படுத்தவும்
        </div>
      </div>
    </div>
  );
};

export default Login;
