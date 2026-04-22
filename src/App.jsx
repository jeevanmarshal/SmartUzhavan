import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import PricingConfig from './pages/PricingConfig';
import DriverEntry from './pages/DriverEntry';
import Harvester from './pages/Harvester';
import Rental from './pages/Rental';
import SalaryDriver from './pages/SalaryDriver';
import Workers from './pages/Workers';
import Farmers from './pages/Farmers';
import Drivers from './pages/Drivers';
import Expenses from './pages/Expenses';
import OwnFarmIncome from './pages/OwnFarmIncome';
import Dashboard from './pages/Dashboard';
import { getData, saveData } from './services/storage';
import { initialFarmers, initialDrivers, initialPricingConfig } from './data/initialData';
import './index.css';

function App() {
  useEffect(() => {
    // Initial Seeding
    if (getData('rl_farmers').length === 0) {
      saveData('rl_farmers', initialFarmers);
    }
    if (getData('rl_drivers').length === 0) {
      saveData('rl_drivers', initialDrivers);
    }
    if (Object.keys(getData('rl_pricing_config')).length === 0) {
      saveData('rl_pricing_config', initialPricingConfig);
    }
  }, []);

  return (
    <Router>
      <nav style={{ padding: '10px 15px', background: '#1B3A6B', display: 'flex', gap: '20px', overflowX: 'auto', whiteSpace: 'nowrap', alignItems: 'center' }}>
        <span style={{ color: '#48BB78', fontWeight: '900', marginRight: '10px', fontSize: '1.2rem', letterSpacing: '0.5px' }}>SmartUzhavan</span>
        <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>Dashboard</Link>
        <Link to="/pricing-config" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>Config</Link>
        <Link to="/driver-entry" style={{ color: 'white', textDecoration: 'none' }}>Log</Link>
        <Link to="/harvester" style={{ color: 'white', textDecoration: 'none' }}>Harvester</Link>
        <Link to="/rental" style={{ color: 'white', textDecoration: 'none' }}>Rental</Link>
        <Link to="/farmers" style={{ color: 'white', textDecoration: 'none' }}>Farmers</Link>
        <Link to="/drivers" style={{ color: 'white', textDecoration: 'none' }}>Drivers</Link>
        <Link to="/expenses" style={{ color: 'white', textDecoration: 'none' }}>Expenses</Link>
        <Link to="/own-farm-income" style={{ color: 'white', textDecoration: 'none' }}>Own Farm</Link>
        <Link to="/salary-driver" style={{ color: 'white', textDecoration: 'none' }}>Salary</Link>
        <Link to="/workers" style={{ color: 'white', textDecoration: 'none' }}>Workers</Link>
      </nav>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pricing-config" element={<PricingConfig />} />
        <Route path="/driver-entry" element={<DriverEntry />} />
        <Route path="/harvester" element={<Harvester />} />
        <Route path="/rental" element={<Rental />} />
        <Route path="/farmers" element={<Farmers />} />
        <Route path="/drivers" element={<Drivers />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/own-farm-income" element={<OwnFarmIncome />} />
        <Route path="/salary-driver" element={<SalaryDriver />} />
        <Route path="/workers" element={<Workers />} />
        
        {/* Default route */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
