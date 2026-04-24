import React, { useState, useEffect, useMemo } from 'react';
import { getData } from '../services/storage';
import { formatCurrency } from '../utils/formatters';
import { seasons } from '../data/seasons';
import Button from '../components/common/Button';

const Reports = () => {
  const [reportType, setReportType] = useState('monthly');
  const [fy, setFy] = useState(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);

  const reportData = useMemo(() => {
    const jobs = getData('rl_harvester_jobs').filter(j => j.status !== 'cancelled');
    const rentals = getData('rl_rentals');
    const expenses = getData('rl_expenses');
    const salaries = getData('rl_driver_salary');
    const workers = getData('rl_work_entries');
    const farmers = getData('rl_farmers');

    const [startYear, endYear] = fy.split('-').map(Number);
    const fyStart = new Date(`${startYear}-04-01`);
    const fyEnd = new Date(`${endYear}-03-31`);

    const filterFY = (dateStr) => {
      const d = new Date(dateStr);
      return d >= fyStart && d <= fyEnd;
    };

    if (reportType === 'monthly') {
      const summary = {};
      [...jobs, ...rentals].filter(i => filterFY(i.date || i.createdAt)).forEach(item => {
        const date = new Date(item.date || item.createdAt);
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        if (!summary[key]) summary[key] = { income: 0, expense: 0 };
        summary[key].income += (item.finalAmount || item.totalAmount || 0);
      });
      [...expenses, ...salaries, ...workers].filter(i => filterFY(i.date)).forEach(item => {
        const date = new Date(item.date);
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        if (!summary[key]) summary[key] = { income: 0, expense: 0 };
        summary[key].expense += (item.amount || item.netPay || item.netPayable || 0);
      });
      return Object.entries(summary).map(([month, vals]) => ({ label: month, ...vals }));
    } else if (reportType === 'machine') {
      const machineData = { tyre: { income: 0, jobs: 0 }, track: { income: 0, jobs: 0 } };
      jobs.filter(j => filterFY(j.date)).forEach(j => {
        if (machineData[j.machineType]) {
          machineData[j.machineType].income += j.finalAmount;
          machineData[j.machineType].jobs += 1;
        }
      });
      return Object.entries(machineData).map(([type, vals]) => ({ label: type.toUpperCase(), ...vals }));
    } else if (reportType === 'farmer') {
      return farmers.map(f => {
        const fJobs = jobs.filter(j => j.farmerId === f.id && filterFY(j.date));
        const fRentals = rentals.filter(r => r.farmerId === f.id && filterFY(r.date));
        const total = fJobs.reduce((s, j) => s + j.finalAmount, 0) + fRentals.reduce((s, r) => s + r.totalAmount, 0);
        const paid = [...fJobs, ...fRentals].reduce((s, item) => s + (item.payments || []).reduce((pSum, p) => pSum + p.amount, 0), 0);
        return { label: f.name, village: f.village, total, paid, balance: total - paid };
      }).filter(f => f.balance > 0);
    } else if (reportType === 'driver') {
        const driverList = getData('rl_drivers');
        return driverList.map(d => {
            const dSals = salaries.filter(s => s.driverId === d.id && filterFY(s.date));
            const totalEarned = dSals.reduce((s, sal) => s + sal.netPay, 0);
            const totalPaid = dSals.reduce((s, sal) => s + (sal.payments || []).reduce((pSum, p) => pSum + p.amount, 0), 0);
            return { label: d.name, earned: totalEarned, paid: totalPaid, balance: totalEarned - totalPaid };
        });
    } else if (reportType === 'season') {
        return seasons.map(s => {
            const sJobs = jobs.filter(j => j.season === s.value && filterFY(j.date));
            return { label: s.label, count: sJobs.length, income: sJobs.reduce((sum, j) => sum + j.finalAmount, 0) };
        });
    }
    return [];
  }, [reportType, fy]);

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_PDF_API_URL || 'http://localhost:5000'}/api/pdf/outstanding-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fy, data: reportData })
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Outstanding_Report_${fy}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('PDF Error:', err);
    }
  };

  return (
    <div className="app-container">
      <h1>அறிக்கைகள் (Reports)</h1>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
            <Button onClick={() => setReportType('monthly')} variant={reportType === 'monthly' ? 'primary' : 'secondary'}>Monthly</Button>
            <Button onClick={() => setReportType('machine')} variant={reportType === 'machine' ? 'primary' : 'secondary'}>Machine</Button>
            <Button onClick={() => setReportType('farmer')} variant={reportType === 'farmer' ? 'primary' : 'secondary'}>Farmer Dues</Button>
            <Button onClick={() => setReportType('driver')} variant={reportType === 'driver' ? 'primary' : 'secondary'}>Driver Payroll</Button>
            <Button onClick={() => setReportType('season')} variant={reportType === 'season' ? 'primary' : 'secondary'}>Seasonal</Button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Financial Year:</label>
            <select 
                value={fy} onChange={(e) => setFy(e.target.value)}
                style={{ padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E0' }}
            >
              <option value="2024-2025">2024 - 2025</option>
              <option value="2025-2026">2025 - 2026</option>
              <option value="2026-2027">2026 - 2027</option>
            </select>
          </div>
        </div>
        {reportType === 'farmer' && (
          <Button onClick={handleDownloadPDF} variant="outline" fullWidth>Download Outstanding Balance PDF</Button>
        )}
      </div>

      <div className="list-container">
        {reportData.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '20px', color: '#718096' }}>No data found for this period.</p>
        ) : (
          <>
            {reportType === 'monthly' && (
              <table>
                <thead>
                  <tr><th>Month</th><th>Income</th><th>Expense</th><th>Profit</th></tr>
                </thead>
                <tbody>
                  {reportData.map(row => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td style={{ color: '#38A169' }}>{formatCurrency(row.income)}</td>
                      <td style={{ color: '#E53E3E' }}>{formatCurrency(row.expense)}</td>
                      <td style={{ fontWeight: 'bold' }}>{formatCurrency(row.income - row.expense)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'machine' && (
              <table>
                <thead>
                  <tr><th>Type</th><th>Total Jobs</th><th>Total Revenue</th></tr>
                </thead>
                <tbody>
                  {reportData.map(row => (
                    <tr key={row.label}><td>{row.label}</td><td>{row.jobs}</td><td>{formatCurrency(row.income)}</td></tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'farmer' && (
              <table>
                <thead>
                  <tr><th>Farmer</th><th>Village</th><th>Total Bill</th><th>Paid</th><th>Outstanding</th></tr>
                </thead>
                <tbody>
                  {reportData.map(row => (
                    <tr key={row.label}><td>{row.label}</td><td>{row.village}</td><td>{formatCurrency(row.total)}</td><td>{formatCurrency(row.paid)}</td><td style={{ color: '#E53E3E', fontWeight: 'bold' }}>{formatCurrency(row.balance)}</td></tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'driver' && (
              <table>
                <thead>
                  <tr><th>Driver</th><th>Earned</th><th>Paid</th><th>Balance</th></tr>
                </thead>
                <tbody>
                  {reportData.map(row => (
                    <tr key={row.label}><td>{row.label}</td><td>{formatCurrency(row.earned)}</td><td>{formatCurrency(row.paid)}</td><td style={{ color: '#E53E3E' }}>{formatCurrency(row.balance)}</td></tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'season' && (
              <table>
                <thead>
                  <tr><th>Season</th><th>Job Count</th><th>Total Revenue</th></tr>
                </thead>
                <tbody>
                  {reportData.map(row => (
                    <tr key={row.label}><td>{row.label}</td><td>{row.count}</td><td>{formatCurrency(row.income)}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
      
      <style>{`
        table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #E2E8F0; font-size: 0.9rem; }
        th { background: #F7FAFC; color: #4A5568; font-weight: bold; }
      `}</style>
    </div>
  );
};

export default Reports;
