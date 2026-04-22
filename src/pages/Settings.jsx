import React, { useState } from 'react';
import { getData, saveData } from '../services/storage';
import Button from '../components/common/Button';

const Settings = () => {
  const [status, setStatus] = useState('');

  const handleExport = () => {
    const collections = [
      'rl_farmers', 'rl_drivers', 'rl_driver_logs', 
      'rl_harvester_jobs', 'rl_rentals', 'rl_expenses', 
      'rl_own_farm_income', 'rl_driver_salary', 
      'rl_work_entries', 'rl_lending', 'rl_pricing_config'
    ];
    
    const backupData = {};
    collections.forEach(col => {
      backupData[col] = getData(col);
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
        if (window.confirm('This will overwrite current data. Continue? (தற்போதைய தரவு மாற்றப்படும். தொடரலாமா?)')) {
          Object.entries(data).forEach(([key, value]) => {
            saveData(key, value);
          });
          setStatus('Data imported successfully! Please refresh. (தரவு இறக்குமதி செய்யப்பட்டது)');
        }
      } catch (err) {
        setStatus('Error: Invalid backup file. (தவறான கோப்பு)');
      }
    };
    reader.readAsText(file);
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

        {status && (
          <div style={{ marginTop: '20px', padding: '10px', background: '#EBF8FF', color: '#2B6CB0', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold' }}>
            {status}
          </div>
        )}
      </div>
      
      <div className="card" style={{ marginTop: '20px' }}>
        <h3>App Info</h3>
        <div style={{ fontSize: '0.9rem' }}>Version: 2.0.0 (Correction Patch)</div>
        <div style={{ fontSize: '0.9rem' }}>Status: Production Ready (SRS Aligned)</div>
      </div>
    </div>
  );
};

export default Settings;
