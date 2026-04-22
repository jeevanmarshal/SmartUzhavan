import React, { useState, useEffect } from 'react';
import { getData } from '../services/storage';
import { formatCurrency } from '../utils/formatters';
import { sumPayments } from '../services/calculations';

const Dashboard = () => {
  const [stats, setStats] = useState({
    harvesterRev: 0,
    rentalRev: 0,
    ownFarmRev: 0,
    driverSalaries: 0,
    workerWages: 0,
    generalExpenses: 0,
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0
  });

  useEffect(() => {
    const jobs = getData('rl_harvester_jobs');
    const rentals = getData('rl_rentals');
    const ownIncomes = getData('rl_own_farm_income');
    const driverSals = getData('rl_driver_salary');
    const workerSals = getData('rl_worker_salary');
    const expenses = getData('rl_expenses');

    const hRev = jobs.reduce((sum, j) => sum + (j.finalAmount || 0), 0);
    const rRev = rentals.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const oRev = ownIncomes.reduce((sum, o) => sum + (o.amount || 0), 0);

    const dExp = driverSals.reduce((sum, s) => sum + (s.netPay || 0), 0);
    const wExp = workerSals.reduce((sum, s) => sum + (s.amount || 0), 0);
    const gExp = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    
    // Note: Harvester diesel is already accounted for in Job Profit calculation, 
    // but here we are looking at total income vs total external outflow.
    // To match SRS "Net Profit", we subtract all outflows.

    const tIncome = hRev + rRev + oRev;
    const tExpense = dExp + wExp + gExp;

    setStats({
      harvesterRev: hRev,
      rentalRev: rRev,
      ownFarmRev: oRev,
      driverSalaries: dExp,
      workerWages: wExp,
      generalExpenses: gExp,
      totalIncome: tIncome,
      totalExpense: tExpense,
      netProfit: tIncome - tExpense
    });
  }, []);

  return (
    <div className="app-container">
      <h1>நிர்வாக மேலாண்மை (Executive Dashboard)</h1>

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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
        <div className="card" style={{ borderLeft: '4px solid #38A169' }}>
          <h4>Harvester</h4>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1A6B55' }}>{formatCurrency(stats.harvesterRev)}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #3182CE' }}>
          <h4>Rental</h4>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2B6CB0' }}>{formatCurrency(stats.rentalRev)}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #E53E3E' }}>
          <h4>Drivers</h4>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#C53030' }}>{formatCurrency(stats.driverSalaries)}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #D69E2E' }}>
          <h4>General Exp</h4>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#B7791F' }}>{formatCurrency(stats.generalExpenses)}</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <h3>Income Distribution</h3>
        <div style={{ height: '30px', width: '100%', background: '#edf2f7', borderRadius: '15px', overflow: 'hidden', display: 'flex', margin: '15px 0' }}>
          <div style={{ width: `${(stats.harvesterRev / (stats.totalIncome || 1)) * 100}%`, background: '#38A169' }} title="Harvester"></div>
          <div style={{ width: `${(stats.rentalRev / (stats.totalIncome || 1)) * 100}%`, background: '#3182CE' }} title="Rental"></div>
          <div style={{ width: `${(stats.ownFarmRev / (stats.totalIncome || 1)) * 100}%`, background: '#805AD5' }} title="Own Farm"></div>
        </div>
        <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem', justifyContent: 'center' }}>
          <span style={{ color: '#38A169' }}>● Harvester</span>
          <span style={{ color: '#3182CE' }}>● Rental</span>
          <span style={{ color: '#805AD5' }}>● Own Farm</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
