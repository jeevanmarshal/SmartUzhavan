import { getData } from '../services/storage';

const PREFIXES = {
  farmers: 'F',
  drivers: 'D',
  workers: 'W',
  driverLogs: 'LOG',
  harvesterJobs: 'HJ',
  rentalEntries: 'RNT',
  driverSalary: 'DSL',
  workEntries: 'WE',
  expenses: 'EXP',
  ownFarmIncome: 'OFI',
  lendingRecords: 'LND'
};

export function generateId(collectionKey) {
  const collection = getData(collectionKey);
  const prefix = PREFIXES[collectionKey.replace('rl_', '')] || 'ID';
  
  if (collection.length === 0) {
    return `${prefix}001`;
  }
  
  // Extract numbers from IDs and find the max
  const ids = collection.map(item => {
    const match = item.id.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  });
  
  const maxId = Math.max(...ids);
  return `${prefix}${String(maxId + 1).padStart(3, '0')}`;
}
