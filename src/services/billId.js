import { getData } from './storage';

export const SEASON_LABELS = {
  KUR: 'Kuruvai (குறுவை)',
  SAM: 'Samba (சம்பா)',
  THA: 'Thaladi (தலடி)',
};

export function generateBillId(season, year) {
  const jobs = getData('rl_harvester_jobs');
  // Only count active jobs for incrementing NNN; cancelled ones don't reuse numbers
  // This logic follows the SDLC: "cancelled jobs do NOT count toward NNN"
  const existingRecords = jobs.filter(j => 
    j.season === season && j.seasonYear === parseInt(year) && j.status !== 'cancelled'
  );
  
  const nnn = String(existingRecords.length + 1).padStart(3, '0');
  return `HB-${season}-${year}-${nnn}`;
}
