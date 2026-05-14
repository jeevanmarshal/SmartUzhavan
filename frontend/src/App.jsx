import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
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

const NavLink = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(to);
  return (
    <Link 
      to={to} 
      style={{ 
        color: 'white', 
        textDecoration: 'none', 
        fontSize: '0.85rem', 
        padding: '12px 10px',
        borderBottom: isActive ? '3px solid #48BB78' : '3px solid transparent',
        background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
        transition: 'all 0.2s',
        display: 'inline-block',
        fontWeight: isActive ? '700' : '500'
      }}
    >
      {children}
    </Link>
  );
};

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

  const role = user && user.role ? user.role.toUpperCase() : '';
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const isDriver = role === 'DRIVER';
  const isFarmer = role === 'FARMER';

  return (
    <DataProvider>
      <Router>
      <header style={{ padding: '10px 15px', background: '#1B3A6B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ color: '#48BB78', fontWeight: '900', fontSize: '1.4rem', letterSpacing: '-0.5px' }}>SmartUzhavan</span>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: '600', color: 'white' }}>{user.name}</span>
            <span>{user.role}</span>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          style={{ 
            background: 'rgba(255,255,255,0.1)', 
            border: '1px solid rgba(255,255,255,0.2)', 
            color: 'white', 
            padding: '6px 14px', 
            borderRadius: '6px', 
            cursor: 'pointer', 
            fontSize: '0.85rem',
            transition: 'all 0.2s'
          }}
        >
          Logout
        </button>
      </header>

      <nav style={{ 
        padding: '0 15px', 
        background: '#2D3748', 
        display: 'flex', 
        gap: '5px', 
        overflowX: 'auto', 
        whiteSpace: 'nowrap',
        borderBottom: '1px solid #4A5568'
      }}>
        {isAdmin && (
          <>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/harvester">Harvester</NavLink>
            <NavLink to="/rental">Rental</NavLink>
            <NavLink to="/finance">Finance</NavLink>
            <NavLink to="/expenses">Expenses</NavLink>
            <NavLink to="/own-farm-income">Own Farm</NavLink>
            <NavLink to="/farmers">Farmers</NavLink>
            <NavLink to="/drivers">Drivers</NavLink>
            <NavLink to="/workers">Workers</NavLink>
            <NavLink to="/system">System (அமைப்பு)</NavLink>
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
