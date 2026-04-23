import React, { useState } from 'react';
import { getData, saveData } from '../services/storage';
import Button from '../components/common/Button';

const Settings = () => {
  const [status, setStatus] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState(null);

  const handleExport = () => {
    const collections = [
      'rl_farmers', 'rl_drivers', 'rl_driver_logs', 
      'rl_harvester_jobs', 'rl_rentals', 'rl_expenses', 
      'rl_own_farm_income', 'rl_driver_salary', 
      'rl_work_entries', 'rl_lending', 'rl_pricing_config'
    ];
    
    const backupData = {
      schemaVersion: '2.0.0',
      exportDate: new Date().toISOString(),
      data: {}
    };
    collections.forEach(col => {
      backupData.data[col] = getData(col);
    });

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SmartUzhavan_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    setStatus('Backup exported successfully! (காப்புப்பிரதி எடுக்கப்பட்டது)');
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        if (!data.schemaVersion) {
          setStatus('Error: Invalid backup format. (தவறான கோப்பு வடிவம்)');
          return;
        }
        
        if (data.schemaVersion !== '2.0.0') {
          setStatus(`Error: Incompatible version ${data.schemaVersion}. (ஒவ்வாத பதிப்பு)`);
          return;
        }

        setPendingData(data.data);
        setShowConfirm(true);
      } catch (err) {
        setStatus('Error: Could not read file. (கோப்பைப் படிக்க முடியவில்லை)');
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    if (pendingData) {
      Object.entries(pendingData).forEach(([key, value]) => {
        saveData(key, value);
      });
      setStatus('Data restored successfully! Please refresh. (தரவு மீட்கப்பட்டது)');
      setShowConfirm(false);
      setPendingData(null);
    }
  };

  return (
    <div className="app-container">
      <h1>அமைப்புகள் (Settings)</h1>

      <div className="card">
        <h3>Backup & Restore (காப்புப்பிரதி)</h3>
        <p style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '20px' }}>
          Save your data to a file or restore from a previous backup.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <Button onClick={handleExport} fullWidth>Download Backup (பதிவிறக்கம் செய்)</Button>
          
          <div style={{ border: '2px dashed #CBD5E0', padding: '20px', textAlign: 'center', borderRadius: '8px' }}>
            <label style={{ cursor: 'pointer', display: 'block' }}>
              <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
              <div style={{ fontWeight: 'bold', color: '#1B3A6B' }}>Click to Restore (இறக்குமதி செய்)</div>
              <div style={{ fontSize: '0.75rem', color: '#A0AEC0' }}>Select a .json backup file</div>
            </label>
          </div>
        </div>

        {showConfirm && (
          <div style={{ marginTop: '20px', padding: '15px', background: '#FFF5F5', border: '1px solid #FC8181', borderRadius: '8px' }}>
            <div style={{ color: '#C53030', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>
              Warning: This will overwrite ALL current data. Continue? (தற்போதைய தரவு அனைத்தும் அழிக்கப்படும். தொடரலாமா?)
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button onClick={confirmImport} fullWidth variant="danger">Yes, Overwrite (ஆம்)</Button>
              <Button onClick={() => setShowConfirm(false)} fullWidth variant="outline">Cancel (ரத்து)</Button>
            </div>
          </div>
        )}

        {status && (
          <div style={{ marginTop: '20px', padding: '10px', background: '#EBF8FF', color: '#2B6CB0', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold' }}>
            {status}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <h3>Security (பாதுகாப்பு)</h3>
        <p style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '20px' }}>
          Update your administrative access PIN.
        </p>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
           <input 
             type="password" 
             placeholder="New 4-digit PIN" 
             maxLength={4}
             style={{ padding: '10px', borderRadius: '4px', border: '1px solid #CBD5E0', flex: 1 }}
             id="new-admin-pin"
           />
           <Button 
             onClick={() => {
               const input = document.getElementById('new-admin-pin');
               const newPin = input.value;
               if (newPin && newPin.length === 4 && !isNaN(newPin)) {
                 localStorage.setItem('admin_pin', newPin);
                 setStatus('PIN updated successfully! (கடவுச்சொல் மாற்றப்பட்டது)');
                 input.value = '';
               } else {
                 setStatus('Error: Enter exactly 4 digits. (4 எண்களை உள்ளிடவும்)');
               }
             }}
           >
             Update (மாற்று)
           </Button>
        </div>
      </div>
      
      <div className="card" style={{ marginTop: '20px' }}>
        <h3>App Info</h3>
        <div style={{ fontSize: '0.9rem' }}>Version: 3.0.0 (Gold Master)</div>
        <div style={{ fontSize: '0.9rem' }}>Tamil: Noto Sans Tamil (Server Rendered)</div>
        <div style={{ fontSize: '0.9rem' }}>Status: Production Ready (SRS Aligned)</div>
      </div>
    </div>
  );
};

export default Settings;
