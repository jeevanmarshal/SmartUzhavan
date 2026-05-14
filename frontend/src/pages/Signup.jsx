import React, { useState } from 'react';
import { authService } from '../services/api';
import Button from '../components/common/Button';
import InputField from '../components/common/InputField';
import SelectField from '../components/common/SelectField';

const Signup = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: 'driver',
    roleData: {}
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match');
    
    setLoading(true);
    setError('');

    try {
      const data = await authService.signup(formData);
      if (data && data.user) {
        onLogin({
          id: data.user._id || data.user.id,
          name: `${data.user.firstName} ${data.user.lastName}`,
          role: data.user.role.toLowerCase(),
          email: data.user.email
        });
      }
    } catch (err) {
      setError(err.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, #1B3A6B 0%, #1A6B55 100%)',
      padding: '40px 20px'
    }}>
      <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '30px' }}>
        <h1 style={{ textAlign: 'center', color: '#1B3A6B', marginBottom: '10px' }}>SmartUzhavan</h1>
        <p style={{ textAlign: 'center', color: '#718096', marginBottom: '30px' }}>புதிய கணக்கு (Create Account)</p>

        <form onSubmit={handleSignup}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <InputField 
              english="First Name" tamil="முதல் பெயர்"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            <InputField 
              english="Last Name" tamil="குடும்ப பெயர்"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>

          <InputField 
            english="Email" tamil="மின்னஞ்சல்"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <InputField 
            english="Phone" tamil="தொலைபேசி"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            required
          />

          <SelectField 
            english="Account Type" tamil="கணக்கு வகை"
            name="role"
            options={[
              { value: 'driver', label: 'Driver (ஓட்டுநர்)' },
              { value: 'farmer', label: 'Farmer (விவசாயி)' }
            ]}
            value={formData.role}
            onChange={handleChange}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <InputField 
              english="Password" tamil="கடவுச்சொல்"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <InputField 
              english="Confirm" tamil="உறுதிப்படுத்தவும்"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          {error && (
            <div style={{ color: '#C53030', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'center', fontWeight: 'bold' }}>
              {error}
            </div>
          )}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Processing...' : 'Sign Up (பதிவு செய்க)'}
          </Button>
        </form>
        
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem', color: '#718096' }}>
          Already have an account? <a href="/login" style={{ color: '#1B3A6B', fontWeight: 'bold' }}>Login</a>
        </div>
      </div>
    </div>
  );
};

export default Signup;
