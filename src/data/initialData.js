export const initialFarmers = [
  {
    id: 'F000',
    name: 'Own Farm',
    village: 'சொந்த ஊர்',
    phone: '',
    type: 'own'
  }
];

export const initialPricingConfig = {
  harvester: {
    tyre_standard: 2300,
    tyre_wet_field: 2700,
    track: 3000
  },
  rental: {
    tractor: 500,
    plough_tractor: 450,
    trailer: 300
  },
  diesel: {
    pricePerLitre: 102
  },
  lastUpdated: new Date().toISOString().split('T')[0]
};

export const initialDrivers = [
  {
    id: 'D001',
    name: 'Kumar',
    phone: '9876543210',
    pin: '1234',
    salaryRatePerHour: 150,
    active: true
  },
  {
    id: 'D002',
    name: 'Ravi',
    phone: '9876543211',
    pin: '4321',
    salaryRatePerHour: 150,
    active: true
  }
];
