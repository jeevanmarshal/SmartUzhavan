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

  // ROLE SELECTION SCREEN
  if (!role) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'linear-gradient(135deg, #1B3A6B 0%, #1A6B55 100%)', 
        padding: '16px'
      }}>
        <div style={{ maxWidth: '900px', width: '100%' }}>
          
          {/* APP HEADER SECTION */}
          <h1 style={{ 
            textAlign: 'center', 
            color: 'white', 
            marginBottom: '6px',
            fontSize: 'clamp(28px, 8vw, 40px)',
            fontWeight: '800',
            letterSpacing: '0.5px'
          }}>
            SmartUzhavan
          </h1>
          
          <p style={{ 
            textAlign: 'center', 
            color: 'rgba(255,255,255,0.85)', 
            marginBottom: '4px',
            fontSize: 'clamp(11px, 2vw, 14px)',
            fontWeight: '400',
            letterSpacing: '0.3px'
          }}>
            by V.J.P Harvesters
          </p>
          
          <p style={{ 
            textAlign: 'center', 
            color: 'rgba(255,255,255,0.75)', 
            marginBottom: '32px',
            fontSize: 'clamp(13px, 3vw, 16px)',
            lineHeight: '1.5',
            fontWeight: '400'
          }}>
            பயன்பாட்டைத் தொடங்க உங்கள் பங்கைத் தேர்ந்தெடுக்கவும் (Select your role to begin)
          </p>

          {/* ROLE SELECTION CARDS */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
            gap: 'clamp(12px, 3vw, 20px)',
            maxWidth: '1000px',
            margin: '0 auto'
          }}>
            
            {/* ADMINISTRATOR CARD */}
            <div 
              className="card" 
              onClick={() => setRole('admin')} 
              style={{ 
                cursor: 'pointer', 
                textAlign: 'center', 
                padding: 'clamp(20px, 4vw, 36px)',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 'auto'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ 
                fontSize: 'clamp(40px, 10vw, 56px)',
                marginBottom: 'clamp(12px, 3vw, 16px)',
                lineHeight: '1'
              }}>
                👨‍💼
              </div>
              <h3 style={{ 
                margin: '0 0 6px 0',
                fontSize: 'clamp(16px, 4vw, 20px)',
                fontWeight: '700'
              }}>
                Administrator
              </h3>
              <p style={{ 
                fontSize: 'clamp(13px, 3vw, 14px)',
                color: '#718096', 
                marginTop: '6px',
                marginBottom: '0',
                fontFamily: "'Noto Sans Tamil', sans-serif"
              }}>
                நிர்வாகி (Price & Reports)
              </p>
            </div>

            {/* DRIVER CARD */}
            <div 
              className="card" 
              onClick={() => setRole('driver')} 
              style={{ 
                cursor: 'pointer', 
                textAlign: 'center', 
                padding: 'clamp(20px, 4vw, 36px)',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 'auto'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ 
                fontSize: 'clamp(40px, 10vw, 56px)',
                marginBottom: 'clamp(12px, 3vw, 16px)',
                lineHeight: '1'
              }}>
                🚜
              </div>
              <h3 style={{ 
                margin: '0 0 6px 0',
                fontSize: 'clamp(16px, 4vw, 20px)',
                fontWeight: '700'
              }}>
                Driver
              </h3>
              <p style={{ 
                fontSize: 'clamp(13px, 3vw, 14px)',
                color: '#718096', 
                marginTop: '6px',
                marginBottom: '0',
                fontFamily: "'Noto Sans Tamil', sans-serif"
              }}>
                ஓட்டுநர் (Log Entries)
              </p>
            </div>

            {/* FARMER CARD */}
            <div 
              className="card" 
              onClick={() => setRole('farmer')} 
              style={{ 
                cursor: 'pointer', 
                textAlign: 'center', 
                padding: 'clamp(20px, 4vw, 36px)',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 'auto'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ 
                fontSize: 'clamp(40px, 10vw, 56px)',
                marginBottom: 'clamp(12px, 3vw, 16px)',
                lineHeight: '1'
              }}>
                🌾
              </div>
              <h3 style={{ 
                margin: '0 0 6px 0',
                fontSize: 'clamp(16px, 4vw, 20px)',
                fontWeight: '700'
              }}>
                Farmer
              </h3>
              <p style={{ 
                fontSize: 'clamp(13px, 3vw, 14px)',
                color: '#718096', 
                marginTop: '6px',
                marginBottom: '0',
                fontFamily: "'Noto Sans Tamil', sans-serif"
              }}>
                விவசாயி (View Bills)
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LOGIN FORM SCREEN
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, #1B3A6B 0%, #1A6B55 100%)', 
      padding: '16px'
    }}>
      <div className="card" style={{ maxWidth: '420px', width: '100%', padding: 'clamp(24px, 5vw, 40px)' }}>
        
        {/* BACK BUTTON */}
        <button 
          onClick={() => setRole(null)} 
          style={{ 
            background: '#FF6F00',
            color: 'white', 
            border: 'none',
            borderRadius: '6px',
            padding: '12px 20px',
            minHeight: '44px',
            cursor: 'pointer', 
            marginBottom: '24px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '8px',
            fontSize: 'clamp(14px, 2vw, 16px)',
            fontWeight: '600',
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            width: '100%'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#E65100';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#FF6F00';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          ← Back to Selection
        </button>
        
        {/* LOGIN HEADER */}
        <h2 style={{ 
          color: '#1B3A6B', 
          marginBottom: '8px',
          fontSize: 'clamp(20px, 4vw, 24px)'
        }}>
          {role === 'admin' ? 'Admin Login' : role === 'driver' ? 'Driver Login' : 'Farmer Access'}
        </h2>
        <p style={{ 
          color: '#718096', 
          fontSize: 'clamp(13px, 3vw, 15px)',
          marginBottom: '24px',
          fontFamily: "'Noto Sans Tamil', sans-serif"
        }}>
          {role === 'driver' ? 'தொலைபேசி மற்றும் பின்னைப் பயன்படுத்தவும்' : 'உங்கள் விவரங்களைப் பயன்படுத்தவும்'}
        </p>

        {/* LOGIN FORM */}
        <form onSubmit={handleLogin}>
          <InputField 
            english="Phone Number" 
            tamil="தொலைபேசி எண்"
            type="number"
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

          {error && <div style={{ 
            color: '#C53030', 
            fontSize: 'clamp(12px, 2vw, 14px)',
            marginBottom: '15px', 
            textAlign: 'center', 
            fontWeight: 'bold' 
          }}>
            {error}
          </div>}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Authenticating...' : 'Login (உள்நுழைக)'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
