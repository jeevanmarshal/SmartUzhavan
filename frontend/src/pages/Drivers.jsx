import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api';
import useAPI from '../hooks/useAPI';
import useRealTime from '../hooks/useRealTime';
import { formatCurrency } from '../utils/formatters';
import InputField from '../components/common/InputField';
import SelectField from '../components/common/SelectField';
import Button from '../components/common/Button';
import PaymentHistory from '../components/common/PaymentHistory';

const Drivers = ({ userId }) => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('tab1');
  
  const { execute: fetchDrivers, loading: loadingDrivers } = useAPI(apiService.getDrivers.bind(apiService));
  const { execute: fetchSalaries, loading: loadingSalaries } = useAPI(apiService.getAllDriverSalaries.bind(apiService));
  
  const { data: drivers, syncData: setDrivers } = useRealTime('Driver', []);
  const { data: salaries, syncData: setSalaries } = useRealTime('DriverSalary', []);
  
  // Tab 1 state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [driverData, setDriverData] = useState({ name: '', phone: '', pin: '', baseRate: 150, active: true, village: '' });
  
  // Tab 2 state
  const [showAddSalary, setShowAddSalary] = useState(false);
  const [editingSalary, setEditingSalary] = useState(null);
  const [salaryData, setSalaryData] = useState({
    date: new Date().toISOString().split('T')[0],
    driver_id: '',
    baseSalary: 0,
    bonus: 0,
    extraAmount: 0,
    advance: 0,
    notes: ''
  });
  
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const d = await fetchDrivers();
        setDrivers(d || []);
        
        const params = userId ? { driverId: userId } : {};
        const s = await fetchSalaries(params);
        setSalaries(s || []);
      } catch (err) {
        setError('Failed to load initial data');
      }
    };
    init();
    
    if (userId || searchParams.get('tab') === 'salary') {
      setActiveTab('tab2');
    }
  }, [userId, searchParams]);

  const handleActionComplete = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleActionError = (err) => {
    setError(err.message || 'Operation failed');
    setTimeout(() => setError(''), 5000);
  };

  // Tab 1 logic
  const handleSaveDriver = async (e) => {
    e.preventDefault();
    try {
      if (editingDriver) {
        await apiService.updateDriver(editingDriver._id, driverData);
      } else {
        await apiService.createDriver(driverData);
      }
      
      // RealTime hook handles the state update if backend emits event, 
      // but to be safe we can re-fetch or optimistically update.
      const d = await fetchDrivers();
      setDrivers(d || []);
      
      setShowAddForm(false);
      setEditingDriver(null);
      setDriverData({ name: '', phone: '', pin: '', baseRate: 150, active: true, village: '' });
      handleActionComplete('Driver saved successfully');
    } catch (err) {
      handleActionError(err);
    }
  };

  const handleEditDriver = (driver) => {
    setDriverData({ 
      name: driver.name, 
      phone: driver.phone, 
      pin: '', // Do not pre-fill PIN for security
      baseRate: driver.baseRate, 
      active: driver.active,
      village: driver.village || ''
    });
    setEditingDriver(driver);
    setShowAddForm(true);
  };

  const handleDeleteDriver = async (id) => {
    if (window.confirm('Delete this driver? (ஓட்டுநரை நீக்க வேண்டுமா?)')) {
      try {
        await apiService.deleteDriver(id);
        setDrivers(drivers.filter(d => d._id !== id));
        handleActionComplete('Driver deleted successfully');
      } catch (err) {
        handleActionError(err);
      }
    }
  };

  // Tab 2 logic
  const netPay = (parseFloat(salaryData.baseSalary)||0) + (parseFloat(salaryData.bonus)||0) + (parseFloat(salaryData.extraAmount)||0) - (parseFloat(salaryData.advance)||0);

  const handleSaveSalary = async (e) => {
    e.preventDefault();
    if (!salaryData.baseSalary && !salaryData.bonus && !salaryData.extraAmount && !salaryData.advance) {
      setError('குறைந்தது ஒரு தொகை தேவை (At least one amount is required)');
      return;
    }
    
    const entry = {
      ...salaryData,
      baseSalary: parseFloat(salaryData.baseSalary) || 0,
      bonus: parseFloat(salaryData.bonus) || 0,
      extraAmount: parseFloat(salaryData.extraAmount) || 0,
      advance: parseFloat(salaryData.advance) || 0,
    };

    try {
      if (editingSalary) {
        await apiService.updateDriverSalary(editingSalary._id, entry);
      } else {
        await apiService.createDriverSalary(entry.driver_id, entry);
      }
      
      const params = userId ? { driverId: userId } : {};
      const s = await fetchSalaries(params);
      setSalaries(s || []);

      setShowAddSalary(false);
      setEditingSalary(null);
      handleActionComplete('Salary entry saved');
      setSalaryData({
        date: new Date().toISOString().split('T')[0],
        driver_id: userId || '',
        baseSalary: 0,
        bonus: 0,
        extraAmount: 0,
        advance: 0,
        notes: ''
      });
    } catch (err) {
      handleActionError(err);
    }
  };

  const handleDeleteSalary = async (id) => {
    if (window.confirm('Delete this salary entry? (இந்த பதிவை நீக்க வேண்டுமா?)')) {
      try {
        await apiService.deleteDriverSalary(id);
        setSalaries(salaries.filter(s => s._id !== id));
        handleActionComplete('Salary entry deleted');
      } catch (err) {
        handleActionError(err);
      }
    }
  };

  const handleAddPayment = async (salaryId, paymentData) => {
    try {
      await apiService.addDriverSalaryPayment(salaryId, paymentData);
      const params = userId ? { driverId: userId } : {};
      const s = await fetchSalaries(params);
      setSalaries(s || []);
      handleActionComplete('Payment added');
    } catch (err) {
      handleActionError(err);
    }
  };

  const handleEditSalary = (sal) => {
    setSalaryData({
      date: new Date(sal.date).toISOString().split('T')[0],
      driver_id: sal.driver_id,
      baseSalary: sal.baseSalary,
      bonus: sal.bonus,
      extraAmount: sal.extraAmount,
      advance: sal.advance,
      notes: sal.notes || ''
    });
    setEditingSalary(sal);
    setShowAddSalary(true);
  };

  let filteredSalaries = salaries;
  if (userId) filteredSalaries = filteredSalaries.filter(s => s.driver_id === userId);
  if (fromDate) filteredSalaries = filteredSalaries.filter(s => new Date(s.date) >= new Date(fromDate));
  if (toDate) filteredSalaries = filteredSalaries.filter(s => new Date(s.date) <= new Date(toDate));

  const handlePDF = async () => {
    try {
      // Stub for Phase 3/4 PDF functionality using new API structure
      alert('PDF Generation will be connected in Phase 3/4 integration.');
    } catch(err) {
      alert('Error generating PDF');
    }
  };

  return (
    <div className="app-container">
      {!userId && (
        <div className="tab-container">
          <button onClick={() => setActiveTab('tab1')} style={{ flex: 1, padding: '10px', background: activeTab === 'tab1' ? '#1B3A6B' : '#EDF2F7', color: activeTab === 'tab1' ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Drivers (ஓட்டுநர்கள்)</button>
          <button onClick={() => setActiveTab('tab2')} style={{ flex: 1, padding: '10px', background: activeTab === 'tab2' ? '#1B3A6B' : '#EDF2F7', color: activeTab === 'tab2' ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Salary (சம்பளம்)</button>
        </div>
      )}

      {success && <div className="success-message">{success}</div>}
      {error && <div style={{ color: '#C53030', background: '#FFF5F5', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '0.85rem', textAlign: 'center', fontWeight: 'bold' }}>{error}</div>}

      {activeTab === 'tab1' && !userId && (
        <>
          <div className="page-header">
            <h2 style={{margin: 0}}>Drivers Master</h2>
            {!showAddForm && <Button onClick={() => setShowAddForm(true)}>+ Add Driver</Button>}
          </div>

          {loadingDrivers && <p>Loading drivers...</p>}

          {showAddForm && (
            <form onSubmit={handleSaveDriver} className="card">
              <h3>{editingDriver ? 'Edit Driver' : 'Add New Driver'}</h3>
              <InputField english="Name" tamil="பெயர்" value={driverData.name} onChange={(e) => setDriverData({...driverData, name: e.target.value})} required />
              <InputField english="Phone" tamil="தொலைபேசி" type="tel" value={driverData.phone} onChange={(e) => setDriverData({...driverData, phone: e.target.value})} required />
              <InputField english="Village" tamil="ஊர்" value={driverData.village} onChange={(e) => setDriverData({...driverData, village: e.target.value})} required />
              <InputField english="Security PIN" tamil="கடவுச்சொல்" type="password" value={driverData.pin} onChange={(e) => setDriverData({...driverData, pin: e.target.value})} placeholder={editingDriver ? "Leave blank to keep current" : "4-6 digits"} required={!editingDriver} />
              <InputField english="Salary Rate (₹/hr)" tamil="மணி சம்பளம்" type="number" value={driverData.baseRate} onChange={(e) => setDriverData({...driverData, baseRate: parseFloat(e.target.value) || 0})} required />
              <div style={{ marginBottom: '15px' }}>
                 <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={driverData.active} onChange={(e) => setDriverData({ ...driverData, active: e.target.checked })} />
                  <span>Active Employee (பணியில் உள்ளார்)</span>
                </label>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button type="submit" fullWidth>Save (சேமி)</Button>
                <Button type="button" onClick={() => { setShowAddForm(false); setEditingDriver(null); }} variant="danger" fullWidth>Cancel (ரத்து)</Button>
              </div>
            </form>
          )}

          <div className="list-container">
            {drivers.map(driver => (
              <div key={driver._id} className="card" style={{ padding: '15px', borderLeft: driver.active ? '4px solid #1A6B55' : '4px solid #e53e3e' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: '700' }}>{driver.name} <span style={{ color: '#718096', fontSize: '0.8rem' }}>[{driver.village}]</span></div>
                    <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>Rate: ₹ {driver.baseRate}/hr | {driver.phone}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEditDriver(driver)} style={{ background: 'none', border: 'none', color: '#1A6B55', cursor: 'pointer', fontWeight: '600' }}>Edit</button>
                    <button onClick={() => handleDeleteDriver(driver._id)} style={{ background: 'none', border: 'none', color: '#C53030', cursor: 'pointer', fontWeight: '600' }}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'tab2' && (
        <>
          <div className="page-header">
            <h2 style={{margin: 0}}>{userId ? 'My Salary' : 'Driver Salary'}</h2>
            {!showAddSalary && !userId && <Button onClick={() => setShowAddSalary(true)}>+ New Salary Entry</Button>}
          </div>

          {loadingSalaries && <p>Loading salaries...</p>}

          {showAddSalary && !userId && (
            <form onSubmit={handleSaveSalary} className="card">
              <h3>{editingSalary ? 'Edit Salary' : 'New Salary Entry'}</h3>
              <SelectField 
                english="Driver" tamil="ஓட்டுநர்" 
                options={drivers.filter(d => d.active || d._id === salaryData.driver_id).map(d => ({ value: d._id, label: d.name }))}
                value={salaryData.driver_id} onChange={e => setSalaryData({...salaryData, driver_id: e.target.value})} required
              />
              <InputField english="Date" tamil="தேதி" type="date" value={salaryData.date} onChange={e => setSalaryData({...salaryData, date: e.target.value})} required />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <InputField english="Base Salary" tamil="சம்பளம்" type="number" value={salaryData.baseSalary} onChange={e => setSalaryData({...salaryData, baseSalary: e.target.value})} />
                <InputField english="Bonus" tamil="போனஸ்" type="number" value={salaryData.bonus} onChange={e => setSalaryData({...salaryData, bonus: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <InputField english="Extra" tamil="கூடுதல்" type="number" value={salaryData.extraAmount} onChange={e => setSalaryData({...salaryData, extraAmount: e.target.value})} />
                <InputField english="Advance" tamil="முன்பணம்" type="number" value={salaryData.advance} onChange={e => setSalaryData({...salaryData, advance: e.target.value})} />
              </div>
              <InputField english="Notes" tamil="குறிப்பு" value={salaryData.notes} onChange={e => setSalaryData({...salaryData, notes: e.target.value})} />

              <div style={{ padding: '15px', background: netPay >= 0 ? '#F0FFF4' : '#FFF5F5', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: netPay >= 0 ? '#1A6B55' : '#C53030' }}>Net Pay: {formatCurrency(netPay)}</span>
                {netPay < 0 && <p style={{ fontSize: '0.75rem', color: '#C53030', marginTop: '5px' }}>முன்பணம் சம்பளத்தை விட அதிகமாக உள்ளது</p>}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button type="submit" fullWidth>{editingSalary ? 'Update' : 'Save'}</Button>
                <Button type="button" onClick={() => { setShowAddSalary(false); setEditingSalary(null); }} variant="danger" fullWidth>Cancel</Button>
              </div>
            </form>
          )}

          <div className="card" style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#4A5568' }}>Filter (வடிகட்டி)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <InputField english="From Date" tamil="தொடக்க தேதி" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
              <InputField english="To Date" tamil="முடிவு தேதி" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <Button onClick={() => { setFromDate(''); setToDate(''); }} variant="outline">Clear Filter</Button>
              <Button onClick={handlePDF} variant="outline" disabled={filteredSalaries.length === 0}>Download Statement PDF (PDF பதிவிறக்கம்)</Button>
            </div>
          </div>

          <div style={{ marginBottom: '10px', color: '#718096', fontSize: '0.9rem' }}>Showing {filteredSalaries.length} entries</div>

          <div className="list-container">
            {filteredSalaries.map(sal => {
              const currentNet = (parseFloat(sal.baseSalary)||0) + (parseFloat(sal.bonus)||0) + (parseFloat(sal.extraAmount)||0) - (parseFloat(sal.advance)||0);
              const paid = (sal.payments || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);
              const balance = currentNet - paid;
              const driverName = drivers.find(d => d._id === sal.driver_id)?.name || 'Unknown';
              return (
                <div key={sal._id} className="card" style={{ padding: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{driverName} <span style={{color: '#718096', fontSize: '0.8rem', fontWeight: 'normal'}}>| {new Date(sal.date).toLocaleDateString()}</span></div>
                      <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '2px' }}>
                        Base: {sal.baseSalary} | Bonus: {sal.bonus} | Ext: {sal.extraAmount} | Adv: {sal.advance}
                      </div>
                      {sal.notes && <div style={{ fontSize: '0.8rem', marginTop: '2px', color: '#4A5568' }}>Note: {sal.notes}</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', color: currentNet >= 0 ? '#1A6B55' : '#C53030' }}>{formatCurrency(currentNet)}</div>
                      <div style={{ fontSize: '0.8rem', color: '#718096' }}>Net Pay</div>
                    </div>
                  </div>
                  
                  <PaymentHistory 
                    payments={sal.payments || []}
                    onAddPayment={userId ? null : (payment) => handleAddPayment(sal._id, payment)}
                  />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #E2E8F0' }}>
                    <div style={{ fontWeight: 'bold', color: balance > 0 ? '#C53030' : '#1A6B55' }}>
                      Bal: {formatCurrency(balance)}
                    </div>
                    {!userId && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => handleEditSalary(sal)} style={{ background: 'none', border: 'none', color: '#3182CE', cursor: 'pointer', fontWeight: 'bold' }}>Edit</button>
                        <button onClick={() => handleDeleteSalary(sal._id)} style={{ background: 'none', border: 'none', color: '#C53030', cursor: 'pointer', fontWeight: 'bold' }}>Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Drivers;
