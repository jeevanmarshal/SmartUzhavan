import React from 'react';
import TamilLabel from './TamilLabel';
import styles from './InputField.module.css'; // Reusing styles

const SelectField = ({ 
  english, 
  tamil, 
  name, 
  value, 
  onChange, 
  required, 
  options = [], 
  error,
  id
}) => {
  const inputId = id || `id-${name}`;
  
  return (
    <div className={styles.container}>
      <TamilLabel 
        english={english} 
        tamil={tamil} 
        htmlFor={inputId} 
        required={required} 
      />
      <select
        id={inputId}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={`${styles.input} ${error ? styles.inputError : ''}`}
      >
        <option value="">-- Select / தேர்ந்தெடு --</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label || `${opt.en} (${opt.ta})`}
          </option>
        ))}
      </select>
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
};

export default SelectField;
