import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import useAPI from '../hooks/useAPI';
import SelectField from '../components/common/SelectField';
import Button from '../components/common/Button';

const Settings = () => {
  const { execute: fetchDrivers } = useAPI(apiService.getDrivers.bind(apiService));
  const [status, setStatus] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [driverPin, setDriverPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    const loadDrivers = async () => {
      try {
        const data = await fetchDrivers();
        setDrivers((data?.data || data || []).filter(d => d.active !== false));
      } catch (err) {
        console.error('Failed to load drivers', err);
      }
    };
    loadDrivers();
  }, []);

  const handleExport = () => {
    setStatus('Export is now managed via Backend Administration.');
  };

  const handleImport = (e) => {
    setStatus('Import is now managed via Backend Administration.');
  };

  return (
    <div className="app-container">
      <h1>அமைப்புகள் (Settings)</h1>

      <div className="card">
        <h3>Backup & Restore (காப்புப்பிரதி)</h3>
        <p style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '20px' }}>
          Data is now securely stored and backed up on the cloud server. (தரவுகள் இப்போது பாதுகாப்பாக கிளவுட் சர்வரில் சேமிக்கப்படுகின்றன.)
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <Button onClick={handleExport} fullWidth variant="outline">Download Data Request (தரவு கோரிக்கை)</Button>
        </div>

        {status && (
          <div style={{ marginTop: '20px', padding: '10px', background: '#EBF8FF', color: '#2B6CB0', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold' }}>
            {status}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <h3>Security (பாதுகாப்பு)</h3>
        <p style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '20px' }}>
          Update administrator password (நிர்வாகி கடவுச்சொல்லை மாற்றவும்).
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="flex-group-responsive">
            <input 
              type="password" 
              placeholder="New Admin Password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #CBD5E0', flex: 1 }}
            />
            <Button 
              onClick={async () => {
                if (!newPassword || newPassword.length < 4) {
                  setStatus('Password must be at least 4 characters.');
                  return;
                }
                try {
                  await apiService.updateProfile({ password: newPassword });
                  setStatus('நிர்வாகி கடவுச்சொல் மாற்றப்பட்டது (Password Updated)');
                  setNewPassword('');
                } catch (err) {
                  setStatus('Failed: ' + err.message);
                }
              }}
            >
              Update Password
            </Button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <h3>Driver PIN Management (ஓட்டுநர் கடவுச்சொல்)</h3>
        <p style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '15px' }}>
          Change login PIN for any active driver.
        </p>
        <SelectField 
          english="Select Driver" tamil="ஓட்டுநர்" 
          options={drivers.map(d => ({ value: d._id, label: d.name }))}
          value={selectedDriverId}
          onChange={(e) => setSelectedDriverId(e.target.value)}
        />
        <div className="flex-group-responsive" style={{ marginTop: '10px' }}>
           <input 
             type="password" 
             placeholder="New 4-digit PIN" 
             maxLength={4}
             value={driverPin}
             onChange={(e) => setDriverPin(e.target.value)}
             style={{ padding: '10px', borderRadius: '4px', border: '1px solid #CBD5E0', flex: 1 }}
           />
           <Button 
             onClick={async () => {
               if (!selectedDriverId) {
                 setStatus('Please select a driver (ஓட்டுநரை தேர்ந்தெடுக்கவும்)');
                 return;
               }
               if (driverPin && driverPin.length === 4 && !isNaN(driverPin)) {
                 try {
                   await apiService.updateDriver(selectedDriverId, { pin: driverPin });
                   setStatus('PIN வெற்றிகரமாக மாற்றப்பட்டது (PIN Updated)');
                   setDriverPin('');
                   setSelectedDriverId('');
                 } catch (err) {
                   setStatus('Failed to update PIN: ' + err.message);
                 }
               } else {
                 setStatus('சரியான 4 இலக்க PIN உள்ளிடவும் (Enter 4 digits)');
               }
             }}
           >
             Update
           </Button>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <h3>App Info</h3>
        <div style={{ fontSize: '0.9rem' }}>Version: 5.0.0 (Cloud Database V5)</div>
        <div style={{ fontSize: '0.9rem' }}>Tamil: Noto Sans Tamil (Server Rendered)</div>
        <div style={{ fontSize: '0.9rem' }}>Status: Production Ready (v5.0 Aligned)</div>
      </div>
    </div>
  );
};

export default Settings;
