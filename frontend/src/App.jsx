import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import DriverEntry from './pages/DriverEntry';
import Harvester from './pages/Harvester';
import Rental from './pages/Rental';

import Workers from './pages/Workers';
import Farmers from './pages/Farmers';
import Drivers from './pages/Drivers';
import Expenses from './pages/Expenses';
import OwnFarmIncome from './pages/OwnFarmIncome';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Finance from './pages/Finance';
import FarmerView from './pages/FarmerView';
import System from './pages/System';
import DriverDashboard from './pages/DriverDashboard';
import { DataProvider } from './context/DataContext';
import Signup from './pages/Signup';
import { apiService } from './services/api';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('su_session');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('su_session', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('su_session');
    localStorage.removeItem('authToken');
  };

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/signup" element={<Signup onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  const role = user.role ? user.role.toLowerCase() : '';
  const isAdmin = role === 'admin' || role === 'super_admin';
  const isDriver = role === 'driver';
  const isFarmer = role === 'farmer';

  return (
    <DataProvider>
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
            <Link to="/harvester" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>Harvester</Link>
            <Link to="/rental" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>Rental</Link>
            <Link to="/farmers" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>Farmers</Link>
            <Link to="/finance" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>Finance</Link>
            <Link to="/system" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>System (அமைப்பு)</Link>
            <Link to="/drivers" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>Drivers</Link>
            <Link to="/expenses" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>Expenses</Link>
            <Link to="/own-farm-income" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>Own Farm</Link>
            <Link to="/workers" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>Workers</Link>
          </>
        )}
        {isDriver && (
          <>
            <Link to="/driver-dashboard" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>Dashboard</Link>
            <Link to="/driver-entry" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>Log Entry</Link>
            <Link to="/drivers?tab=salary" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>My Salary</Link>
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
            <Route path="/harvester" element={<Harvester />} />
            <Route path="/rental" element={<Rental />} />
            <Route path="/farmers" element={<Farmers />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/system" element={<System />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/own-farm-income" element={<OwnFarmIncome />} />
            <Route path="/workers" element={<Workers />} />
          </>
        )}
        {isDriver && (
          <>
            <Route path="/driver-dashboard" element={<DriverDashboard userId={user.id} />} />
            <Route path="/driver-entry" element={<DriverEntry userId={user.id} />} />
            <Route path="/drivers" element={<Drivers userId={user.id} />} />
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
    </DataProvider>
  );
}

export default App;
