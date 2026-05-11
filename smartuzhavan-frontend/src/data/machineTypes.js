export const machineTypes = {
  harvester_tyre: {
    en: 'Harvester (Tyre)',
    ta: 'அறுவடை இயந்திரம் (டயர்)'
  },
  harvester_track: {
    en: 'Harvester (Track)',
    ta: 'அறுவடை இயந்திரம் (டிராக்)'
  },
  tractor: {
    en: 'Tractor',
    ta: 'டிராக்டர்'
  },
  plough_tractor: {
    en: 'Plough Tractor',
    ta: 'உழவு டிராக்டர்'
  },
  trailer: {
    en: 'Trailer',
    ta: 'ட்ரெய்லர்'
  }
};

export const harvesterTypes = [
  { value: 'tyre', en: 'Tyre', ta: 'டயர்' },
  { value: 'track', en: 'Track', ta: 'டிராக்' }
];

export const rentalTypes = [
  { value: 'tractor', en: 'Tractor', ta: 'டிராக்டர்', unit: 'hour' },
  { value: 'plough_tractor', en: 'Plough Tractor', ta: 'உழவு டிராக்டர்', unit: 'hour' },
  { value: 'trailer', en: 'Trailer', ta: 'ட்ரெய்லர்', unit: 'trip' },
  { value: 'water', en: 'Water Rental', ta: 'தண்ணீர் குத்தகை', unit: 'season' }
];
