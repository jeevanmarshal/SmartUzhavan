import React, { useState, useEffect } from 'react';
import { getData, addRecord, addPayment } from '../services/storage';
import { generateId } from '../utils/idGenerator';
import { formatCurrency } from '../utils/formatters';
import InputField from '../components/common/InputField';
import Button from '../components/common/Button';
import PaymentHistory from '../components/common/PaymentHistory';
import Badge from '../components/common/Badge';
import { getPaymentStatus } from '../services/calculations';

import { useLocation } from 'react-router-dom';
import SelectField from '../components/common/SelectField';

const Finance = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const searchBillId = searchParams.get('billId');

  const [activeTab, setActiveTab] = useState(searchBillId ? 'harvester' : 'lending');
  const [lending, setLending] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [jobs, setJobs] = useState([]); // Add harvester jobs state if needed for searching
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeLendingId, setActiveLendingId] = useState(null);

  const [lendingData, setLendingData] = useState({
    date: new Date().toISOString().split('T')[0],
    personName: '',
    amount: 0,
    description: '',
    status: 'active'
  });

  const [filters, setFilters] = useState({
    category: 'all',
    fromDate: '',
    toDate: ''
  });

  const homeCategories = [
    { value: 'all', label: 'All Categories (அனைத்தும்)' },
    { value: 'grocery', label: 'Groceries (மளிகை)' },
    { value: 'medical', label: 'Medical (மருத்துவம்)' },
    { value: 'education', label: 'Education (கல்வி)' },
    { value: 'function', label: 'Function (விசேஷம்)' },
    { value: 'personal', label: 'Personal (தனிப்பட்ட)' },
    { value: 'other', label: 'Other (மற்றவை)' }
  ];

  useEffect(() => {
    setLending(getData('rl_lending'));
    setExpenses(getData('rl_expenses').filter(e => e.source === 'home_expense'));
    setJobs(getData('rl_harvester_jobs'));
  }, []);

  const filteredExpenses = expenses.filter(exp => {
    const matchCat = filters.category === 'all' || exp.category === filters.category;
    const matchFrom = !filters.fromDate || exp.date >= filters.fromDate;
    const matchTo = !filters.toDate || exp.date <= filters.toDate;
    return matchCat && matchFrom && matchTo;
  });

  const totalFilteredExpense = filteredExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);

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

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto' }}>
        <button 
          onClick={() => setActiveTab('lending')}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'lending' ? '#1B3A6B' : '#E2E8F0', color: activeTab === 'lending' ? 'white' : '#4A5568', fontWeight: 'bold', cursor: 'pointer' }}
        >
          கடன் (Lending)
        </button>
        <button 
          onClick={() => setActiveTab('harvester')}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'harvester' ? '#1B3A6B' : '#E2E8F0', color: activeTab === 'harvester' ? 'white' : '#4A5568', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Bill ID Search (ரசீது தேடல்)
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

      {activeTab === 'harvester' && (
        <div className="list-container">
           {searchBillId && <p style={{ fontSize: '0.9rem', color: '#1B3A6B', marginBottom: '10px' }}>Searching for Bill ID: <b>{searchBillId}</b></p>}
           {jobs.filter(j => !searchBillId || j.billId.includes(searchBillId)).map(job => {
             const paid = (job.payments || []).reduce((s, p) => s + p.amount, 0);
             return (
               <div key={job.id} className="card" style={{ borderLeft: '4px solid #38A169', border: job.billId === searchBillId ? '2px solid #1B3A6B' : 'none' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <div>
                     <div style={{ fontWeight: 'bold' }}>Bill ID: {job.billId}</div>
                     <div style={{ fontSize: '0.8rem', color: '#718096' }}>{job.date} | Farmer ID: {job.farmerId}</div>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', color: '#38A169' }}>Total: {formatCurrency(job.finalAmount)}</div>
                      <div style={{ fontSize: '0.8rem', color: (job.finalAmount - paid) > 0 ? '#E53E3E' : '#38A169' }}>Due: {formatCurrency(job.finalAmount - paid)}</div>
                   </div>
                 </div>
                 <div style={{ marginTop: '10px' }}>
                    <PaymentHistory record={job} collection="rl_harvester_jobs" onUpdate={() => setJobs(getData('rl_harvester_jobs'))} />
                 </div>
               </div>
             );
           })}
           {jobs.filter(j => !searchBillId || j.billId.includes(searchBillId)).length === 0 && (
             <p style={{ textAlign: 'center', color: '#718096', padding: '20px' }}>No matching bills found.</p>
           )}
        </div>
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
          <div className="card" style={{ marginBottom: '20px', background: '#F7FAFC' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>Filters (வடிகட்டி)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
              <SelectField 
                english="Category" options={homeCategories}
                value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <InputField type="date" english="From" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} />
                <InputField type="date" english="To" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} />
              </div>
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            <p style={{textAlign:'center', color:'#718096'}}>No matching expenses found.</p>
          ) : (
            <>
              <div className="card" style={{ background: '#FFF5F5', borderLeft: '4px solid #C53030', marginBottom: '15px', textAlign: 'center' }}>
                 <div style={{ fontSize: '0.9rem', color: '#4A5568' }}>Total Selected Expense (மொத்த செலவு)</div>
                 <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#C53030' }}>{formatCurrency(totalFilteredExpense)}</div>
              </div>
              
              {filteredExpenses.map(exp => (
                <div key={exp.id} className="card" style={{ borderLeft: '4px solid #C53030' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{exp.description || exp.category}</div>
                      <div style={{ fontSize: '0.8rem', color: '#718096' }}>{exp.date} | {exp.category}</div>
                    </div>
                    <span style={{ fontWeight: 'bold', color: '#C53030' }}>
                      {formatCurrency(exp.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Finance;
