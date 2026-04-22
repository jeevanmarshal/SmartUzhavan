import React from 'react';

const TimePicker = ({ label, value, onChange }) => {
  // value is expected to be "HH:mm" (24h format from state)
  const [h24, m] = (value || '09:00').split(':');
  
  let hours = parseInt(h24);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const hStr = String(hours).padStart(2, '0');

  const handleTimeChange = (newH, newM, newAmpm) => {
    let h = parseInt(newH);
    if (newAmpm === 'PM' && h < 12) h += 12;
    if (newAmpm === 'AM' && h === 12) h = 0;
    
    const h24Str = String(h).padStart(2, '0');
    onChange(`${h24Str}:${newM}`);
  };

  const hourOptions = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minuteOptions = ['00', '15', '30', '45'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ fontSize: '0.75rem', color: '#718096', fontWeight: 'bold' }}>{label}</label>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <select 
          value={hStr} 
          onChange={(e) => handleTimeChange(e.target.value, m, ampm)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E0', background: 'white' }}
        >
          {hourOptions.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        <span>:</span>
        <select 
          value={m} 
          onChange={(e) => handleTimeChange(hStr, e.target.value, ampm)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E0', background: 'white' }}
        >
          {minuteOptions.map(min => <option key={min} value={min}>{min}</option>)}
        </select>
        <select 
          value={ampm} 
          onChange={(e) => handleTimeChange(hStr, m, e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E0', background: '#1B3A6B', color: 'white', fontWeight: 'bold' }}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
};

export default TimePicker;
