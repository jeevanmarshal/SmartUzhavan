import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import useAPI from '../hooks/useAPI';
import useRealTime from '../hooks/useRealTime';
import { formatCurrency } from '../utils/formatters';
import InputField from '../components/common/InputField';
import SelectField from '../components/common/SelectField';
import Button from '../components/common/Button';

const OwnFarmIncome = () => {
  const { data: incomeDataRealTime, syncData: setIncomeDataRealTime } = useRealTime('OwnFarmIncome', []);
  const { execute: fetchIncome } = useAPI(apiService.getOwnFarmIncome.bind(apiService));

  const [entries, setEntries] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    incomeSource: 'paddy',
    numberOfBags: 0,
    pricePerBag: 0,
    numberOfBundles: 0,
    pricePerBundle: 0,
    totalIncome: 0,
    description: '',
    source: 'own_farm'
  });

  const refreshData = async () => {
    try {
      const iData = await fetchIncome();
      const iArray = iData?.data || iData || [];
      setEntries(iArray);
      setIncomeDataRealTime(iArray);
    } catch (err) {
      console.error('Data sync failed:', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (incomeDataRealTime.length > 0) setEntries(incomeDataRealTime);
  }, [incomeDataRealTime]);

  useEffect(() => {
    let total = 0;
    if (formData.incomeSource === 'paddy') {
      total = (parseFloat(formData.numberOfBags) || 0) * (parseFloat(formData.pricePerBag) || 0);
    } else {
      total = (parseFloat(formData.numberOfBundles) || 0) * (parseFloat(formData.pricePerBundle) || 0);
    }
    setFormData(prev => ({ ...prev, totalIncome: total }));
  }, [formData.incomeSource, formData.numberOfBags, formData.pricePerBag, formData.numberOfBundles, formData.pricePerBundle]);

  const [editingId, setEditingId] = useState(null);

  const handleEdit = (entry) => {
    setEditingId(entry._id);
    setFormData({
      date: entry.date ? new Date(entry.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      incomeSource: entry.incomeSource,
      numberOfBags: entry.numberOfBags || 0,
      pricePerBag: entry.pricePerBag || 0,
      numberOfBundles: entry.numberOfBundles || 0,
      pricePerBundle: entry.pricePerBundle || 0,
      totalIncome: entry.totalIncome || 0,
      description: entry.description || '',
      source: entry.source || 'own_farm'
    });
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record? (இந்த பதிவை நீக்க வேண்டுமா?)')) {
      try {
        await apiService.deleteOwnFarmIncome(id);
        await refreshData();
      } catch (err) {
        alert('Failed to delete record: ' + err.message);
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const entry = {
      ...formData,
      status: 'received'
    };
    
    try {
      if (editingId) {
        await apiService.updateOwnFarmIncome(editingId, entry);
      } else {
        await apiService.createOwnFarmIncome(entry);
      }
      await refreshData();
      
      setShowAddForm(false);
      setEditingId(null);
      setFormData({ date: new Date().toISOString().split('T')[0], incomeSource: 'paddy', numberOfBags: 0, pricePerBag: 0, numberOfBundles: 0, pricePerBundle: 0, totalIncome: 0, description: '', source: 'own_farm' });
    } catch (err) {
      setError(err.message || 'Failed to save income record');
      setTimeout(() => setError(''), 5000);
    }
  };

  return (
    <div className="app-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>சொந்த விவசாய வருமானம் (Own Farm Income)</h1>
        {!showAddForm && <Button onClick={() => {
            setEditingId(null);
            setFormData({ date: new Date().toISOString().split('T')[0], incomeSource: 'paddy', numberOfBags: 0, pricePerBag: 0, numberOfBundles: 0, pricePerBundle: 0, totalIncome: 0, description: '', source: 'own_farm' });
            setShowAddForm(true);
        }}>+ New Sale</Button>}
      </div>

      {error && <div style={{ color: '#C53030', background: '#FFF5F5', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '0.85rem', textAlign: 'center', fontWeight: 'bold' }}>{error}</div>}

      {showAddForm && (
        <form onSubmit={handleSave} className="card">
          <InputField english="Date" tamil="தேதி" type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
          <SelectField 
            english="Source" tamil="வருமான மூலம்" 
            options={[
              { value: 'paddy', label: 'Paddy (நெல்)' },
              { value: 'vaikool', label: 'Paddy Straw / Vaikool (வைக்கோல்)' }
            ]}
            value={formData.incomeSource}
            onChange={(e) => setFormData({...formData, incomeSource: e.target.value})}
            required
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
            <Button type="button" onClick={() => setShowAddForm(false)} variant="danger" fullWidth>Cancel (ரத்து)</Button>
          </div>
        </form>
      )}

      <div className="list-container">
        {entries.length === 0 && <p style={{textAlign:'center', color:'#718096'}}>No income records found.</p>}
        {entries.map(entry => (
          <div key={entry._id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>
                  {entry.incomeSource === 'vaikool' ? 'வைக்கோல்' : 'நெல்'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#718096' }}>
                  {new Date(entry.date).toLocaleDateString()} | {entry.incomeSource === 'vaikool' ? `${entry.numberOfBundles} கட்டுகள்` : `${entry.numberOfBags} மூட்டைகள்`}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                <div style={{ fontWeight: 'bold', color: '#1A6B55' }}>{formatCurrency(entry.totalIncome)}</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleEdit(entry)} style={{ background: 'none', border: 'none', color: '#1A6B55', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}>Edit</button>
                  <button onClick={() => handleDelete(entry._id)} style={{ background: 'none', border: 'none', color: '#C53030', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}>Delete</button>
                </div>
              </div>
            </div>
            {entry.description && <div style={{ fontSize: '0.75rem', marginTop: '5px', color: '#718096' }}>{entry.description}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OwnFarmIncome;
