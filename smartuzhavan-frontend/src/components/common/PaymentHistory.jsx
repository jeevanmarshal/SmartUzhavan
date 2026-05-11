import React, { useState } from 'react';
import styles from './PaymentHistory.module.css';
import InputField from './InputField';
import SelectField from './SelectField';
import Button from './Button';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { sumPayments } from '../../services/calculations';

const PaymentHistory = ({ payments = [], totalAmount, onAddPayment }) => {
  const [showForm, setShowForm] = useState(false);
  const [newPayment, setNewPayment] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    mode: 'cash',
    notes: ''
  });

  const amountPaid = sumPayments(payments);
  const balance = totalAmount - amountPaid;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newPayment.amount || parseFloat(newPayment.amount) === 0) return;
    
    onAddPayment({
      ...newPayment,
      amount: parseFloat(newPayment.amount),
      id: `PAY-${Date.now()}`
    });
    
    setNewPayment({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      mode: 'cash',
      notes: ''
    });
    setShowForm(false);
  };

  const paymentModes = [
    { value: 'cash', en: 'Cash', ta: 'பணம்' },
    { value: 'bank', en: 'Bank Transfer', ta: 'வங்கி பரிமாற்றம்' },
    { value: 'upi', en: 'UPI (GPay/PhonePe)', ta: 'UPI' }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Payment History (பணம் செலுத்திய வரலாறு)</h3>
        <span className={styles.balanceSummary}>
          Balance: <strong>{formatCurrency(balance)}</strong>
        </span>
      </div>

      <div className={styles.historyList}>
        {payments.length === 0 ? (
          <div className={styles.empty}>No payments recorded yet.</div>
        ) : (
          payments.map((p, idx) => (
            <div key={p.id || idx} className={styles.paymentItem}>
              <div className={styles.paymentMain}>
                <span className={styles.pDate}>{formatDate(p.date)}</span>
                <span className={styles.pAmount}>{formatCurrency(p.amount)}</span>
              </div>
              <div className={styles.paymentSub}>
                <span className={styles.pMode}>Mode: {p.mode}</span>
                {p.notes && <span className={styles.pNotes}>{p.notes}</span>}
              </div>
            </div>
          ))
        )}
      </div>

      {!showForm ? (
        <Button onClick={() => setShowForm(true)} variant="outline" fullWidth>
          + Add Payment (பணம் சேர்க்க)
        </Button>
      ) : (
        <form onSubmit={handleSubmit} className={styles.addForm}>
          <InputField 
            english="Payment Date" 
            tamil="தேதி" 
            type="date" 
            value={newPayment.date}
            onChange={(e) => setNewPayment({...newPayment, date: e.target.value})}
            required 
          />
          <InputField 
            english="Amount (₹)" 
            tamil="தொகை" 
            type="number" 
            placeholder="Enter amount"
            value={newPayment.amount}
            onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
            required 
          />
          <SelectField 
            english="Mode" 
            tamil="முறை" 
            options={paymentModes}
            value={newPayment.mode}
            onChange={(e) => setNewPayment({...newPayment, mode: e.target.value})}
            required 
          />
          <InputField 
            english="Notes" 
            tamil="குறிப்பு" 
            value={newPayment.notes}
            onChange={(e) => setNewPayment({...newPayment, notes: e.target.value})}
          />
          <div className={styles.formActions}>
            <Button type="submit">Submit (சேமி)</Button>
            <Button onClick={() => setShowForm(false)} variant="danger">Cancel (ரத்து)</Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PaymentHistory;
