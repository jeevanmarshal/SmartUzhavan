import React from 'react';
import styles from './TamilLabel.module.css';

const TamilLabel = ({ english, tamil, htmlFor, required }) => {
  return (
    <label className={styles.label} htmlFor={htmlFor}>
      <span className={styles.english}>{english}</span>
      <span className={styles.tamil}> ({tamil})</span>
      {required && <span className={styles.required}> *</span>}
    </label>
  );
};

export default TamilLabel;
