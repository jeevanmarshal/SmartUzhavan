import React, { useState, useEffect, useMemo } from 'react';
import { getData } from '../services/storage';
import { formatCurrency } from '../utils/formatters';

const DriverDashboard = ({ userId }) => {
  const [logs, setLogs] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [driver, setDriver] = useState(null);

  useEffect(() => {
    const allDrivers = getData('rl_drivers');
    setDriver(allDrivers.find(d => d.id === userId));

    const allLogs = getData('rl_driver_logs');
    setLogs(allLogs.filter(l => l.driverId === userId));

    const allSalaries = getData('rl_driver_salary');
    setSalaries(allSalaries.filter(s => s.driverId === userId));
  }, [userId]);

  const stats = useMemo(() => {
    const totalHours = logs.reduce((sum, l) => sum + (l.totalHours || 0), 0);
    const uniqueDays = new Set(logs.map(l => l.date)).size;

    const earned = salaries.reduce((sum, s) => sum + (s.netPay || 0), 0);
    const bonus = salaries.reduce((sum, s) => sum + (parseFloat(s.bonus) || 0), 0);
    const extra = salaries.reduce((sum, s) => sum + (parseFloat(s.extraAmount) || 0), 0);
    const advance = salaries.reduce((sum, s) => sum + (parseFloat(s.advance) || 0), 0);
    
    const received = salaries.reduce((sum, s) => {
        const paid = (s.payments || []).reduce((pSum, p) => pSum + p.amount, 0);
        return sum + paid;
    }, 0);

    return {
      totalHours,
      daysWorked: uniqueDays,
      totalEarned: earned,
      totalReceived: received,
      totalAdvance: advance,
      totalBonus: bonus,
      totalExtra: extra,
      due: earned - received
    };
  }, [logs, salaries]);

  return (
    <div className="app-container">
      <div className="card" style={{ background: 'linear-gradient(135deg, #1B3A6B 0%, #2D3748 100%)', color: 'white', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>வணக்கம், {driver?.name}</h2>
        <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>ஓட்டுநர் மேலாண்மை பலகை (Driver Dashboard)</p>
        
        <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Total Hours Worked</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalHours.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Total Days Worked</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.daysWorked}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
        <div className="card" style={{ borderLeft: '4px solid #38A169' }}>
          <h4 style={{ color: '#718096', margin: '0 0 5px 0', fontSize: '0.8rem' }}>Total Earned</h4>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1A6B55' }}>{formatCurrency(stats.totalEarned)}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #3182CE' }}>
          <h4 style={{ color: '#718096', margin: '0 0 5px 0', fontSize: '0.8rem' }}>Total Received</h4>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2B6CB0' }}>{formatCurrency(stats.totalReceived)}</div>
        </div>
      </div>

      {stats.due > 0 && (
        <div className="card" style={{ background: '#FFF5F5', border: '1px solid #FEB2B2', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#C53030', fontWeight: 'bold' }}>Pending Salary (மீதமுள்ள சம்பளம்)</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#C53030' }}>{formatCurrency(stats.due)}</span>
            </div>
        </div>
      )}

      <div className="card">
        <h3 style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '10px', marginBottom: '15px' }}>Breakdown (விவரம்)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#4A5568' }}>Advance Taken (முன்பணம்)</span>
            <span style={{ fontWeight: 'bold' }}>{formatCurrency(stats.totalAdvance)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#4A5568' }}>Bonus Received (போனஸ்)</span>
            <span style={{ fontWeight: 'bold', color: '#38A169' }}>{formatCurrency(stats.totalBonus)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#4A5568' }}>Extra Amounts (கூடுதல்)</span>
            <span style={{ fontWeight: 'bold', color: '#38A169' }}>{formatCurrency(stats.totalExtra)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
