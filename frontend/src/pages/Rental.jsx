import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import useAPI from '../hooks/useAPI';
import useRealTime from '../hooks/useRealTime';
import { rentalTypes } from '../data/machineTypes';
import { getPaymentStatus } from '../services/calculations';
import { formatCurrency } from '../utils/formatters';
import SelectField from '../components/common/SelectField';
import InputField from '../components/common/InputField';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import PaymentHistory from '../components/common/PaymentHistory';
import { generateRentalPDF as pdfGenerateRental } from '../services/pdfService';

const Rental = () => {
  const { data: farmersData } = useRealTime('Farmer', []);
  const { data: rentalsData, syncData: setRentals } = useRealTime('Rental', []);

  const { execute: fetchFarmers } = useAPI(apiService.getFarmers.bind(apiService));
  const { execute: fetchSettings } = useAPI(apiService.getSettings.bind(apiService));
  const { execute: fetchRentals } = useAPI(apiService.getRentals.bind(apiService));

  const [farmers, setFarmers] = useState([]);
  const [pricing, setPricing] = useState(null);
  const [rentals, setLocalRentals] = useState([]);
  
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeRentalId, setActiveRentalId] = useState(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    farmer_id: '',
    machineType: '',
    quantity: 1,
    ratePerUnit: 0,
    unit: ''
  });

  const refreshData = async () => {
    try {
      const [fData, sData, rData] = await Promise.all([
        fetchFarmers(), fetchSettings(), fetchRentals()
      ]);
      setFarmers(fData?.data || fData || []);
      setPricing(sData?.data?.pricing || null);
      
      const rArray = rData?.data || rData || [];
      setLocalRentals(rArray);
      setRentals(rArray);
    } catch (err) {
      console.error('Data sync failed:', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (farmersData.length > 0) setFarmers(farmersData);
    if (rentalsData.length > 0) setLocalRentals(rentalsData);
  }, [farmersData, rentalsData]);

  const handleMachineChange = (type) => {
    const machine = rentalTypes.find(m => m.value === type);
    let rate = 0;
    if (pricing && type !== 'water') {
      rate = pricing.rental?.[type] || 0;
    }
    
    setFormData({
      ...formData,
      machineType: type,
      unit: machine?.unit || '',
      ratePerUnit: rate
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const newRental = {
      ...formData,
      totalAmount: formData.quantity * formData.ratePerUnit,
      payments: [],
      status: 'active'
    };

    try {
      await apiService.createRental(newRental);
      await refreshData();
      
      setSuccess(true);
      setShowAddForm(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        farmer_id: '',
        machineType: '',
        quantity: 1,
        ratePerUnit: 0,
        unit: ''
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create rental record');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleAddPayment = async (rentalId, payment) => {
    try {
      const rental = rentals.find(r => r._id === rentalId);
      if (!rental) return;
      const updatedPayments = [...(rental.payments || []), payment];
      await apiService.updateRental(rentalId, { payments: updatedPayments });
      await refreshData();
    } catch (err) {
      alert('Failed to add payment: ' + err.message);
    }
  };

  const generateRentalPDF = async (rental) => {
    try {
      const farmerId = rental.farmer_id?._id || rental.farmer_id || rental.farmerId;
      const farmer = farmers.find(f => f._id === farmerId);
      await pdfGenerateRental(rental, farmer);
    } catch (err) {
      alert('Error generating PDF: ' + err.message);
    }
  };

  return (
    <div className="app-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>இயந்திர வாடகை (Machinery Rental)</h1>
        {!showAddForm && <Button onClick={() => setShowAddForm(true)}>+ New Entry</Button>}
      </div>

      {success && <div className="success-message">வெற்றிகரமாக சேமிக்கப்பட்டது (Successfully Saved)</div>}
      {error && <div style={{ color: '#C53030', background: '#FFF5F5', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '0.85rem', textAlign: 'center', fontWeight: 'bold' }}>{error}</div>}

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
            options={farmers.map(f => ({ value: f._id, label: `${f.name} (${f.village})` }))}
            value={formData.farmer_id}
            onChange={(e) => setFormData({...formData, farmer_id: e.target.value})}
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
            <Button type="button" onClick={() => setShowAddForm(false)} variant="danger" fullWidth>Cancel (ரத்து)</Button>
          </div>
        </form>
      )}

      <div className="list-container">
        {rentals.map(rental => {
          const farmerId = rental.farmer_id?._id || rental.farmer_id || rental.farmerId;
          const farmer = farmers.find(f => f._id === farmerId);
          const farmerName = rental.farmer_id?.name || farmer?.name || 'Unknown';
          const machine = rentalTypes.find(m => m.value === rental.machineType);
          const isExpanded = activeRentalId === rental._id;
          const status = getPaymentStatus(rental.totalAmount, rental.payments);

          return (
            <div key={rental._id} className="card" onClick={() => setActiveRentalId(isExpanded ? null : rental._id)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{farmerName}</div>
                  <div style={{ fontSize: '0.85rem', color: '#718096' }}>{new Date(rental.date).toLocaleDateString()} | {machine?.ta || rental.machineType}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                  <Badge status={status} />
                  <button 
                    onClick={(e) => { e.stopPropagation(); generateRentalPDF(rental); }}
                    style={{ fontSize: '0.75rem', color: '#1B3A6B', border: '1px solid #1B3A6B', borderRadius: '4px', padding: '2px 8px', background: 'white', cursor: 'pointer' }}
                    title="PDF Generation pending API integration"
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
                    payments={rental.payments || []} 
                    totalAmount={rental.totalAmount} 
                    onAddPayment={(payment) => handleAddPayment(rental._id, payment)}
                  />
                </div>
              )}
            </div>
          );
        })}
        {rentals.length === 0 && <p style={{textAlign: 'center', color: '#718096'}}>No rentals found.</p>}
      </div>
    </div>
  );
};

export default Rental;
