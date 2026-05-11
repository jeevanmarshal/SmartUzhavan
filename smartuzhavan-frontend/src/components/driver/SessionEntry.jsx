import React from 'react';
import styles from './SessionEntry.module.css';
import TimePicker from '../common/TimePicker';

const SessionEntry = ({ index, session, onChange, onRemove }) => {
  return (
    <div className={styles.row}>
      <div className={styles.inputGroup}>
        <TimePicker 
          label="Start (தொடக்கம்)" 
          value={session.start} 
          onChange={(val) => onChange(index, 'start', val)} 
        />
      </div>
      <div className={styles.inputGroup}>
        <TimePicker 
          label="End (முடிவு)" 
          value={session.end} 
          onChange={(val) => onChange(index, 'end', val)} 
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
