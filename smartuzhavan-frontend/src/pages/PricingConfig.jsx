import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import useAPI from '../hooks/useAPI';
import { initialPricingConfig } from '../data/initialData';
import InputField from '../components/common/InputField';
import Button from '../components/common/Button';

const PricingConfig = () => {
  const { execute: fetchPricing } = useAPI(apiService.getPricingConfig.bind(apiService));
  const [config, setConfig] = useState(initialPricingConfig);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const refreshData = async () => {
    try {
      const savedConfig = await fetchPricing();
      if (savedConfig && Object.keys(savedConfig).length > 0) {
        setConfig(savedConfig);
      }
    } catch (err) {
      console.warn('Could not fetch pricing config, using default', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleChange = (category, field, value) => {
    setConfig(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: parseFloat(value) || 0
      }
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const updatedConfig = {
      ...config,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    
    try {
      await apiService.updatePricingConfig(updatedConfig);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update pricing configuration');
      setTimeout(() => setError(''), 5000);
    }
  };

  return (
    <div className="app-container">
      <h1>Pricing Config (விலை கட்டமைப்பு)</h1>
      
      {success && (
        <div className="success-message">
          வெற்றிகரமாக சேமிக்கப்பட்டது (Successfully Saved)
        </div>
      )}
      {error && <div style={{ color: '#C53030', background: '#FFF5F5', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '0.85rem', textAlign: 'center', fontWeight: 'bold' }}>{error}</div>}

      <form onSubmit={handleSave}>
        <div className="card">
          <h3>Harvester Rates (அறுவடை இயந்திரம்)</h3>
          <InputField
            english="Tyre - Standard Rate (₹/hr)"
            tamil="டயர் - சாதாரண விகிதம்"
            type="number"
            value={config.harvester.tyre_standard}
            onChange={(e) => handleChange('harvester', 'tyre_standard', e.target.value)}
            required
          />
          <InputField
            english="Tyre - Wet Field Rate (₹/hr)"
            tamil="டயர் - நீர் நிலம் விகிதம்"
            type="number"
            value={config.harvester.tyre_wet_field}
            onChange={(e) => handleChange('harvester', 'tyre_wet_field', e.target.value)}
            required
          />
          <InputField
            english="Track - Fixed Rate (₹/hr)"
            tamil="டிராக் - விகிதம்"
            type="number"
            value={config.harvester.track}
            onChange={(e) => handleChange('harvester', 'track', e.target.value)}
            required
          />
        </div>

        <div className="card">
          <h3>Rental Rates (வாடகை இயந்திரங்கள்)</h3>
          <InputField
            english="Tractor Rate (₹/hr)"
            tamil="டிராக்டர் விகிதம்"
            type="number"
            value={config.rental.tractor}
            onChange={(e) => handleChange('rental', 'tractor', e.target.value)}
            required
          />
          <InputField
            english="Plough Tractor Rate (₹/hr)"
            tamil="உழவு டிராக்டர் விகிதம்"
            type="number"
            value={config.rental.plough_tractor}
            onChange={(e) => handleChange('rental', 'plough_tractor', e.target.value)}
            required
          />
          <InputField
            english="Trailer Rate (₹/trip)"
            tamil="ட்ரெய்லர் விகிதம்"
            type="number"
            value={config.rental.trailer}
            onChange={(e) => handleChange('rental', 'trailer', e.target.value)}
            required
          />
        </div>

        <div className="card">
          <h3>Diesel (டீசல்)</h3>
          <InputField
            english="Current Price Per Litre (₹)"
            tamil="டீசல் விலை / லிட்டர்"
            type="number"
            value={config.diesel.pricePerLitre}
            onChange={(e) => handleChange('diesel', 'pricePerLitre', e.target.value)}
            required
          />
        </div>

        <Button type="submit" fullWidth>
          அமைப்புகளைச் சேமிக்கவும் (SAVE CONFIG)
        </Button>
      </form>
    </div>
  );
};

export default PricingConfig;
