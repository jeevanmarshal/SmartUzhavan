import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PricingConfig from './PricingConfig';
import Settings from './Settings';
import Reports from './Reports';

const System = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('price');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['price', 'settings', 'reports'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  return (
    <div className="app-container">
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('price')} 
          style={{ flex: 1, padding: '10px', background: activeTab === 'price' ? '#1B3A6B' : '#EDF2F7', color: activeTab === 'price' ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Price Settings (விலை அமைப்பு)
        </button>
        <button 
          onClick={() => setActiveTab('settings')} 
          style={{ flex: 1, padding: '10px', background: activeTab === 'settings' ? '#1B3A6B' : '#EDF2F7', color: activeTab === 'settings' ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          System Settings (கணினி அமைப்பு)
        </button>
        <button 
          onClick={() => setActiveTab('reports')} 
          style={{ flex: 1, padding: '10px', background: activeTab === 'reports' ? '#1B3A6B' : '#EDF2F7', color: activeTab === 'reports' ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Reports (அறிக்கைகள்)
        </button>
      </div>

      <div>
        {activeTab === 'price' && <PricingConfig />}
        {activeTab === 'settings' && <Settings />}
        {activeTab === 'reports' && <Reports />}
      </div>
    </div>
  );
};

export default System;
