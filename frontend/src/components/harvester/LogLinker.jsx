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
          const logId = log._id || log.id;
          const isSelected = selectedIds.includes(logId);
          const farmer = farmers.find(f => (f._id || f.id) === log.farmerId);
          
          return (
            <div 
              key={logId} 
              className={`${styles.item} ${isSelected ? styles.selected : ''}`}
              onClick={() => onToggle(logId)}
            >
              <input 
                type="checkbox" 
                checked={isSelected} 
                onChange={() => {}} // Handled by div click
                readOnly 
              />
              <div className={styles.info}>
                <span className={styles.date}>{new Date(log.date).toLocaleDateString() || 'N/A'}</span>
                <span className={styles.hours}>{(parseFloat(log.totalDuration || log.totalHours) || 0).toFixed(2)} Hrs</span>
                <span className={styles.logId} title={log.billId}>{log.billId || logId.substring(0, 8)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LogLinker;
