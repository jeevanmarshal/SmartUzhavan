import React, { useState, useEffect, useMemo } from 'react';
import { getData, getConfig, addRecord, addPayment as addJobPayment } from '../services/storage';
import { generateBillId } from '../services/billId';
import { generateId } from '../utils/idGenerator';
import { seasons } from '../data/seasons';
import { harvesterTypes } from '../data/machineTypes';
import { getPaymentStatus } from '../services/calculations';
import { formatCurrency } from '../utils/formatters';
import SelectField from '../components/common/SelectField';
import InputField from '../components/common/InputField';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import LogLinker from '../components/harvester/LogLinker';
import PaymentHistory from '../components/common/PaymentHistory';
import { generateHarvesterPDF } from '../services/pdfService';

const Harvester = () => {
  const [farmers, setFarmers] = useState([]);
  const [pricing, setPricing] = useState(null);
  const [allLogs, setAllLogs] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [success, setSuccess] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeJobId, setActiveJobId] = useState(null);

  const [formData, setFormData] = useState({
    farmerId: '',
    season: 'KUR',
    seasonYear: new Date().getFullYear(),
    machineType: 'tyre',
    wetField: false,
    ratePerHour: 0,
    linkedLogIds: [],
    discount: 0,
    additionalDiesel: 0,
    otherExpenses: []
  });

  useEffect(() => {
    setFarmers(getData('rl_farmers'));
    setPricing(getConfig('rl_pricing_config'));
    setAllLogs(getData('rl_driver_logs'));
    setAllJobs(getData('rl_harvester_jobs'));
  }, []);

  useEffect(() => {
    if (pricing) {
      let rate = 0;
      if (formData.machineType === 'tyre') {
        rate = formData.wetField 
          ? pricing.harvester.tyre_wet_field 
          : pricing.harvester.tyre_standard;
      } else {
        rate = pricing.harvester.track;
      }
      setFormData(prev => ({ ...prev, ratePerHour: rate }));
    }
  }, [formData.machineType, formData.wetField, pricing]);

  const availableLogs = useMemo(() => {
    if (!formData.farmerId) return [];
    const linkedIds = new Set();
    allJobs.forEach(job => {
      if (job.status !== 'cancelled') {
        job.linkedLogIds.forEach(id => linkedIds.add(id));
      }
    });

    return allLogs.filter(log => 
      log.farmerId === formData.farmerId && 
      log.machineType.includes(formData.machineType) &&
      !linkedIds.has(log.id)
    );
  }, [formData.farmerId, formData.machineType, allLogs, allJobs]);

  const selectedLogsData = allLogs.filter(l => formData.linkedLogIds.includes(l.id));
  const totalHours = selectedLogsData.reduce((sum, l) => sum + l.totalHours, 0);
  const dieselFromLogs = selectedLogsData.reduce((sum, l) => sum + l.diesel.total, 0);
  const grossAmount = totalHours * formData.ratePerHour;
  const finalAmount = Math.max(0, grossAmount - formData.discount);
  const totalExpense = dieselFromLogs + (parseFloat(formData.additionalDiesel) || 0);
  const netProfit = finalAmount - totalExpense;

  const handleToggleLog = (logId) => {
    setFormData(prev => {
      const ids = prev.linkedLogIds.includes(logId)
        ? prev.linkedLogIds.filter(id => id !== logId)
        : [...prev.linkedLogIds, logId];
      return { ...prev, linkedLogIds: ids };
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (formData.linkedLogIds.length === 0) {
      alert('Please link at least one driver log');
      return;
    }

    const billId = generateBillId(formData.season, formData.seasonYear);
    const jobRecord = {
      ...formData,
      id: generateId('rl_harvester_jobs'),
      billId,
      village: farmers.find(f => f.id === formData.farmerId)?.village || '',
      totalHours,
      grossAmount,
      finalAmount,
      dieselFromLogs,
      totalExpense,
      netProfit,
      payments: [],
      status: 'active'
    };

    addRecord('rl_harvester_jobs', jobRecord);
    setAllJobs(getData('rl_harvester_jobs'));
    setSuccess(true);
    setShowAddForm(false);
    
    setFormData(prev => ({
      ...prev,
      farmerId: '',
      linkedLogIds: [],
      discount: 0,
      additionalDiesel: 0
    }));

    setTimeout(() => setSuccess(false), 3000);
  };

  const handleAddPayment = (jobId, payment) => {
    addJobPayment('rl_harvester_jobs', jobId, payment);
    setAllJobs(getData('rl_harvester_jobs'));
  };

  return (
    <div className="app-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>அறுவடை மேலாண்மை (Harvester Management)</h1>
        {!showAddForm && <Button onClick={() => setShowAddForm(true)}>+ New Job</Button>}
      </div>

      {success && <div className="success-message">வெற்றிகரமாக சேமிக்கப்பட்டது (Successfully Saved)</div>}

      {showAddForm && (
        <form onSubmit={handleSave}>
          <div className="card">
            <SelectField 
              english="Farmer" tamil="விவசாயி" 
              options={farmers.map(f => ({ value: f.id, label: `${f.name} (${f.village})` }))}
              value={formData.farmerId}
              onChange={(e) => setFormData({ ...formData, farmerId: e.target.value, linkedLogIds: [] })}
              required
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <SelectField 
                english="Season" tamil="பருவம்" options={seasons}
                value={formData.season}
                onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                required
              />
              <InputField 
                english="Year" tamil="ஆண்டு" type="number"
                value={formData.seasonYear}
                onChange={(e) => setFormData({ ...formData, seasonYear: parseInt(e.target.value) })}
                required
              />
            </div>
            <SelectField 
              english="Machine Type" tamil="இயந்திர வகை" options={harvesterTypes}
              value={formData.machineType}
              onChange={(e) => setFormData({ ...formData, machineType: e.target.value, linkedLogIds: [] })}
              required
            />
            {formData.machineType === 'tyre' && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.wetField}
                    onChange={(e) => setFormData({ ...formData, wetField: e.target.checked })}
                  />
                  <span>Wet Field? (நீர் நிலமா?)</span>
                </label>
              </div>
            )}
            <InputField 
              english="Rate Per Hour" tamil="மணி நேர விலை" type="number"
              value={formData.ratePerHour}
              onChange={(e) => setFormData({ ...formData, ratePerHour: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>

          <div className="card">
            <LogLinker 
              logs={availableLogs}
              selectedIds={formData.linkedLogIds}
              onToggle={handleToggleLog}
              farmers={farmers}
            />
            <div style={{ marginTop: '10px', fontSize: '1.1rem', fontWeight: 'bold', color: '#1B3A6B' }}>
              Total Hours: {totalHours.toFixed(2)}
            </div>
          </div>

          <div className="card">
            <h3>Financials (நிதி)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <InputField english="Gross" tamil="மொத்தம்" value={grossAmount.toFixed(2)} readOnly />
              <InputField 
                english="Discount" tamil="தள்ளுபடி" type="number" value={formData.discount} 
                onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })} 
              />
            </div>
            <div style={{ padding: '10px', background: '#F0FFF4', borderRadius: '8px', margin: '10px 0' }}>
              <strong>Final Amount: ₹ {finalAmount.toFixed(2)}</strong>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <InputField english="Fuel Log" tamil="டீசல் (பதிவு)" value={dieselFromLogs.toFixed(2)} readOnly />
              <InputField 
                english="Extra Fuel" tamil="கூடுதல் டீசல்" type="number" value={formData.additionalDiesel} 
                onChange={(e) => setFormData({ ...formData, additionalDiesel: parseFloat(e.target.value) || 0 })} 
              />
            </div>
            <div style={{ marginTop: '10px', fontWeight: 'bold', color: netProfit >= 0 ? '#1A6B55' : '#C53030' }}>
              Net Profit: ₹ {netProfit.toFixed(2)}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
            <Button type="submit" fullWidth>Save Job (சேமி)</Button>
            <Button onClick={() => setShowAddForm(false)} variant="danger" fullWidth>Cancel (ரத்து)</Button>
          </div>
        </form>
      )}

      <div className="list-container">
        <h3>அறுவடை பதிவுகள் (Harvester Jobs)</h3>
        {allJobs.map(job => {
          const farmer = farmers.find(f => f.id === job.farmerId);
          const isExpanded = activeJobId === job.id;
          const status = getPaymentStatus(job.finalAmount, job.payments);
          
          return (
            <div key={job.id} className="card" onClick={() => setActiveJobId(isExpanded ? null : job.id)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{job.billId}</div>
                  <div style={{ fontSize: '0.85rem', color: '#718096' }}>{farmer?.name} | {job.season} {job.seasonYear}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                   <Badge status={status} />
                   <button 
                     onClick={(e) => { e.stopPropagation(); generateHarvesterPDF(job, farmer); }}
                     style={{ fontSize: '0.75rem', color: '#1B3A6B', border: '1px solid #1B3A6B', borderRadius: '4px', padding: '2px 8px', background: 'white', cursor: 'pointer' }}
                   >
                     PDF
                   </button>
                </div>
              </div>
              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>{job.totalHours.toFixed(2)} Hrs @ {job.ratePerHour}</span>
                <span>{formatCurrency(job.finalAmount)}</span>
              </div>

              {isExpanded && (
                <div onClick={(e) => e.stopPropagation()}>
                  <PaymentHistory 
                    payments={job.payments} 
                    totalAmount={job.finalAmount} 
                    onAddPayment={(p) => handleAddPayment(job.id, p)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Harvester;
