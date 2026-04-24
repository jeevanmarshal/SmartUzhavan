import React, { useState, useEffect, useMemo } from 'react';
import { getData } from '../services/storage';
import { formatCurrency } from '../utils/formatters';
import SelectField from '../components/common/SelectField';
import InputField from '../components/common/InputField';

const DriverDashboard = ({ userId }) => {
  const [filterMode, setFilterMode] = useState('month'); // 'month' or 'season'
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedSeason, setSelectedSeason] = useState('SAM');

  useEffect(() => {
    const allDrivers = getData('rl_drivers');
    setDriver(allDrivers.find(d => d.id === userId));

    setLogs(getData('rl_driver_logs').filter(l => l.driverId === userId));
    setSalaries(getData('rl_driver_salary').filter(s => s.driverId === userId));
  }, [userId]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const logDate = new Date(log.date);
      if (filterMode === 'month') {
        return (logDate.getMonth() + 1) === parseInt(selectedMonth) && 
               logDate.getFullYear() === parseInt(selectedYear);
      } else {
        const year = parseInt(selectedYear);
        let start, end;
        if (selectedSeason === 'KUR') {
          start = new Date(`${year}-06-01`);
          end = new Date(`${year}-09-30`);
        } else if (selectedSeason === 'SAM') {
          start = new Date(`${year}-08-01`);
          end = new Date(`${year + 1}-01-31`);
        } else if (selectedSeason === 'THA') {
          start = new Date(`${year}-10-01`);
          end = new Date(`${year + 1}-01-31`);
        }
        return logDate >= start && logDate <= end;
      }
    });
  }, [logs, filterMode, selectedMonth, selectedYear, selectedSeason]);

  const filteredSalaries = useMemo(() => {
    return salaries.filter(sal => {
      const salDate = new Date(sal.date);
      if (filterMode === 'month') {
        return (salDate.getMonth() + 1) === parseInt(selectedMonth) && 
               salDate.getFullYear() === parseInt(selectedYear);
      } else {
        const year = parseInt(selectedYear);
        let start, end;
        if (selectedSeason === 'KUR') {
          start = new Date(`${year}-06-01`);
          end = new Date(`${year}-09-30`);
        } else if (selectedSeason === 'SAM') {
          start = new Date(`${year}-08-01`);
          end = new Date(`${year + 1}-01-31`);
        } else if (selectedSeason === 'THA') {
          start = new Date(`${year}-10-01`);
          end = new Date(`${year + 1}-01-31`);
        }
        return salDate >= start && salDate <= end;
      }
    });
  }, [salaries, filterMode, selectedMonth, selectedYear, selectedSeason]);

  const stats = useMemo(() => {
    const totalHours = filteredLogs.reduce((sum, l) => sum + (l.totalHours || 0), 0);
    const uniqueDays = new Set(filteredLogs.map(l => l.date)).size;

    const earned = filteredSalaries.reduce((sum, s) => sum + (s.netPay || 0), 0);
    const bonus = filteredSalaries.reduce((sum, s) => sum + (parseFloat(s.bonus) || 0), 0);
    const extra = filteredSalaries.reduce((sum, s) => sum + (parseFloat(s.extraAmount) || 0), 0);
    const advance = filteredSalaries.reduce((sum, s) => sum + (parseFloat(s.advance) || 0), 0);
    
    const received = filteredSalaries.reduce((sum, s) => {
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
  }, [filteredLogs, filteredSalaries]);

  return (
    <div className="app-container">
      <div className="card" style={{ background: 'linear-gradient(135deg, #1B3A6B 0%, #2D3748 100%)', color: 'white', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>வணக்கம், {driver?.name}</h2>
        <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>ஓட்டுநர் மேலாண்மை பலகை (Driver Dashboard)</p>
        
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px' }}>
          <button 
            onClick={() => setFilterMode('month')}
            style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '4px', background: filterMode === 'month' ? 'white' : 'transparent', color: filterMode === 'month' ? '#1B3A6B' : 'white', fontWeight: 'bold', cursor: 'pointer' }}
          >
            By Month (மாதம்)
          </button>
          <button 
            onClick={() => setFilterMode('season')}
            style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '4px', background: filterMode === 'season' ? 'white' : 'transparent', color: filterMode === 'season' ? '#1B3A6B' : 'white', fontWeight: 'bold', cursor: 'pointer' }}
          >
            By Season (பருவம்)
          </button>
        </div>

        <div style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {filterMode === 'month' ? (
            <SelectField 
              options={[
                { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
                { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
                { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
                { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
              ]}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              light
            />
          ) : (
            <SelectField 
              options={[
                { value: 'KUR', label: 'Kuruvai (குறுவை)' },
                { value: 'SAM', label: 'Samba (சம்பா)' },
                { value: 'THA', label: 'Thaladi (தலடி)' }
              ]}
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              light
            />
          )}
          <InputField 
            type="number" value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            light
          />
        </div>

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
