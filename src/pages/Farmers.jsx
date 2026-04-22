import React, { useState, useEffect } from 'react';
import { getData, saveData, updateRecord, deleteRecord } from '../services/storage';
import { generateId } from '../utils/idGenerator';
import InputField from '../components/common/InputField';
import SelectField from '../components/common/SelectField';
import Button from '../components/common/Button';

const Farmers = () => {
  const [farmers, setFarmers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    village: '',
    phone: '',
    type: 'external'
  });

  useEffect(() => {
    setFarmers(getData('rl_farmers'));
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    if (editingFarmer) {
      updateRecord('rl_farmers', editingFarmer.id, formData);
      setEditingFarmer(null);
    } else {
      const newFarmer = {
        ...formData,
        id: generateId('rl_farmers')
      };
      const list = [...farmers, newFarmer];
      saveData('rl_farmers', list);
    }
    
    setFarmers(getData('rl_farmers'));
    setShowAddForm(false);
    setFormData({ name: '', village: '', phone: '', type: 'external' });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleEdit = (farmer) => {
    if (farmer.id === 'F000') {
      alert('Cannot edit Own Farm (F000)');
      return;
    }
    setFormData({
      name: farmer.name,
      village: farmer.village,
      phone: farmer.phone,
      type: farmer.type
    });
    setEditingFarmer(farmer);
    setShowAddForm(true);
  };

  const handleDelete = (id) => {
    if (id === 'F000') {
      alert('Cannot delete Own Farm (F000)');
      return;
    }
    if (window.confirm('Are you sure you want to delete this farmer? (விவசாயியை நீக்க வேண்டுமா?)')) {
      deleteRecord('rl_farmers', id);
      setFarmers(getData('rl_farmers'));
    }
  };

  return (
    <div className="app-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>விவசாயிகள் (Farmers Master)</h1>
        {!showAddForm && <Button onClick={() => setShowAddForm(true)}>+ Add Farmer</Button>}
      </div>

      {success && <div className="success-message">வெற்றிகரமாகச் சேமிக்கப்பட்டது (Saved)</div>}

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
            options={[{value: 'external', ta: 'வெளி நபர்'}, {value: 'own', ta: 'சொந்த நிலம்'}]}
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value})}
          />
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <Button type="submit" fullWidth>Save (சேமி)</Button>
            <Button onClick={() => { setShowAddForm(false); setEditingFarmer(null); }} variant="danger" fullWidth>Cancel (ரத்து)</Button>
          </div>
        </form>
      )}

      <div className="list-container">
        {farmers.map(farmer => (
          <div key={farmer.id} className="card" style={{ padding: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: '700' }}>{farmer.name} <span style={{ color: '#718096', fontSize: '0.8rem' }}>[{farmer.id}]</span></div>
                <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>{farmer.village} | {farmer.phone || 'No Phone'}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleEdit(farmer)} style={{ background: 'none', border: 'none', color: '#1A6B55', cursor: 'pointer', fontWeight: '600' }}>Edit</button>
                <button onClick={() => handleDelete(farmer.id)} style={{ background: 'none', border: 'none', color: '#C53030', cursor: 'pointer', fontWeight: '600' }}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Farmers;
