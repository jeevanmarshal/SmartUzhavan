import React from 'react';
import TamilLabel from './TamilLabel';
import styles from './InputField.module.css';

const InputField = ({ 
  english, 
  tamil, 
  name, 
  type = 'text', 
  value, 
  onChange, 
  required, 
  placeholder, 
  error,
  readOnly,
  min,
  max,
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
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className={`${styles.input} ${error ? styles.inputError : ''}`}
        readOnly={readOnly}
        min={min}
        max={max}
      />
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
};

export default InputField;
