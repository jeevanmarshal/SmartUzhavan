import React from 'react';
import styles from './Badge.module.css';

const Badge = ({ status }) => {
  const getLabel = (s) => {
    switch (s) {
      case 'pending': return 'Pending (நிலுவை)';
      case 'partial': return 'Partial (பகுதி)';
      case 'paid': return 'Paid (செலுத்தப்பட்டது)';
      default: return s;
    }
  };

  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      {getLabel(status)}
    </span>
  );
};

export default Badge;
