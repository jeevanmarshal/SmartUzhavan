import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import useAPI from '../hooks/useAPI';
import useRealTime from '../hooks/useRealTime';
import { formatCurrency } from '../utils/formatters';
import InputField from '../components/common/InputField';
import SelectField from '../components/common/SelectField';
import Button from '../components/common/Button';

const Expenses = () => {
  const { data: expensesData, syncData: setExpensesDataRealTime } = useRealTime('Expense', []);
  const { execute: fetchExpenses } = useAPI(apiService.getExpenses.bind(apiService));

  const [expenses, setExpenses] = useState([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    source: 'business',
    category: 'maintenance',
    amount: '',
    description: ''
  });

  const refreshData = async () => {
    try {
      const data = await fetchExpenses();
      const eArray = data?.data || data || [];
      setExpenses(eArray);
      setExpensesDataRealTime(eArray);
    } catch (err) {
      console.error('Data sync failed:', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (expensesData.length > 0) setExpenses(expensesData);
  }, [expensesData]);

  const CATEGORY_MAP = {
    business: [
      { value: 'maintenance',   en: 'Maintenance',    ta: 'இயந்திர பராமரிப்பு' },
      { value: 'diesel',        en: 'Fuel / Diesel',  ta: 'எரிபொருள் / டீசல்' },
      { value: 'parts',         en: 'Spare Parts',    ta: 'உதிரி பாகங்கள்' },
      { value: 'mechanic',      en: 'Mechanic Cost',  ta: 'மெக்கானிக் கட்டணம்' },
      { value: 'driver_food',   en: 'Driver Food',    ta: 'ஓட்டுநர் உணவு' },
      { value: 'tax',           en: 'Tax / Insurance',ta: 'வரி / காப்பீடு' },
      { value: 'other',         en: 'Other',          ta: 'இதர' },
    ],
    own_farm: [
      { value: 'seeds',         en: 'Seeds',          ta: 'விதைகள்' },
      { value: 'fertilizer',    en: 'Fertilizer',     ta: 'உரம்' },
      { value: 'pesticide',     en: 'Pesticide',      ta: 'பூச்சிக்கொல்லி' },
      { value: 'irrigation',    en: 'Irrigation',     ta: 'நீர்ப்பாசனம்' },
      { value: 'labour',        en: 'Labour',         ta: 'கூலி' },
      { value: 'equip_rental',  en: 'Equipment Rental',ta:'உபகரண வாடகை' },
      { value: 'other',         en: 'Other',          ta: 'இதர' },
    ],
    home_expense: [
      { value: 'food',          en: 'Food',           ta: 'உணவு' },
      { value: 'medical',       en: 'Medical',        ta: 'மருத்துவம்' },
      { value: 'education',     en: 'Education',      ta: 'கல்வி' },
      { value: 'transport',     en: 'Transport',      ta: 'போக்குவரத்து' },
      { value: 'utilities',     en: 'Utilities',      ta: 'மின்சாரம்/தண்ணீர்' },
      { value: 'other',         en: 'Other',          ta: 'இதர' },
    ],
  };

  const handleSourceChange = (newSource) => {
    setFormData({...formData,
      source: newSource,
      category: CATEGORY_MAP[newSource][0].value
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const newExpense = {
      ...formData,
      amount: parseFloat(formData.amount) || 0
    };
    
    try {
      await apiService.createExpense(newExpense);
      await refreshData();
      
      setSuccess(true);
      setFormData({ 
        date: new Date().toISOString().split('T')[0], 
        source: 'business',
        category: 'maintenance', 
        amount: '', 
        description: '' 
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save expense');
      setTimeout(() => setError(''), 5000);
    }
  };

  return (
    <div className="app-container">
      <h1>செலவுகள் (General Expenses)</h1>
      {success && <div className="success-message">பதிவு செய்யப்பட்டது (Saved)</div>}
      {error && <div style={{ color: '#C53030', background: '#FFF5F5', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '0.85rem', textAlign: 'center', fontWeight: 'bold' }}>{error}</div>}

      <form onSubmit={handleSave} className="card">
        <InputField 
          english="Date" tamil="தேதி" type="date" value={formData.date}
          onChange={(e) => setFormData({...formData, date: e.target.value})} required
        />
        <SelectField 
          english="Expense Type" tamil="செலவு வகை" 
          options={[
            { value: 'business', label: 'வியாபார செலவு (Business)' },
            { value: 'own_farm', label: 'சொந்த பண்ணை செலவு (Own Farm)' },
            { value: 'home_expense', label: 'வீட்டு செலவு (Home)' },
          ]}
          value={formData.source}
          onChange={(e) => handleSourceChange(e.target.value)}
        />
        <SelectField 
          english="Category" tamil="வகை" options={CATEGORY_MAP[formData.source]} value={formData.category}
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
        {expenses.length === 0 && <p style={{textAlign:'center', color:'#718096'}}>No expenses found.</p>}
        {expenses.map(exp => (
          <div key={exp._id} className="card" style={{ padding: '12px', borderLeft: '4px solid #C53030' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: '700' }}>{CATEGORY_MAP[exp.source]?.find(c => c.value === exp.category)?.ta || exp.category}</div>
                <div style={{ fontSize: '0.85rem', color: '#718096' }}>{new Date(exp.date).toLocaleDateString()} | {exp.description}</div>
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
