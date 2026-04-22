/**
 * Calculates duration between two time strings with an overnight guard.
 * @param {string} start - HH:mm format
 * @param {string} end - HH:mm format
 * @returns {number} - Duration in decimal hours
 */
export function getDuration(start, end) {
  if (!start || !end) return 0;
  
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  
  let startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;
  
  if (endMinutes <= startMinutes) {
    // Overnight guard: add 24 hours to end time
    endMinutes += 24 * 60;
  }
  
  const diffMinutes = endMinutes - startMinutes;
  return Math.round((diffMinutes / 60) * 100) / 100;
}
