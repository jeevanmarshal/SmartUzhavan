import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import useAPI from '../hooks/useAPI';
import useRealTime from '../hooks/useRealTime';
import InputField from '../components/common/InputField';
import SelectField from '../components/common/SelectField';
import Button from '../components/common/Button';

const Farmers = () => {
  const { data: farmersData, syncData: setFarmersDataRealTime } = useRealTime('Farmer', []);
  const { execute: fetchFarmers } = useAPI(apiService.getFarmers.bind(apiService));

  const [farmers, setFarmers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    village: '',
    phone: '',
    type: 'external'
  });

  const refreshData = async () => {
    try {
      const data = await fetchFarmers();
      const fArray = data?.farmers || (Array.isArray(data) ? data : []);
      setFarmers(fArray);
      setFarmersDataRealTime(fArray);
    } catch (err) {
      console.error('Data sync failed:', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (farmersData.length > 0) setFarmers(farmersData);
  }, [farmersData]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingFarmer) {
        await apiService.updateFarmer(editingFarmer._id, formData);
        setEditingFarmer(null);
      } else {
        await apiService.createFarmer(formData);
      }
      
      await refreshData();
      setShowAddForm(false);
      setFormData({ name: '', village: '', phone: '', type: 'external' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save farmer');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleEdit = (farmer) => {
    if (farmer._id === 'F000') {
      alert('Cannot edit Own Farm (F000)');
      return;
    }
    setFormData({
      name: farmer.name,
      village: farmer.village,
      phone: farmer.phone || '',
      type: farmer.type || 'external'
    });
    setEditingFarmer(farmer);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (id === 'F000') {
      alert('Cannot delete Own Farm (F000)');
      return;
    }
    if (window.confirm('Are you sure you want to delete this farmer? (விவசாயியை நீக்க வேண்டுமா?)')) {
      try {
        await apiService.request('DELETE', `/farmers/${id}`); // Assuming delete endpoint exists
        await refreshData();
      } catch (err) {
        alert('Failed to delete farmer: ' + err.message);
      }
    }
  };

  return (
    <div className="app-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>விவசாயிகள் (Farmers Master)</h1>
        {!showAddForm && <Button onClick={() => setShowAddForm(true)}>+ Add Farmer</Button>}
      </div>

      {success && <div className="success-message">வெற்றிகரமாகச் சேமிக்கப்பட்டது (Saved)</div>}
      {error && <div style={{ color: '#C53030', background: '#FFF5F5', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '0.85rem', textAlign: 'center', fontWeight: 'bold' }}>{error}</div>}

      {showAddForm && (
        <form onSubmit={handleSave} className="card">
          <h3>{editingFarmer ? 'Edit Farmer' : 'Add New Farmer'}</h3>
          <InputField 
            english="Name" tamil="பெயர்" value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})} required
          />
          <InputField 
            english="Village" tamil="ஊர்" value={formData.village}
            onChange={(e) => setFormData({...formData, village: e.target.value})} required
          />
          <InputField 
            english="Phone" tamil="தொலைபேசி" type="tel" value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
          <SelectField 
            english="Type" tamil="வகை"
            options={[
              { value: 'normal', label: 'Normal (சாதாரண)' }, 
              { value: 'neighbour', label: 'Neighbour (அண்டை விவசாயி)' }, 
              { value: 'own', label: 'Own Farm (சொந்த நிலம்)' }
            ]}
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value})}
          />
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <Button type="submit" fullWidth>Save (சேமி)</Button>
            <Button type="button" onClick={() => { setShowAddForm(false); setEditingFarmer(null); }} variant="danger" fullWidth>Cancel (ரத்து)</Button>
          </div>
        </form>
      )}

      <div className="list-container">
        {farmers.map(farmer => (
          <div key={farmer._id} className="card" style={{ padding: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: '700' }}>{farmer.name}</div>
                <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>{farmer.village} | {farmer.phone || 'No Phone'}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleEdit(farmer)} style={{ background: 'none', border: 'none', color: '#1A6B55', cursor: 'pointer', fontWeight: '600' }}>Edit</button>
                <button onClick={() => handleDelete(farmer._id)} style={{ background: 'none', border: 'none', color: '#C53030', cursor: 'pointer', fontWeight: '600' }}>Delete</button>
              </div>
            </div>
          </div>
        ))}
        {farmers.length === 0 && <p style={{textAlign:'center', color:'#718096'}}>No farmers found.</p>}
      </div>
    </div>
  );
};

export default Farmers;
