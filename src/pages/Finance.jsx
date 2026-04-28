import React, { useState, useEffect } from 'react';
import { getData, addRecord, addPayment } from '../services/storage';
import { generateId } from '../utils/idGenerator';
import { formatCurrency } from '../utils/formatters';
import InputField from '../components/common/InputField';
import Button from '../components/common/Button';
import PaymentHistory from '../components/common/PaymentHistory';
import Badge from '../components/common/Badge';
import { getPaymentStatus } from '../services/calculations';

const Finance = () => {
  const [activeTab, setActiveTab] = useState('lending');
  const [lending, setLending] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeLendingId, setActiveLendingId] = useState(null);

  const [lendingData, setLendingData] = useState({
    date: new Date().toISOString().split('T')[0],
    personName: '',
    amount: 0,
    description: '',
    status: 'active'
  });

  useEffect(() => {
    setLending(getData('rl_lending'));
    const allExpenses = getData('rl_expenses');
    setExpenses(allExpenses.filter(e => e.source === 'home_expense'));
  }, []);

  const handleSaveLending = (e) => {
    e.preventDefault();
    const newRecord = {
      ...lendingData,
      id: generateId('rl_lending'),
      payments: [] // repayments array
    };
    addRecord('rl_lending', newRecord);
    setLending(getData('rl_lending'));
    setShowAddForm(false);
    setLendingData({ date: new Date().toISOString().split('T')[0], personName: '', amount: 0, description: '', status: 'active' });
  };

  const handleAddRepayment = (id, payment) => {
    addPayment('rl_lending', id, payment);
    setLending(getData('rl_lending'));
  };

  return (
    <div className="app-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>நிதியியல் பதிவேடு (Finance Ledger)</h1>
        {!showAddForm && <Button onClick={() => setShowAddForm(true)}>+ New Entry</Button>}
      </div>

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
            value={lendingData.date} onChange={(e) => setLendingData({...lendingData, date: e.target.value})} required 
          />
          <InputField 
            english="Person Name" tamil="பெயர்" 
            value={lendingData.personName} onChange={(e) => setLendingData({...lendingData, personName: e.target.value})} required 
          />
          <InputField 
            english="Amount Given" tamil="கொடுத்த தொகை" type="number" 
            value={lendingData.amount} onChange={(e) => setLendingData({...lendingData, amount: parseFloat(e.target.value) || 0})} required 
          />
          <InputField 
            english="Notes" tamil="குறிப்பு" 
            value={lendingData.description} onChange={(e) => setLendingData({...lendingData, description: e.target.value})} 
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button type="submit" fullWidth>Save (சேமி)</Button>
            <Button onClick={() => setShowAddForm(false)} variant="danger" fullWidth>Cancel (ரத்து)</Button>
          </div>
        </form>
      )}

      {activeTab === 'lending' && (
        <div className="list-container">
          {lending.map(item => {
            const status = getPaymentStatus(item.amount, item.payments);
            const isExpanded = activeLendingId === item.id;
            const paid = (item.payments || []).reduce((s, p) => s + p.amount, 0);
            
            return (
              <div key={item.id} className="card" onClick={() => setActiveLendingId(isExpanded ? null : item.id)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{item.personName}</div>
                    <div style={{ fontSize: '0.8rem', color: '#718096' }}>{item.date}</div>
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
                        payments={item.payments} 
                        totalAmount={item.amount} 
                        onAddPayment={(p) => handleAddRepayment(item.id, p)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'home' && (
        <div className="list-container">
          {expenses.length === 0 && <p style={{textAlign:'center', color:'#718096'}}>No home expenses found. (வீட்டுச் செலவுகள் ஏதுமில்லை)</p>}
          {expenses.map(exp => (
            <div key={exp.id} className="card" style={{ borderLeft: '4px solid #C53030' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{exp.description || exp.category}</div>
                  <div style={{ fontSize: '0.8rem', color: '#718096' }}>{exp.date}</div>
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
