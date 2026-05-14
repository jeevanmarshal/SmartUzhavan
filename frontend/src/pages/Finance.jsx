import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import useAPI from '../hooks/useAPI';
import useRealTime from '../hooks/useRealTime';
import { formatCurrency } from '../utils/formatters';
import InputField from '../components/common/InputField';
import Button from '../components/common/Button';
import PaymentHistory from '../components/common/PaymentHistory';
import Badge from '../components/common/Badge';
import { getPaymentStatus } from '../services/calculations';

const Finance = () => {
  const { data: lendingData, syncData: setLendingDataRealTime } = useRealTime('FinanceLending', []);
  const { data: expensesData, syncData: setExpensesDataRealTime } = useRealTime('Expense', []);

  const { execute: fetchLending } = useAPI(apiService.getFinanceRecords.bind(apiService));
  const { execute: fetchExpenses } = useAPI(apiService.getExpenses.bind(apiService));

  const [activeTab, setActiveTab] = useState('lending');
  const [lending, setLending] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeLendingId, setActiveLendingId] = useState(null);
  const [error, setError] = useState('');

  const [lendingFormData, setLendingFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    personName: '',
    amount: 0,
    description: '',
    status: 'active'
  });

  const refreshData = async () => {
    try {
      const [lData, eData] = await Promise.all([
        fetchLending(), fetchExpenses({ source: 'home_expense' })
      ]);
      
      const lArray = Array.isArray(lData) ? lData : (lData?.records || lData?.data || []);
      setLending(lArray);
      setLendingDataRealTime(lArray);
      
      const eAll = Array.isArray(eData) ? eData : (eData?.expenses || eData?.data || []);
      const eArray = eAll.filter(e => e.source === 'home_expense');
      setExpenses(eArray);
      setExpensesDataRealTime(eAll);
    } catch (err) {
      console.error('Data sync failed:', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (lendingData.length > 0) setLending(lendingData);
    if (expensesData.length > 0) setExpenses(expensesData.filter(e => e.source === 'home_expense'));
  }, [lendingData, expensesData]);

  const handleSaveLending = async (e) => {
    e.preventDefault();
    const newRecord = {
      ...lendingFormData,
      payments: [] // repayments array
    };
    
    try {
      await apiService.createFinanceRecord(newRecord);
      await refreshData();
      
      setShowAddForm(false);
      setLendingFormData({ date: new Date().toISOString().split('T')[0], personName: '', amount: 0, description: '', status: 'active' });
    } catch (err) {
      setError(err.message || 'Failed to add lending record');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleAddRepayment = async (id, payment) => {
    try {
      await apiService.addFinancePayment(id, payment);
      await refreshData();
    } catch (err) {
      alert('Failed to add repayment: ' + err.message);
    }
  };

  return (
    <div className="app-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>நிதியியல் பதிவேடு (Finance Ledger)</h1>
        {!showAddForm && <Button onClick={() => setShowAddForm(true)}>+ New Entry</Button>}
      </div>

      {error && <div style={{ color: '#C53030', background: '#FFF5F5', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '0.85rem', textAlign: 'center', fontWeight: 'bold' }}>{error}</div>}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('lending')}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'lending' ? '#1B3A6B' : '#E2E8F0', color: activeTab === 'lending' ? 'white' : '#4A5568', fontWeight: 'bold', cursor: 'pointer' }}
        >
          கடன் (Lending)
        </button>
        <button 
          onClick={() => setActiveTab('home')}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'home' ? '#1B3A6B' : '#E2E8F0', color: activeTab === 'home' ? 'white' : '#4A5568', fontWeight: 'bold', cursor: 'pointer' }}
        >
          வீட்டு செலவு (Home Exp)
        </button>
      </div>

      {showAddForm && activeTab === 'lending' && (
        <form onSubmit={handleSaveLending} className="card">
          <h3>New Lending Entry (புதிய கடன் பதிவு)</h3>
          <InputField 
            english="Date" tamil="தேதி" type="date" 
            value={lendingFormData.date} onChange={(e) => setLendingFormData({...lendingFormData, date: e.target.value})} required 
          />
          <InputField 
            english="Person Name" tamil="பெயர்" 
            value={lendingFormData.personName} onChange={(e) => setLendingFormData({...lendingFormData, personName: e.target.value})} required 
          />
          <InputField 
            english="Amount Given" tamil="கொடுத்த தொகை" type="number" 
            value={lendingFormData.amount} onChange={(e) => setLendingFormData({...lendingFormData, amount: parseFloat(e.target.value) || 0})} required 
          />
          <InputField 
            english="Notes" tamil="குறிப்பு" 
            value={lendingFormData.description} onChange={(e) => setLendingFormData({...lendingFormData, description: e.target.value})} 
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button type="submit" fullWidth>Save (சேமி)</Button>
            <Button type="button" onClick={() => setShowAddForm(false)} variant="danger" fullWidth>Cancel (ரத்து)</Button>
          </div>
        </form>
      )}

      {activeTab === 'lending' && (
        <div className="list-container">
          {lending.map(item => {
            const status = getPaymentStatus(item.amount, item.payments);
            const isExpanded = activeLendingId === item._id;
            const paid = (item.payments || []).reduce((s, p) => s + p.amount, 0);
            
            return (
              <div key={item._id} className="card" onClick={() => setActiveLendingId(isExpanded ? null : item._id)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{item.personName}</div>
                    <div style={{ fontSize: '0.8rem', color: '#718096' }}>{new Date(item.date).toLocaleDateString()}</div>
                  </div>
                  <Badge status={status} />
                </div>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span>Loan: {formatCurrency(item.amount)}</span>
                  <span style={{ color: '#C53030' }}>Due: {formatCurrency(item.amount - paid)}</span>
                </div>
                {isExpanded && (
                  <div onClick={e => e.stopPropagation()} style={{ marginTop: '15px' }}>
                    <PaymentHistory 
                        payments={item.payments || []} 
                        totalAmount={item.amount} 
                        onAddPayment={(p) => handleAddRepayment(item._id, p)}
                    />
                  </div>
                )}
              </div>
            );
          })}
          {lending.length === 0 && <p style={{textAlign:'center', color:'#718096'}}>No lending records found. (கடன் பதிவுகள் ஏதுமில்லை)</p>}
        </div>
      )}

      {activeTab === 'home' && (
        <div className="list-container">
          {expenses.length === 0 && <p style={{textAlign:'center', color:'#718096'}}>No home expenses found. (வீட்டுச் செலவுகள் ஏதுமில்லை)</p>}
          {expenses.map(exp => (
            <div key={exp._id} className="card" style={{ borderLeft: '4px solid #C53030' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{exp.description || exp.category}</div>
                  <div style={{ fontSize: '0.8rem', color: '#718096' }}>{new Date(exp.date).toLocaleDateString()}</div>
                </div>
                <span style={{ fontWeight: 'bold', color: '#C53030' }}>
                  {formatCurrency(exp.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Finance;
