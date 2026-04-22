import React, { useState, useEffect } from 'react';
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
import Login from './pages/Login';
import Finance from './pages/Finance';
import FarmerView from './pages/FarmerView';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import DriverDashboard from './pages/DriverDashboard';
import { getData, saveData } from './services/storage';
import { initialFarmers, initialDrivers, initialPricingConfig } from './data/initialData';
import './index.css';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('su_session');
    return saved ? JSON.parse(saved) : null;
  });

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

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('su_session', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('su_session');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const isAdmin = user.role === 'admin';
  const isDriver = user.role === 'driver';
  const isFarmer = user.role === 'farmer';

  return (
    <Router>
      <header style={{ padding: '10px 15px', background: '#1B3A6B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ color: '#48BB78', fontWeight: '900', fontSize: '1.2rem' }}>SmartUzhavan</span>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>{user.name} ({user.role})</span>
        </div>
        <button 
          onClick={handleLogout}
          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
        >
          Logout
        </button>
      </header>

      <nav style={{ padding: '10px 15px', background: '#2D3748', display: 'flex', gap: '20px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        {isAdmin && (
          <>
            <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>Dashboard</Link>
            <Link to="/pricing-config" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>Config</Link>
            <Link to="/harvester" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>Harvester</Link>
            <Link to="/rental" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>Rental</Link>
            <Link to="/farmers" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>Farmers</Link>
            <Link to="/finance" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>Finance</Link>
            <Link to="/reports" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>Reports</Link>
            <Link to="/settings" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>Settings</Link>
            <Link to="/drivers" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>Drivers</Link>
            <Link to="/expenses" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>Expenses</Link>
            <Link to="/own-farm-income" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>Own Farm</Link>
            <Link to="/salary-driver" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>Driver Salary</Link>
            <Link to="/workers" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>Workers</Link>
          </>
        )}
        {isDriver && (
          <>
            <Link to="/driver-dashboard" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>Dashboard</Link>
            <Link to="/driver-entry" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>Log Entry</Link>
            <Link to="/salary-driver" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>My Salary</Link>
          </>
        )}
        {isFarmer && (
          <>
            <Link to="/farmer-view" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>My Bills</Link>
          </>
        )}
      </nav>

      <Routes>
        {isAdmin && (
          <>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pricing-config" element={<PricingConfig />} />
            <Route path="/harvester" element={<Harvester />} />
            <Route path="/rental" element={<Rental />} />
            <Route path="/farmers" element={<Farmers />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/own-farm-income" element={<OwnFarmIncome />} />
            <Route path="/salary-driver" element={<SalaryDriver />} />
            <Route path="/workers" element={<Workers />} />
          </>
        )}
        {isDriver && (
          <>
            <Route path="/driver-dashboard" element={<DriverDashboard userId={user.id} />} />
            <Route path="/driver-entry" element={<DriverEntry userId={user.id} />} />
            <Route path="/salary-driver" element={<SalaryDriver userId={user.id} />} />
          </>
        )}
        {isFarmer && (
          <>
            <Route path="/farmer-view" element={<FarmerView userId={user.id} />} />
          </>
        )}
        
        <Route path="/" element={<Navigate to={isAdmin ? "/dashboard" : isDriver ? "/driver-dashboard" : "/farmer-view"} replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
