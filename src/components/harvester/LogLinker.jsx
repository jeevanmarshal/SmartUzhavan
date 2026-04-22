import React from 'react';
import styles from './LogLinker.module.css';

const LogLinker = ({ logs, selectedIds, onToggle, farmers }) => {
  if (logs.length === 0) {
    return <div className={styles.empty}>No logs found for this farmer/machine.</div>;
  }

  return (
    <div className={styles.container}>
      <label className={styles.label}>Select Driver Logs (பதிவுகளைத் தேர்ந்தெடுக்கவும்)</label>
      <div className={styles.list}>
        {logs.map(log => {
          const isSelected = selectedIds.includes(log.id);
          const farmer = farmers.find(f => f.id === log.farmerId);
          
          return (
            <div 
              key={log.id} 
              className={`${styles.item} ${isSelected ? styles.selected : ''}`}
              onClick={() => onToggle(log.id)}
            >
              <input 
                type="checkbox" 
                checked={isSelected} 
                onChange={() => {}} // Handled by div click
                readOnly 
              />
              <div className={styles.info}>
                <span className={styles.date}>{log.date || 'N/A'}</span>
                <span className={styles.hours}>{(parseFloat(log.totalHours) || 0).toFixed(2)} Hrs</span>
                <span className={styles.logId}>{log.id}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LogLinker;
