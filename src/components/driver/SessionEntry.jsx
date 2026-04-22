import React from 'react';
import styles from './SessionEntry.module.css';
import Button from '../common/Button';

const SessionEntry = ({ index, session, onChange, onRemove }) => {
  return (
    <div className={styles.row}>
      <div className={styles.inputGroup}>
        <label className={styles.innerLabel}>Start (தொடக்கம்)</label>
        <input 
          type="time" 
          value={session.start} 
          onChange={(e) => onChange(index, 'start', e.target.value)}
          className={styles.timeInput}
        />
      </div>
      <div className={styles.inputGroup}>
        <label className={styles.innerLabel}>End (முடிவு)</label>
        <input 
          type="time" 
          value={session.end} 
          onChange={(e) => onChange(index, 'end', e.target.value)}
          className={styles.timeInput}
        />
      </div>
      <div className={styles.duration}>
        <span className={styles.durationLabel}>Hrs (ம)</span>
        <span className={styles.durationValue}>{session.durationHours || '0.00'}</span>
      </div>
      <div className={styles.removeAction}>
        <button 
          type="button" 
          className={styles.removeBtn}
          onClick={() => onRemove(index)}
          title="Remove Session"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default SessionEntry;
