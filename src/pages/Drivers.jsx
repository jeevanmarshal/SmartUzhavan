import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getData, saveData, updateRecord, deleteRecord, addRecord } from '../services/storage';
import { generateId } from '../utils/idGenerator';
import { formatCurrency } from '../utils/formatters';
import InputField from '../components/common/InputField';
import SelectField from '../components/common/SelectField';
import Button from '../components/common/Button';
import PaymentHistory from '../components/common/PaymentHistory';

const Drivers = ({ user }) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') || (user?.role === 'driver' ? 'salary' : 'master');

  const [activeTab, setActiveTab] = useState(initialTab);
  const [drivers, setDrivers] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [editingSalary, setEditingSalary] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: ''
  });

  const [driverFormData, setDriverFormData] = useState({
    name: '', phone: '', pin: '', salaryRatePerHour: 150, active: true
  });

  const [salaryFormData, setSalaryFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    driverId: user?.role === 'driver' ? user.id : '',
    baseSalary: 0,
    bonus: 0,
    extraAmount: 0,
    advance: 0,
    notes: ''
  });

  useEffect(() => {
    setDrivers(getData('rl_drivers'));
    setSalaries(getData('rl_driver_salary'));
  }, []);

  const isAdmin = user?.role === 'admin';
  const isDriver = user?.role === 'driver';

  const handleSaveDriver = (e) => {
    e.preventDefault();
    if (editingDriver) {
      updateRecord('rl_drivers', editingDriver.id, driverFormData);
      setEditingDriver(null);
    } else {
      const newDriver = { ...driverFormData, id: generateId('rl_drivers') };
      addRecord('rl_drivers', newDriver);
    }
    setDrivers(getData('rl_drivers'));
    setShowDriverForm(false);
    setDriverFormData({ name: '', phone: '', pin: '', salaryRatePerHour: 150, active: true });
    setSuccess('ஓட்டுநர் விவரங்கள் சேமிக்கப்பட்டன (Driver Saved)');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleEditDriver = (driver) => {
    setDriverFormData({ ...driver });
    setEditingDriver(driver);
    setShowDriverForm(true);
  };

  const netPay = (parseFloat(salaryFormData.baseSalary) || 0) + 
                 (parseFloat(salaryFormData.bonus) || 0) + 
                 (parseFloat(salaryFormData.extraAmount) || 0) - 
                 (parseFloat(salaryFormData.advance) || 0);

  const handleSaveSalary = (e) => {
    e.preventDefault();
    const b = parseFloat(salaryFormData.baseSalary) || 0;
    const bo = parseFloat(salaryFormData.bonus) || 0;
    const ex = parseFloat(salaryFormData.extraAmount) || 0;
    const ad = parseFloat(salaryFormData.advance) || 0;

    if (b === 0 && bo === 0 && ex === 0 && ad === 0) {
      setError('குறைந்தது ஒரு தொகை தேவை (At least one amount is required)');
      return;
    }

    const entry = {
      ...salaryFormData,
      baseSalary: b, bonus: bo, extraAmount: ex, advance: ad,
      netPay,
      payments: editingSalary ? editingSalary.payments : []
    };

    if (editingSalary) {
      updateRecord('rl_driver_salary', editingSalary.id, entry);
      setEditingSalary(null);
    } else {
      entry.id = generateId('rl_driver_salary');
      addRecord('rl_driver_salary', entry);
    }

    setSalaries(getData('rl_driver_salary'));
    setShowSalaryForm(false);
    setSalaryFormData({
      date: new Date().toISOString().split('T')[0],
      driverId: isDriver ? user.id : '',
      baseSalary: 0, bonus: 0, extraAmount: 0, advance: 0, notes: ''
    });
    setSuccess('சம்பளப் பதிவு சேமிக்கப்பட்டது (Salary Saved)');
    setTimeout(() => {setSuccess(''); setError('');}, 3000);
  };

  const handleEditSalary = (sal) => {
    setSalaryFormData({ ...sal });
    setEditingSalary(sal);
    setShowSalaryForm(true);
  };

  const handleDeleteSalary = (id) => {
    if (window.confirm('இந்த பதிவை நீக்க வேண்டுமா? (Delete this record?)')) {
      deleteRecord('rl_driver_salary', id);
      setSalaries(getData('rl_driver_salary'));
    }
  };

  const filteredSalaries = salaries.filter(s => {
    const isOwn = isDriver ? s.driverId === user.id : true;
    const matchFrom = !filters.fromDate || s.date >= filters.fromDate;
    const matchTo = !filters.toDate || s.date <= filters.toDate;
    return isOwn && matchFrom && matchTo;
  });

  const handleDownloadPDF = async () => {
    const driver = drivers.find(d => d.id === (isDriver ? user.id : salaryFormData.driverId)) || { name: 'Driver' };
    const payload = {
      driver,
      salaryRecords: filteredSalaries,
      fromDate: filters.fromDate,
      toDate: filters.toDate
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_PDF_API_URL || 'http://localhost:5000'}/api/pdf/driver-salary-statement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Salary_Statement_${driver.name}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('PDF Error:', err);
      setError('PDF உருவாக்கத்தில் பிழை (PDF Generation Error)');
    }
  };

  return (
    <div className="app-container">
      <h1>ஓட்டுநர்கள் மற்றும் சம்பளம் (Drivers & Salary)</h1>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {isAdmin && (
          <button 
            onClick={() => setActiveTab('master')}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'master' ? '#1B3A6B' : '#E2E8F0', color: activeTab === 'master' ? 'white' : '#4A5568', fontWeight: 'bold' }}
          >
            Drivers (ஓட்டுநர்கள்)
          </button>
        )}
        <button 
          onClick={() => setActiveTab('salary')}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'salary' ? '#1B3A6B' : '#E2E8F0', color: activeTab === 'salary' ? 'white' : '#4A5568', fontWeight: 'bold' }}
        >
          Salary (சம்பளம்)
        </button>
      </div>

      {success && <div className="success-message" style={{ color: '#38A169', background: '#F0FFF4', padding: '10px', borderRadius: '8px', marginBottom: '15px', textAlign: 'center', fontWeight: 'bold' }}>{success}</div>}
      {error && <div className="error-message" style={{ color: '#E53E3E', background: '#FFF5F5', padding: '10px', borderRadius: '8px', marginBottom: '15px', textAlign: 'center', fontWeight: 'bold' }}>{error}</div>}

      {activeTab === 'master' && isAdmin && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>Driver List</h3>
            <Button onClick={() => setShowDriverForm(true)}>+ Add Driver</Button>
          </div>

          {showDriverForm && (
            <form onSubmit={handleSaveDriver} className="card">
              <InputField english="Name" tamil="பெயர்" value={driverFormData.name} onChange={e => setDriverFormData({...driverFormData, name: e.target.value})} required />
              <InputField english="Phone" tamil="தொலைபேசி" value={driverFormData.phone} onChange={e => setDriverFormData({...driverFormData, phone: e.target.value})} required />
              <InputField english="PIN" tamil="கடவுச்சொல்" type="password" value={driverFormData.pin} onChange={e => setDriverFormData({...driverFormData, pin: e.target.value})} placeholder="4 digits" />
              <InputField english="Rate (₹/hr)" tamil="சம்பள வீதம்" type="number" value={driverFormData.salaryRatePerHour} onChange={e => setDriverFormData({...driverFormData, salaryRatePerHour: e.target.value})} required />
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <Button type="submit" fullWidth>Save</Button>
                <Button onClick={() => {setShowDriverForm(false); setEditingDriver(null);}} variant="danger" fullWidth>Cancel</Button>
              </div>
            </form>
          )}

          <div className="list-container">
            {drivers.map(d => (
              <div key={d.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{d.name} <span style={{ color: '#718096', fontSize: '0.8rem' }}>[{d.id}]</span></div>
                  <div style={{ fontSize: '0.85rem', color: '#4A5568' }}>{d.phone} | Rate: ₹{d.salaryRatePerHour}/hr</div>
                </div>
                <Button variant="outline" onClick={() => handleEditDriver(d)}>Edit</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'salary' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>Salary Records</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              {filteredSalaries.length > 0 && <Button onClick={handleDownloadPDF} variant="outline">PDF பதிவிறக்கம் (Download PDF)</Button>}
              {isAdmin && <Button onClick={() => setShowSalaryForm(true)}>+ New Salary Entry</Button>}
            </div>
          </div>

          <div className="card" style={{ marginBottom: '20px', background: '#F7FAFC' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>Filters (வடிகட்டி)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <InputField type="date" english="From" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} />
              <InputField type="date" english="To" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} />
            </div>
            {(filters.fromDate || filters.toDate) && (
              <Button variant="outline" fullWidth style={{ marginTop: '10px' }} onClick={() => setFilters({fromDate: '', toDate: ''})}>Clear Filters</Button>
            )}
          </div>

          {showSalaryForm && isAdmin && (
            <form onSubmit={handleSaveSalary} className="card">
              <InputField english="Date" tamil="தேதி" type="date" value={salaryFormData.date} onChange={e => setSalaryFormData({...salaryFormData, date: e.target.value})} required />
              <SelectField 
                english="Driver" tamil="ஓட்டுநர்"
                options={drivers.map(d => ({ value: d.id, label: d.name }))}
                value={salaryFormData.driverId}
                onChange={e => setSalaryFormData({...salaryFormData, driverId: e.target.value})}
                required
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <InputField english="Base Salary" tamil="அடிப்படை சம்பளம்" type="number" value={salaryFormData.baseSalary} onChange={e => setSalaryFormData({...salaryFormData, baseSalary: e.target.value})} />
                <InputField english="Bonus" tamil="போனஸ்" type="number" value={salaryFormData.bonus} onChange={e => setSalaryFormData({...salaryFormData, bonus: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <InputField english="Extra Pay" tamil="கூடுதல் தொகை" type="number" value={salaryFormData.extraAmount} onChange={e => setSalaryFormData({...salaryFormData, extraAmount: e.target.value})} />
                <InputField english="Advance" tamil="முன்பணம்" type="number" value={salaryFormData.advance} onChange={e => setSalaryFormData({...salaryFormData, advance: e.target.value})} />
              </div>
              <div style={{ padding: '15px', background: netPay >= 0 ? '#F0FFF4' : '#FFF5F5', borderRadius: '8px', marginBottom: '15px', textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: netPay >= 0 ? '#1A6B55' : '#C53030' }}>
                  Net Pay: {formatCurrency(netPay)}
                </div>
                {netPay < 0 && <div style={{ fontSize: '0.8rem', color: '#C53030', marginTop: '5px' }}>முன்பணம் சம்பளத்தை விட அதிகமாக உள்ளது</div>}
              </div>
              <InputField english="Notes" tamil="குறிப்பு" value={salaryFormData.notes} onChange={e => setSalaryFormData({...salaryFormData, notes: e.target.value})} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button type="submit" fullWidth>Save Salary</Button>
                <Button onClick={() => {setShowSalaryForm(false); setEditingSalary(null);}} variant="danger" fullWidth>Cancel</Button>
              </div>
            </form>
          )}

          <div className="list-container">
            {filteredSalaries.map(sal => {
              const driverName = drivers.find(d => d.id === sal.driverId)?.name || 'Unknown';
              const totalPaid = (sal.payments || []).reduce((sum, p) => sum + p.amount, 0);
              const balance = sal.netPay - totalPaid;

              return (
                <div key={sal.id} className="card" style={{ borderLeft: '4px solid #1B3A6B' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{driverName} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#718096' }}>({sal.date})</span></div>
                      <div style={{ fontSize: '0.85rem', color: '#4A5568', marginTop: '4px' }}>
                        Net: {formatCurrency(sal.netPay)} | Paid: {formatCurrency(totalPaid)}
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: balance > 0 ? '#C53030' : '#38A169', marginTop: '4px' }}>
                        Balance: {formatCurrency(balance)}
                      </div>
                    </div>
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <Button variant="outline" onClick={() => handleEditSalary(sal)}>Edit</Button>
                        <Button variant="danger" onClick={() => handleDeleteSalary(sal.id)}>Delete</Button>
                      </div>
                    )}
                  </div>
                  {isAdmin && (
                    <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #E2E8F0' }}>
                      <PaymentHistory 
                        record={sal}
                        collection="rl_driver_salary"
                        onUpdate={() => setSalaries(getData('rl_driver_salary'))}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Drivers;
