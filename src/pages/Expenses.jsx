import React, { useState, useEffect } from 'react';
import { getData, addRecord } from '../services/storage';
import { generateId } from '../utils/idGenerator';
import { formatCurrency } from '../utils/formatters';
import InputField from '../components/common/InputField';
import SelectField from '../components/common/SelectField';
import Button from '../components/common/Button';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'maintenance',
    amount: '',
    description: ''
  });

  useEffect(() => {
    setExpenses(getData('rl_expenses'));
  }, []);

  const categories = [
    { value: 'maintenance', ta: 'இயந்திர பராமரிப்பு' },
    { value: 'fuel', ta: 'எரிபொருள்' },
    { value: 'parts', ta: 'உதிரி பாகங்கள்' },
    { value: 'tea_food', ta: 'தேநீர் மற்றும் உணவு' },
    { value: 'tax_insurance', ta: 'வரி மற்றும் காப்பீடு' },
    { value: 'other', ta: 'இதர செலவுகள்' }
  ];

  const handleSave = (e) => {
    e.preventDefault();
    const newExpense = {
      ...formData,
      id: generateId('rl_expenses'),
      amount: parseFloat(formData.amount) || 0
    };
    addRecord('rl_expenses', newExpense);
    setExpenses([newExpense, ...expenses]);
    setSuccess(true);
    setFormData({ 
      date: new Date().toISOString().split('T')[0], 
      category: 'maintenance', 
      amount: '', 
      description: '' 
    });
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="app-container">
      <h1>செலவுகள் (General Expenses)</h1>
      {success && <div className="success-message">பதிவு செய்யப்பட்டது (Saved)</div>}

      <form onSubmit={handleSave} className="card">
        <InputField 
          english="Date" tamil="தேதி" type="date" value={formData.date}
          onChange={(e) => setFormData({...formData, date: e.target.value})} required
        />
        <SelectField 
          english="Category" tamil="வகை" options={categories} value={formData.category}
          onChange={(e) => setFormData({...formData, category: e.target.value})}
        />
        <InputField 
          english="Amount (₹)" tamil="தொகை" type="number" value={formData.amount}
          onChange={(e) => setFormData({...formData, amount: e.target.value})} required
        />
        <InputField 
          english="Description" tamil="விளக்கம்" value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        />
        <Button type="submit" fullWidth>செலவைச் சேமிக்கவும் (SAVE EXPENSE)</Button>
      </form>

      <div style={{ marginTop: '30px' }}>
        <h3>செலவு வரலாறு (Expense History)</h3>
        {expenses.map(exp => (
          <div key={exp.id} className="card" style={{ padding: '12px', borderLeft: '4px solid #C53030' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: '700' }}>{categories.find(c => c.value === exp.category)?.ta || exp.category}</div>
                <div style={{ fontSize: '0.85rem', color: '#718096' }}>{exp.date} | {exp.description}</div>
              </div>
              <div style={{ fontWeight: 'bold', color: '#C53030' }}>- {formatCurrency(exp.amount)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Expenses;
