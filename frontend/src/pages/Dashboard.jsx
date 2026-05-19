import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { formatCurrency } from '../utils/formatters';

const Dashboard = () => {
  const { dashboardSummary, loading, error, appStatus, refreshDashboard } = useData();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  // Automated Filter Logic: Trigger backend fetch whenever Month or Year changes
  useEffect(() => {
    refreshDashboard(month, year);
  }, [month, year, refreshDashboard]);

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    await refreshDashboard(month, year);
    // Visual feedback delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  if (loading && !dashboardSummary.totalIncome && !isRefreshing) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', fontSize: '1.2rem', color: '#4A5568', fontWeight: '600' }}>
          Loading Dashboard Data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: '#E53E3E', fontSize: '1.1rem', fontWeight: 'bold' }}>
          Error loading dashboard: {error}
        </div>
      </div>
    );
  }

  // Map backend summary to UI, applying accurate database-linked values
  const stats = {
    harvesterRev: dashboardSummary.harvesterRev || dashboardSummary.harvestIncome || 0,
    rentalRev: dashboardSummary.rentalRev || 0,
    ownFarmRev: dashboardSummary.ownFarmRev || 0,
    driverSalaries: dashboardSummary.driverSalaries || 0,
    workerWages: dashboardSummary.workerWages || 0,
    generalExpenses: dashboardSummary.generalExpenses || dashboardSummary.totalExpenses || 0,
    jobExpenses: dashboardSummary.jobExpenses || 0,
    totalIncome: dashboardSummary.totalIncome || dashboardSummary.totalPaid || 0,
    totalExpense: dashboardSummary.totalExpense || dashboardSummary.totalExpenses || 0,
    netProfit: dashboardSummary.netProfit !== undefined ? dashboardSummary.netProfit : ((dashboardSummary.totalIncome || 0) - (dashboardSummary.totalExpense || 0)),
    pendingBillsCount: dashboardSummary.pendingBillsCount || dashboardSummary.pendingPayments || 0,
    outstandingFarmerBalance: dashboardSummary.outstandingFarmerBalance || dashboardSummary.totalPending || 0,
  };

  return (
    <div className="app-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      
      {/* HEADER SECTION (FULLY ALIGNED CENTER) */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '25px', width: '100%' }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: 'clamp(20px, 5vw, 28px)', textAlign: 'center', lineHeight: '1.4', fontWeight: '800', color: '#2D3748' }}>
          நிர்வாக மேலாண்மை <br /> (Executive Dashboard)
        </h1>
        
        <div style={{ display: 'flex', gap: '5px', marginBottom: '20px' }}>
          {appStatus === 'offline_network' && <span style={{ background: '#E53E3E', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px' }}>OFFLINE</span>}
          {appStatus === 'offline_server' && <span style={{ background: '#D69E2E', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px' }}>SERVER OFFLINE</span>}
          {appStatus === 'online' && <span style={{ background: '#38A169', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px' }}>LIVE</span>}
        </div>
        
        {/* RESPONSIVE FILTER CONTROLS */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', width: '100%', marginBottom: '10px' }}>
          <button 
            onClick={handleRefreshClick} 
            disabled={isRefreshing}
            style={{ 
              padding: '8px 18px', 
              borderRadius: '8px', 
              background: isRefreshing ? '#E2E8F0' : '#3182CE', 
              color: isRefreshing ? '#718096' : 'white',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              transform: isRefreshing ? 'scale(0.95)' : 'scale(1)'
            }}
          >
            {isRefreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
          </button>
          
          <select 
            value={month} 
            onChange={(e) => setMonth(parseInt(e.target.value, 10))} 
            style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #CBD5E0', background: 'white', fontWeight: '600', color: '#4A5568', cursor: 'pointer' }}
          >
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          
          <select 
            value={year} 
            onChange={(e) => setYear(parseInt(e.target.value, 10))} 
            style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #CBD5E0', background: 'white', fontWeight: '600', color: '#4A5568', cursor: 'pointer' }}
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* 1. NET PROFIT CARD (COMPLETELY CENTER ALIGNED) */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #1A6B55 0%, #2D3748 100%)', color: 'white', textAlign: 'center', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <h3 style={{ color: 'rgba(255,255,255,0.85)', margin: '0 0 10px 0', fontSize: '1.2rem', letterSpacing: '0.5px', textAlign: 'center' }}>
          Net Profit (நிகர லாபம்)
        </h3>
        
        <div style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', fontWeight: '800', textAlign: 'center', margin: '15px 0' }}>
          {formatCurrency(stats.netProfit)}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '15px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '4px' }}>Total Income (வருவாய்)</div>
            <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{formatCurrency(stats.totalIncome)}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '4px' }}>Total Expense (செலவு)</div>
            <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{formatCurrency(stats.totalExpense)}</div>
          </div>
        </div>
      </div>

      {/* 2. PENDING BILLS, FARMER DUES & JOB EXPENSES (CENTER ALIGNED) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginTop: '20px' }}>
        <div className="card" style={{ borderLeft: '5px solid #48BB78', textAlign: 'center', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#718096', textAlign: 'center' }}>Pending Bills</h4>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#2F855A', textAlign: 'center' }}>
            {stats.pendingBillsCount}
          </div>
        </div>
        
        <div className="card" style={{ borderLeft: '5px solid #F56565', textAlign: 'center', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#718096', textAlign: 'center' }}>Farmer Dues</h4>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#C53030', textAlign: 'center' }}>
            {formatCurrency(stats.outstandingFarmerBalance)}
          </div>
        </div>
        
        <div className="card" style={{ borderLeft: '5px solid #4299E1', textAlign: 'center', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#718096', textAlign: 'center' }}>Job Expenses</h4>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#2B6CB0', textAlign: 'center' }}>
            {formatCurrency(stats.jobExpenses)}
          </div>
        </div>
      </div>

      {/* 3. INCOME & EXPENSE BREAKDOWNS (CENTER ALIGNED) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '25px' }}>
        <div className="card" style={{ padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <h4 style={{ borderBottom: '2px solid #EDF2F7', paddingBottom: '10px', marginBottom: '15px', fontSize: '1.1rem', color: '#2D3748', textAlign: 'center' }}>
            Income Breakdown (வருவாய்)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: '500', display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>Harvester Income:</span>
              <span style={{ fontWeight: '700', color: '#2F855A' }}>{formatCurrency(stats.harvesterRev)}</span>
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '500', display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: '1px solid #F7FAFC' }}>
              <span>Rental Income:</span>
              <span style={{ fontWeight: '700', color: '#2F855A' }}>{formatCurrency(stats.rentalRev)}</span>
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '500', display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: '1px solid #F7FAFC' }}>
              <span>Own Farm Income:</span>
              <span style={{ fontWeight: '700', color: '#2F855A' }}>{formatCurrency(stats.ownFarmRev)}</span>
            </div>
          </div>
        </div>
        
        <div className="card" style={{ padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <h4 style={{ borderBottom: '2px solid #EDF2F7', paddingBottom: '10px', marginBottom: '15px', fontSize: '1.1rem', color: '#2D3748', textAlign: 'center' }}>
            Expense Breakdown (செலவு)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: '500', display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>Driver Salaries:</span>
              <span style={{ fontWeight: '700', color: '#C53030' }}>{formatCurrency(stats.driverSalaries)}</span>
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '500', display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: '1px solid #F7FAFC' }}>
              <span>Worker Wages:</span>
              <span style={{ fontWeight: '700', color: '#C53030' }}>{formatCurrency(stats.workerWages)}</span>
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '500', display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: '1px solid #F7FAFC' }}>
              <span>General Business Expenses:</span>
              <span style={{ fontWeight: '700', color: '#C53030' }}>{formatCurrency(stats.generalExpenses)}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
