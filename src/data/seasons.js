export const seasons = [
  { value: 'KUR', en: 'Kuruvai', ta: 'குறுவை' },
  { value: 'SAM', en: 'Samba', ta: 'சம்பா' },
  { value: 'THA', en: 'Thaladi', ta: 'தலடி' }
];

export const getSeasonLabel = (value) => {
  const season = seasons.find(s => s.value === value);
  return season ? `${season.en} (${season.ta})` : value;
};
