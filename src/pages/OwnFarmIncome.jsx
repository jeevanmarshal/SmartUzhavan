import React, { useState, useEffect } from 'react';
import { getData, addRecord } from '../services/storage';
import { generateId } from '../utils/idGenerator';
import { formatCurrency } from '../utils/formatters';
import InputField from '../components/common/InputField';
import SelectField from '../components/common/SelectField';
import Button from '../components/common/Button';

const OwnFarmIncome = () => {
  const [incomes, setIncomes] = useState([]);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    source: 'paddy_sale',
    amount: '',
    quantity: '',
    description: ''
  });

  useEffect(() => {
    setIncomes(getData('rl_own_farm_income'));
  }, []);

  const sources = [
    { value: 'paddy_sale', ta: 'நெல் விற்பனை' },
    { value: 'straw_sale', ta: 'வைக்கோல் விற்பனை' },
    { value: 'subsidy', ta: 'அரசு மானியம்' },
    { value: 'other', ta: 'இதர வருமானம்' }
  ];

  const handleSave = (e) => {
    e.preventDefault();
    const newRecord = {
      ...formData,
      id: generateId('rl_own_farm_income'),
      amount: parseFloat(formData.amount) || 0
    };
    addRecord('rl_own_farm_income', newRecord);
    setIncomes([newRecord, ...incomes]);
    setSuccess(true);
    setFormData({ 
      date: new Date().toISOString().split('T')[0], 
      source: 'paddy_sale', 
      amount: '', 
      quantity: '', 
      description: '' 
    });
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="app-container">
      <h1>சொந்த பண்ணை வருமானம் (Own Farm Income)</h1>
      {success && <div className="success-message">பதிவு செய்யப்பட்டது (Saved)</div>}

      <div className="card">
        <h3>Income Entry (வருமான பதிவு)</h3>
        <form onSubmit={handleSave}>
          <InputField 
            english="Date" tamil="தேதி" type="date" value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})} required
          />
          <SelectField 
            english="Income Source" tamil="வருமான வகை" options={sources} value={formData.source}
            onChange={(e) => setFormData({...formData, source: e.target.value})}
          />
          <InputField 
            english="Quantity (Bags/Load)" tamil="அளவு" value={formData.quantity}
            onChange={(e) => setFormData({...formData, quantity: e.target.value})}
          />
          <InputField 
            english="Total Amount (₹)" tamil="மொத்த தொகை" type="number" value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})} required
          />
          <InputField 
            english="Description" tamil="குறிப்பு" value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
          <Button type="submit" fullWidth>வருமானத்தை சேமிக்கவும் (SAVE INCOME)</Button>
        </form>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>வருமான வரலாறு (Income History)</h3>
        {incomes.map(inc => (
          <div key={inc.id} className="card" style={{ padding: '12px', borderLeft: '4px solid #2F855A' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: '700' }}>{sources.find(s => s.value === inc.source)?.ta || inc.source}</div>
                <div style={{ fontSize: '0.85rem', color: '#718096' }}>{inc.date} | {inc.quantity} | {inc.description}</div>
              </div>
              <div style={{ fontWeight: 'bold', color: '#1A6B55' }}>+ {formatCurrency(inc.amount)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OwnFarmIncome;
