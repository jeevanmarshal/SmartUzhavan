import { getDuration } from '../utils/timeUtils';

export function getHours(sessions) {
  if (!sessions || !Array.isArray(sessions)) return 0;
  return sessions.reduce((sum, s) => {
    const duration = getDuration(s.start, s.end);
    return sum + (isNaN(duration) ? 0 : duration);
  }, 0);
}

export function getDieselCost(mode, value, pricePerLitre) {
  if (mode === 'none') return 0;
  if (mode === 'litres') return (value || 0) * (pricePerLitre || 0);
  return value || 0; // 'rupees' mode
}

export function calcRent(hours, rate, discount = 0) {
  return Math.max(0, (hours * rate) - discount);
}

export function calcNetPay(salary, bonus, extra, advance) {
  return (salary + bonus + extra) - advance;
}

export function calcDriverSalary(hoursWorked, ratePerHour) {
  return Math.round(hoursWorked * ratePerHour * 100) / 100; // 2dp
}

export function sumPayments(payments = []) {
  if (!payments || !Array.isArray(payments)) return 0;
  return payments.reduce((sum, p) => sum + (p.amount || 0), 0);
}

export function getPaymentStatus(totalAmount, payments) {
  const paid = sumPayments(payments);
  const balance = totalAmount - paid;
  if (paid === 0) return 'pending';
  if (balance <= 0) return 'paid';
  return 'partial';
}

export function calcProfit(income, expense) {
  return income - expense;
}
