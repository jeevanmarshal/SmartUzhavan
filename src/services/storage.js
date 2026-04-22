export function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function getData(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading ${key} from LocalStorage:`, error);
    return [];
  }
}

export function getConfig(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error(`Error reading ${key} from LocalStorage:`, error);
    return {};
  }
}

export function addRecord(key, record) {
  const list = getData(key);
  list.push(record);
  saveData(key, list);
}

export function updateRecord(key, id, updated) {
  const list = getData(key);
  const idx = list.findIndex(r => r.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updated };
    saveData(key, list);
  }
}

export function deleteRecord(key, id) {
  const list = getData(key);
  saveData(key, list.filter(r => r.id !== id));
}

export function addPayment(key, recordId, payment) {
  const list = getData(key);
  const record = list.find(r => r.id === recordId);
  if (record) {
    if (!record.payments) record.payments = [];
    record.payments.push(payment);
    saveData(key, list);
  }
}
