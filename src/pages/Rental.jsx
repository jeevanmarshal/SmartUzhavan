import React, { useState, useEffect } from 'react';
import { getData, getConfig, addRecord, addPayment } from '../services/storage';
import { rentalTypes } from '../data/machineTypes';
import { generateId } from '../utils/idGenerator';
import { sumPayments, getPaymentStatus } from '../services/calculations';
import { formatCurrency } from '../utils/formatters';
import SelectField from '../components/common/SelectField';
import InputField from '../components/common/InputField';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import PaymentHistory from '../components/common/PaymentHistory';
import { generateRentalPDF } from '../services/pdfService';

const Rental = () => {
  const [farmers, setFarmers] = useState([]);
  const [pricing, setPricing] = useState(null);
  const [rentals, setRentals] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeRentalId, setActiveRentalId] = useState(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    farmerId: '',
    machineType: '',
    quantity: 1,
    ratePerUnit: 0,
    unit: ''
  });

  useEffect(() => {
    setFarmers(getData('rl_farmers'));
    setPricing(getConfig('rl_pricing_config'));
    setRentals(getData('rl_rentals'));
  }, []);

  const handleMachineChange = (type) => {
    const machine = rentalTypes.find(m => m.value === type);
    let rate = 0;
    if (pricing && type !== 'water') {
      rate = pricing.rental[type] || 0;
    }
    
    setFormData({
      ...formData,
      machineType: type,
      unit: machine?.unit || '',
      ratePerUnit: rate
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    const newRental = {
      ...formData,
      id: generateId('rl_rentals'),
      totalAmount: formData.quantity * formData.ratePerUnit,
      payments: [],
      status: 'active'
    };

    addRecord('rl_rentals', newRental);
    setRentals(getData('rl_rentals'));
    setShowAddForm(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      farmerId: '',
      machineType: '',
      quantity: 1,
      ratePerUnit: 0,
      unit: ''
    });
  };

  const handleAddPayment = (rentalId, payment) => {
    addPayment('rl_rentals', rentalId, payment);
    setRentals(getData('rl_rentals'));
  };

  return (
    <div className="app-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>இயந்திர வாடகை (Machinery Rental)</h1>
        {!showAddForm && <Button onClick={() => setShowAddForm(true)}>+ New Entry</Button>}
      </div>

      {showAddForm && (
        <form onSubmit={handleSave} className="card">
          <h3>New Rental Entry (புதிய வாடகை பதிவு)</h3>
          <InputField 
            english="Date" tamil="தேதி" type="date" 
            value={formData.date} 
            onChange={(e) => setFormData({...formData, date: e.target.value})} 
            required 
          />
          <SelectField 
            english="Farmer" tamil="விவசாயி" 
            options={farmers.map(f => ({ value: f.id, label: `${f.name} (${f.village})` }))}
            value={formData.farmerId}
            onChange={(e) => setFormData({...formData, farmerId: e.target.value})}
            required
          />
          <SelectField 
            english="Machine" tamil="இயந்திரம்" 
            options={rentalTypes}
            value={formData.machineType}
            onChange={(e) => handleMachineChange(e.target.value)}
            required
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <InputField 
              english={`Qty (${formData.unit})`} 
              tamil="அளவு" type="number" 
              value={formData.quantity} 
              onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value) || 0})}
              required 
            />
            <InputField 
              english="Rate" tamil="விலை" type="number" 
              value={formData.ratePerUnit} 
              onChange={(e) => setFormData({...formData, ratePerUnit: parseFloat(e.target.value) || 0})}
              required 
            />
          </div>
          <div style={{ padding: '10px', background: '#F0FFF4', borderRadius: '8px', margin: '10px 0', fontWeight: 'bold' }}>
            Total: {formatCurrency(formData.quantity * formData.ratePerUnit)}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button type="submit" fullWidth>Save (சேமி)</Button>
            <Button onClick={() => setShowAddForm(false)} variant="danger" fullWidth>Cancel (ரத்து)</Button>
          </div>
        </form>
      )}

      <div className="list-container">
        {rentals.map(rental => {
          const farmer = farmers.find(f => f.id === rental.farmerId);
          const machine = rentalTypes.find(m => m.value === rental.machineType);
          const isExpanded = activeRentalId === rental.id;
          const status = getPaymentStatus(rental.totalAmount, rental.payments);

          return (
            <div key={rental.id} className="card" onClick={() => setActiveRentalId(isExpanded ? null : rental.id)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{farmer?.name || 'Unknown'}</div>
                  <div style={{ fontSize: '0.85rem', color: '#718096' }}>{rental.date} | {machine?.ta || rental.machineType}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                  <Badge status={status} />
                  <button 
                    onClick={(e) => { e.stopPropagation(); generateRentalPDF(rental, farmer); }}
                    style={{ fontSize: '0.75rem', color: '#1B3A6B', border: '1px solid #1B3A6B', borderRadius: '4px', padding: '2px 8px', background: 'white', cursor: 'pointer' }}
                  >
                    PDF
                  </button>
                </div>
              </div>
              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>{rental.quantity} {rental.unit} × {rental.ratePerUnit}</span>
                <span>{formatCurrency(rental.totalAmount)}</span>
              </div>

              {isExpanded && (
                <div onClick={(e) => e.stopPropagation()}>
                  <PaymentHistory 
                    payments={rental.payments} 
                    totalAmount={rental.totalAmount} 
                    onAddPayment={(payment) => handleAddPayment(rental.id, payment)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Rental;
