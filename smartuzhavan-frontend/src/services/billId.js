import { getData } from './storage';

export const SEASON_LABELS = {
  KUR: 'Kuruvai (குறுவை)',
  SAM: 'Samba (சம்பா)',
  THA: 'Thaladi (தலடி)',
};

// Harvester Job Bill ID (HB-SS-YYYY-NNN)
export function generateBillId(season, year) {
  const jobs = getData('rl_harvester_jobs');
  const existingRecords = jobs.filter(j => 
    j.season === season && j.seasonYear === parseInt(year) && j.status !== 'cancelled'
  );
  
  const nnn = String(existingRecords.length + 1).padStart(3, '0');
  return `HB-${season}-${year}-${nnn}`;
}

// Driver Log Bill ID (Bill-YYYY-SS-NNN)
export function generateLogBillId(year) {
  const logs = getData('rl_driver_logs');
  const currentYear = parseInt(year) || new Date().getFullYear();
  
  // Count logs for this year to generate NNN
  const yearLogs = logs.filter(l => {
    const logDate = new Date(l.date);
    return logDate.getFullYear() === currentYear;
  });

  const nnn = String(yearLogs.length + 1).padStart(3, '0');
  
  // SS mapping: We'll use 01 as default or derive from month if needed.
  // For simplicity and following the example 'Bill-2026-01-001', we'll use '01' for now.
  const ss = '01'; 
  
  return `Bill-${currentYear}-${ss}-${nnn}`;
}
