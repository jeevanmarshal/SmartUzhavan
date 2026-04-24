import React, { useState, useEffect } from 'react';
import { getData, addRecord } from '../services/storage';
import { generateId } from '../utils/idGenerator';
import { formatCurrency } from '../utils/formatters';
import InputField from '../components/common/InputField';
import SelectField from '../components/common/SelectField';
import Button from '../components/common/Button';

const OwnFarmIncome = () => {
  const [entries, setEntries] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    incomeSource: 'paddy',
    numberOfBags: 0,
    pricePerBag: 0,
    numberOfBundles: 0,
    pricePerBundle: 0,
    totalIncome: 0,
    description: ''
  });

  useEffect(() => {
    setEntries(getData('rl_own_farm_income'));
  }, []);

  useEffect(() => {
    let total = 0;
    if (formData.incomeSource === 'paddy') {
      total = (parseFloat(formData.numberOfBags) || 0) * (parseFloat(formData.pricePerBag) || 0);
    } else {
      total = (parseFloat(formData.numberOfBundles) || 0) * (parseFloat(formData.pricePerBundle) || 0);
    }
    setFormData(prev => ({ ...prev, totalIncome: total }));
  }, [formData.incomeSource, formData.numberOfBags, formData.pricePerBag, formData.numberOfBundles, formData.pricePerBundle]);

  const handleSave = (e) => {
    e.preventDefault();
    const entry = {
      ...formData,
      id: generateId('rl_own_farm_income'),
      status: 'received'
    };
    addRecord('rl_own_farm_income', entry);
    setEntries(getData('rl_own_farm_income'));
    setShowAddForm(false);
    setFormData({ 
      date: new Date().toISOString().split('T')[0], 
      incomeSource: 'paddy', 
      numberOfBags: 0, 
      pricePerBag: 0, 
      numberOfBundles: 0, 
      pricePerBundle: 0, 
      totalIncome: 0, 
      description: '' 
    });
  };

  return (
    <div className="app-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>சொந்த விவசாய வருமானம் (Own Farm Income)</h1>
        {!showAddForm && <Button onClick={() => setShowAddForm(true)}>+ New Sale</Button>}
      </div>

      {showAddForm && (
        <form onSubmit={handleSave} className="card">
          <SelectField 
            english="Income Source" tamil="வருமான வகை"
            options={[
              { value: 'paddy', label: 'Paddy (நெல்)' },
              { value: 'vaikool', label: 'Paddy Straw / Vaikool (வைக்கோல்)' }
            ]}
            value={formData.incomeSource}
            onChange={(e) => setFormData({...formData, incomeSource: e.target.value})}
          />
          
          {formData.incomeSource === 'paddy' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <InputField english="No. of Bags" tamil="மூட்டைகளின் எண்ணிக்கை" type="number" value={formData.numberOfBags} onChange={(e) => setFormData({...formData, numberOfBags: e.target.value})} required />
              <InputField english="Price per Bag" tamil="ஒரு மூட்டை விலை" type="number" value={formData.pricePerBag} onChange={(e) => setFormData({...formData, pricePerBag: e.target.value})} required />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <InputField english="No. of Bundles" tamil="கட்டுகளின் எண்ணிக்கை" type="number" value={formData.numberOfBundles} onChange={(e) => setFormData({...formData, numberOfBundles: e.target.value})} required />
              <InputField english="Price per Bundle" tamil="ஒரு கட்டு விலை" type="number" value={formData.pricePerBundle} onChange={(e) => setFormData({...formData, pricePerBundle: e.target.value})} required />
            </div>
          )}

          <div style={{ padding: '15px', background: '#F0FFF4', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1A6B55' }}>
              Total Revenue: {formatCurrency(formData.totalIncome)}
            </span>
          </div>

          <InputField english="Description" tamil="விவரம்" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button type="submit" fullWidth>Save Income (சேமி)</Button>
            <Button onClick={() => setShowAddForm(false)} variant="danger" fullWidth>Cancel (ரத்து)</Button>
          </div>
        </form>
      )}

      <div className="list-container">
        {entries.map(entry => (
          <div key={entry.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>
                  {entry.incomeSource === 'vaikool' ? 'வைக்கோல் (Vaikool)' : 'நெல் (Paddy)'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#718096' }}>
                  {entry.date} | {entry.incomeSource === 'vaikool' ? `${entry.numberOfBundles} Bundles` : `${entry.numberOfBags} Bags`}
                </div>
              </div>
              <div style={{ fontWeight: 'bold', color: '#1A6B55' }}>{formatCurrency(entry.totalIncome)}</div>
            </div>
            {entry.description && <div style={{ fontSize: '0.75rem', marginTop: '5px', color: '#718096' }}>{entry.description}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OwnFarmIncome;
