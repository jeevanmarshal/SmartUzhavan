import React from 'react';
import styles from './DieselInput.module.css';
import TamilLabel from '../common/TamilLabel';

const DieselInput = ({ mode, value, pricePerLitre, onChange }) => {
  return (
    <div className={styles.container}>
      <TamilLabel english="Diesel Mode" tamil="டீசல் முறை" />
      <div className={styles.radioGroup}>
        <label className={styles.radioLabel}>
          <input 
            type="radio" 
            name="dieselMode" 
            value="none" 
            checked={mode === 'none'} 
            onChange={(e) => onChange('mode', e.target.value)}
          />
          <span>None (இல்லை)</span>
        </label>
        <label className={styles.radioLabel}>
          <input 
            type="radio" 
            name="dieselMode" 
            value="rupees" 
            checked={mode === 'rupees'} 
            onChange={(e) => onChange('mode', e.target.value)}
          />
          <span>Rupees (₹)</span>
        </label>
        <label className={styles.radioLabel}>
          <input 
            type="radio" 
            name="dieselMode" 
            value="litres" 
            checked={mode === 'litres'} 
            onChange={(e) => onChange('mode', e.target.value)}
          />
          <span>Litres (லி)</span>
        </label>
      </div>

      {mode !== 'none' && (
        <div className={styles.inputs}>
          <div className={styles.inputField}>
            <label className={styles.smallLabel}>
              {mode === 'rupees' ? 'Amount (தொகை ₹)' : 'Litres (லிட்டர்)'}
            </label>
            <input 
              type="number" 
              value={value} 
              onChange={(e) => onChange('value', e.target.value)}
              className={styles.numInput}
            />
          </div>
          {mode === 'litres' && (
            <div className={styles.inputField}>
              <label className={styles.smallLabel}>Price/L (விலை/லி)</label>
              <input 
                type="number" 
                value={pricePerLitre} 
                className={styles.numInputDisabled}
                readOnly
              />
            </div>
          )}
        </div>
      )}
      
      {mode !== 'none' && (
        <div className={styles.total}>
          Total Diesel Cost: <strong>₹ {mode === 'rupees' ? value : (value * pricePerLitre || 0).toFixed(2)}</strong>
        </div>
      )}
    </div>
  );
};

export default DieselInput;
