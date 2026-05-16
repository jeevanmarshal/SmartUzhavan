import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/api';
import useAPI from '../hooks/useAPI';
import { formatCurrency } from '../utils/formatters';
import SelectField from '../components/common/SelectField';
import InputField from '../components/common/InputField';

const DriverDashboard = ({ userId }) => {
  const { execute: fetchDriver } = useAPI(() => apiService.getDriver(userId));
  const { execute: fetchSalaries } = useAPI(() => apiService.getDriverSalaries(userId));

  const [logsAndSalaries, setLogsAndSalaries] = useState([]);
  const [driver, setDriver] = useState(null);
  const [filterMode, setFilterMode] = useState('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedSeason, setSelectedSeason] = useState('KUR');
  const [seasonYear, setSeasonYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [driverData, logsData] = await Promise.all([
          fetchDriver(),
          fetchSalaries()
        ]);
        setDriver(driverData?.data || driverData);
        setLogsAndSalaries(logsData?.data || logsData || []);
      } catch (err) {
        console.error('Failed to load driver dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    if (userId) {
      loadData();
    }
  }, [userId]);

  const stats = useMemo(() => {
    const filterData = (data) => data.filter(item => {
      const d = new Date(item.date);
      if (filterMode === 'month') {
        return (d.getMonth() + 1) === Number(selectedMonth) && d.getFullYear() === Number(selectedYear);
      } else {
        const year = Number(seasonYear);
        if (selectedSeason === 'KUR') {
          const start = new Date(year, 5, 1);
          const end = new Date(year, 8, 30);
          return d >= start && d <= end;
        } else if (selectedSeason === 'SAM') {
          const start = new Date(year, 7, 1);
          const end = new Date(year + 1, 0, 31);
          return d >= start && d <= end;
        } else if (selectedSeason === 'THA') {
          const start = new Date(year, 9, 1);
          const end = new Date(year + 1, 0, 31);
          return d >= start && d <= end;
        }
        return true;
      }
    });

    const filteredData = filterData(logsAndSalaries);

    const totalHours = filteredData.reduce((sum, l) => sum + (l.totalDuration || l.totalHours || 0), 0);
    const uniqueDays = new Set(filteredData.map(l => new Date(l.date).toDateString())).size;

    const earned = filteredData.reduce((sum, s) => {
      // Fallback to baseSalary if netPay is undefined
      const net = s.netPay !== undefined ? s.netPay : ((s.baseSalary || 0) + (s.bonus || 0) + (s.extraAmount || 0) - (s.advance || 0));
      return sum + net;
    }, 0);
    const bonus = filteredData.reduce((sum, s) => sum + (parseFloat(s.bonus) || 0), 0);
    const extra = filteredData.reduce((sum, s) => sum + (parseFloat(s.extraAmount) || 0), 0);
    const advance = filteredData.reduce((sum, s) => sum + (parseFloat(s.advance) || 0), 0);

    const received = filteredData.reduce((sum, s) => {
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
  }, [logsAndSalaries, filterMode, selectedMonth, selectedYear, selectedSeason, seasonYear]);

  if (loading) {
    return <div className="app-container"><div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div></div>;
  }

  return (
    <div className="app-container">
      <div className="card" style={{ background: 'linear-gradient(135deg, #1B3A6B 0%, #2D3748 100%)', color: 'white', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: 'white', textAlign: 'center' }}>வணக்கம், {driver?.name || 'Driver'}</h2>
        <p style={{ opacity: 0.8, fontSize: '0.9rem', color: 'white', textAlign: 'center', marginTop: '5px' }}>
          ஓட்டுநர் மேலாண்மை பலகை <br /> (Driver Dashboard)
        </p>

        <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Total Hours Worked</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalHours.toFixed(2)}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Total Days Worked</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.daysWorked}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <SelectField
          english="Filter By" tamil="வடிகட்டி"
          options={[
            { value: 'month', label: 'By Month (மாதம் வாரியாக)' },
            { value: 'season', label: 'By Season (பருவம் வாரியாக)' }
          ]}
          value={filterMode}
          onChange={(e) => setFilterMode(e.target.value)}
        />
        {filterMode === 'month' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <SelectField
              english="Month" tamil="மாதம்"
              options={[
                { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
                { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
                { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
                { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
              ]}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
            <InputField
              english="Year" tamil="ஆண்டு" type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <SelectField
              english="Season" tamil="பருவம்"
              options={[
                { value: 'KUR', label: 'KUR (குறுவை)' },
                { value: 'SAM', label: 'SAM (சம்பா)' },
                { value: 'THA', label: 'THA (தாளடி)' }
              ]}
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
            />
            <InputField
              english="Year" tamil="ஆண்டு" type="number"
              value={seasonYear}
              onChange={(e) => setSeasonYear(e.target.value)}
            />
          </div>
        )}
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
