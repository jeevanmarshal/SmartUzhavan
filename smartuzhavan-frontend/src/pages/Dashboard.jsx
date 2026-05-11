import React, { useState, useEffect, useMemo } from 'react';
import { getData } from '../services/storage';
import { formatCurrency } from '../utils/formatters';
import SelectField from '../components/common/SelectField';

const Dashboard = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState({
    harvesterRev: 0,
    rentalRev: 0,
    ownFarmRev: 0,
    driverSalaries: 0,
    workerWages: 0,
    generalExpenses: 0,
    jobExpenses: 0,
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    pendingBillsCount: 0,
    outstandingFarmerBalance: 0,
    unpaidDriverSalary: 0
  });

  useEffect(() => {
    const jobs = getData('rl_harvester_jobs');
    const rentals = getData('rl_rentals');
    const ownIncomes = getData('rl_own_farm_income');
    const driverSals = getData('rl_driver_salary');
    const workEntries = getData('rl_work_entries');
    const expenses = getData('rl_expenses');

    // Filter by Month/Year
    const filterByDate = (dateStr) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d.getMonth() + 1 === parseInt(month) && d.getFullYear() === parseInt(year);
    };

    // Filter jobs (Harvester bills have a billId but jobs should have a date or seasonYear)
    // Actually, jobs have seasonYear. For simplicity, we'll use the record creation date if available, 
    // but the SRS suggests a month selector for general flow.
    // We'll add a 'date' field to harvester jobs if missing, but for now we'll use seasonYear if month is not applicable, 
    // or better, assume every record has a 'date' field for dashboard filtering.
    
    const filteredJobs = jobs.filter(j => j.status !== 'cancelled' && filterByDate(j.date));
    const filteredRentals = rentals.filter(r => filterByDate(r.date));
    const filteredOwnIncomes = ownIncomes.filter(o => filterByDate(o.harvestDate || o.date));
    const filteredDriverSals = driverSals.filter(s => filterByDate(s.date));
    const filteredExpenses = expenses.filter(e => filterByDate(e.date));

    // Income
    const hRev = filteredJobs.reduce((sum, j) => sum + (j.finalAmount || 0), 0);
    const rRev = filteredRentals.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const oRev = filteredOwnIncomes.reduce((sum, o) => sum + (o.totalIncome || o.amount || 0), 0);

    // Expenses
    const dExp = filteredDriverSals.reduce((sum, s) => sum + (s.netPay || 0), 0);
    const wExp = workEntries.filter(w => filterByDate(w.date)).reduce((sum, w) => sum + (w.netPayable || 0), 0);
    const gExp = filteredExpenses.filter(e => e.source !== 'home_expense').reduce((sum, e) => sum + (e.amount || 0), 0);
    
    // Job-level expenses (Critical Issue #05 ERROR B)
    const jExp = filteredJobs.reduce((sum, j) => {
        const otherSum = (j.otherExpenses || []).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
        return sum + (j.dieselFromLogs || 0) + (j.additionalDiesel || 0) + otherSum;
    }, 0);

    // Outstanding / Pending (Critical Issue #05 ERROR D)
    const pendingJobs = jobs.filter(j => {
        const paid = (j.payments || []).reduce((s, p) => s + p.amount, 0);
        return paid < j.finalAmount;
    });
    const farmerBalance = jobs.reduce((sum, j) => {
        const paid = (j.payments || []).reduce((s, p) => s + p.amount, 0);
        return sum + (j.finalAmount - paid);
    }, 0) + rentals.reduce((sum, r) => {
        const paid = (r.payments || []).reduce((s, p) => s + p.amount, 0);
        return sum + (r.totalAmount - paid);
    }, 0);

    const tIncome = hRev + rRev + oRev;
    const tExpense = dExp + wExp + gExp + jExp;

    setStats({
      harvesterRev: hRev,
      rentalRev: rRev,
      ownFarmRev: oRev,
      driverSalaries: dExp,
      workerWages: wExp,
      generalExpenses: gExp,
      jobExpenses: jExp,
      totalIncome: tIncome,
      totalExpense: tExpense,
      netProfit: tIncome - tExpense,
      pendingBillsCount: pendingJobs.length,
      outstandingFarmerBalance: farmerBalance,
      unpaidDriverSalary: 0 // Will implement in Phase 3
    });
  }, [month, year]);

  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  return (
    <div className="app-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>நிர்வாக மேலாண்மை (Executive Dashboard)</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
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
