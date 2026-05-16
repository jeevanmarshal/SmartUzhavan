import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { formatCurrency } from '../utils/formatters';

const Dashboard = () => {
  const { dashboardSummary, loading, error, appStatus, refreshDashboard } = useData();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  if (loading && !dashboardSummary.totalIncome) {
    return <div className="app-container">Loading Dashboard Data...</div>;
  }

  if (error) {
    return <div className="app-container" style={{ color: 'red' }}>Error loading dashboard: {error}</div>;
  }

  // Map backend summary to UI, applying defaults until backend is fully hooked up for these specific fields
  const stats = {
    harvesterRev: dashboardSummary.harvesterRev || 0,
    rentalRev: dashboardSummary.rentalRev || 0,
    ownFarmRev: dashboardSummary.ownFarmRev || 0,
    driverSalaries: dashboardSummary.driverSalaries || 0,
    workerWages: dashboardSummary.workerWages || 0,
    generalExpenses: dashboardSummary.generalExpenses || dashboardSummary.totalExpenses || 0,
    jobExpenses: dashboardSummary.jobExpenses || 0,
    totalIncome: dashboardSummary.totalIncome || dashboardSummary.totalPaid || 0,
    totalExpense: dashboardSummary.totalExpense || dashboardSummary.totalExpenses || 0,
    netProfit: dashboardSummary.netProfit || ((dashboardSummary.totalIncome || dashboardSummary.totalPaid || 0) - (dashboardSummary.totalExpense || dashboardSummary.totalExpenses || 0)),
    pendingBillsCount: dashboardSummary.pendingBillsCount || dashboardSummary.pendingPayments || 0,
    outstandingFarmerBalance: dashboardSummary.outstandingFarmerBalance || dashboardSummary.totalPending || 0,
  };

  return (
    <div className="app-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(20px, 5vw, 28px)' }}>நிர்வாக மேலாண்மை (Executive Dashboard)</h1>
          <div style={{ display: 'flex', gap: '5px' }}>
            {appStatus === 'offline_network' && <span style={{ background: '#E53E3E', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>OFFLINE</span>}
            {appStatus === 'offline_server' && <span style={{ background: '#D69E2E', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>SERVER OFFLINE</span>}
            {appStatus === 'online' && <span style={{ background: '#38A169', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>LIVE</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={refreshDashboard} style={{ padding: '8px', borderRadius: '4px', background: '#E2E8F0', border: '1px solid #CBD5E0', cursor: 'pointer' }}>Refresh</button>
          <select value={month} onChange={(e) => setMonth(e.target.value)} style={{ padding: '8px', borderRadius: '4px' }}>
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(e.target.value)} style={{ padding: '8px', borderRadius: '4px' }}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="card" style={{ background: 'linear-gradient(135deg, #1A6B55 0%, #2D3748 100%)', color: 'white' }}>
        <h3 style={{ color: 'rgba(255,255,255,0.8)' }}>Net Profit (நிகர லாபம்)</h3>
        <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>{formatCurrency(stats.netProfit)}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '15px' }}>
          <div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Total Income</div>
            <div style={{ fontWeight: 'bold' }}>{formatCurrency(stats.totalIncome)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Total Expense</div>
            <div style={{ fontWeight: 'bold' }}>{formatCurrency(stats.totalExpense)}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginTop: '20px' }}>
        <div className="card" style={{ borderLeft: '4px solid #38A169' }}>
          <h4>Pending Bills</h4>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1A6B55' }}>{stats.pendingBillsCount}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #E53E3E' }}>
          <h4>Farmer Dues</h4>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#C53030' }}>{formatCurrency(stats.outstandingFarmerBalance)}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #3182CE' }}>
          <h4>Job Expenses</h4>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2B6CB0' }}>{formatCurrency(stats.jobExpenses)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
        <div className="card">
          <h4>Income Breakdown</h4>
          <div style={{ fontSize: '0.9rem' }}>Harvester: {formatCurrency(stats.harvesterRev)}</div>
          <div style={{ fontSize: '0.9rem' }}>Rental: {formatCurrency(stats.rentalRev)}</div>
          <div style={{ fontSize: '0.9rem' }}>Own Farm: {formatCurrency(stats.ownFarmRev)}</div>
        </div>
        <div className="card">
          <h4>Expense Breakdown</h4>
          <div style={{ fontSize: '0.9rem' }}>Driver Salaries: {formatCurrency(stats.driverSalaries)}</div>
          <div style={{ fontSize: '0.9rem' }}>Worker Wages: {formatCurrency(stats.workerWages)}</div>
          <div style={{ fontSize: '0.9rem' }}>General/Home: {formatCurrency(stats.generalExpenses)}</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
