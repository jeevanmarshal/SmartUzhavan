import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/api';
import useAPI from '../hooks/useAPI';
import useRealTime from '../hooks/useRealTime';
import { generateBillId } from '../services/billId';
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
import { generateHarvesterPDF as pdfGenerateHarvester } from '../services/pdfService';

const Harvester = () => {
  const { data: farmersData } = useRealTime('Farmer', []);
  const { data: jobsData, syncData: setAllJobs } = useRealTime('HarvesterJob', []);
  const { data: logsData, syncData: setAllLogs } = useRealTime('DriverSalary', []); // DriverLog

  const { execute: fetchFarmers } = useAPI(apiService.getFarmers.bind(apiService));
  const { execute: fetchSettings } = useAPI(apiService.getSettings.bind(apiService));
  const { execute: fetchJobs } = useAPI(apiService.getHarvesterJobs.bind(apiService));
  const { execute: fetchLogs } = useAPI(apiService.getAllDriverSalaries.bind(apiService));

  const [farmers, setFarmers] = useState([]);
  const [pricing, setPricing] = useState(null);
  const [allLogs, setLogs] = useState([]);
  const [allJobs, setJobs] = useState([]);
  
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeJobId, setActiveJobId] = useState(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
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

  const refreshData = async () => {
    try {
      const [fData, sData, jData, lData] = await Promise.all([
        fetchFarmers(), fetchSettings(), fetchJobs(), fetchLogs()
      ]);
      setFarmers(Array.isArray(fData) ? fData : (fData?.farmers || fData?.data || []));
      setPricing(sData?.pricing || sData?.data?.pricing || null);
      
      const jobsArray = Array.isArray(jData) ? jData : (jData?.jobs || jData?.data || []);
      setJobs(jobsArray);
      setAllJobs(jobsArray);
      
      const logsArray = Array.isArray(lData) ? lData : (lData?.salaries || lData?.logs || lData?.data || []);
      setLogs(logsArray);
      setAllLogs(logsArray);
    } catch (err) {
      console.error('Data sync failed:', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (farmersData.length > 0) setFarmers(farmersData);
    if (jobsData.length > 0) setJobs(jobsData);
    if (logsData.length > 0) setLogs(logsData);
  }, [farmersData, jobsData, logsData]);

  useEffect(() => {
    if (pricing) {
      let rate = 0;
      if (formData.machineType === 'tyre') {
        rate = formData.wetField 
          ? pricing.harvester?.tyre_wet_field 
          : pricing.harvester?.tyre_standard;
      } else {
        rate = pricing.harvester?.track;
      }
      setFormData(prev => ({ ...prev, ratePerHour: rate || 0 }));
    }
  }, [formData.machineType, formData.wetField, pricing]);

  const availableLogs = useMemo(() => {
    if (!formData.farmerId) return [];
    const linkedIds = new Set();
    allJobs.forEach(job => {
      if (job.status !== 'cancelled' && job.linkedLogIds) {
        job.linkedLogIds.forEach(id => linkedIds.add(id._id || id));
      }
    });

    return allLogs.filter(log => 
      log.driver_id && 
      log.farmerId === formData.farmerId && 
      (log.machineType || '').includes(formData.machineType) &&
      !linkedIds.has(log._id)
    );
  }, [formData.farmerId, formData.machineType, allLogs, allJobs]);

  const selectedLogsData = allLogs.filter(l => formData.linkedLogIds.includes(l._id));
  const totalHours = selectedLogsData.reduce((sum, l) => sum + (parseFloat(l.totalDuration || l.totalHours) || 0), 0);
  const dieselFromLogs = selectedLogsData.reduce((sum, l) => sum + (parseFloat(l.diesel?.total) || 0), 0);
  const grossAmount = totalHours * (parseFloat(formData.ratePerHour) || 0);
  const finalAmount = Math.max(0, grossAmount - (parseFloat(formData.discount) || 0));
  
  const otherExpensesSum = formData.otherExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const totalExpense = dieselFromLogs + (parseFloat(formData.additionalDiesel) || 0) + otherExpensesSum;
  const netProfit = finalAmount - totalExpense;

  const handleAddOtherExpense = () => {
    setFormData({
      ...formData,
      otherExpenses: [...formData.otherExpenses, { label: '', amount: 0 }]
    });
  };

  const handleOtherExpenseChange = (index, field, value) => {
    const updated = [...formData.otherExpenses];
    updated[index][field] = value;
    setFormData({ ...formData, otherExpenses: updated });
  };

  const handleToggleLog = (logId) => {
    setFormData(prev => {
      const ids = prev.linkedLogIds.includes(logId)
        ? prev.linkedLogIds.filter(id => id !== logId)
        : [...prev.linkedLogIds, logId];
      return { ...prev, linkedLogIds: ids };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (formData.linkedLogIds.length === 0) {
      alert('Please link at least one driver log');
      return;
    }

    const billId = generateBillId(formData.season, formData.seasonYear, allJobs);
    const jobRecord = {
      ...formData,
      farmer_id: formData.farmerId,
      billId,
      village: farmers.find(f => f._id === formData.farmerId)?.village || '',
      totalHours,
      grossAmount,
      finalAmount,
      dieselFromLogs,
      otherExpensesSum,
      totalExpense,
      netProfit,
      payments: [],
      status: 'active'
    };

    try {
      const createdJobRes = await apiService.createHarvesterJob(jobRecord);
      const createdJob = createdJobRes.data || createdJobRes;
      
      // Use the unified service method for linking logs
      await apiService.linkLogs(createdJob._id, formData.linkedLogIds);
      
      await refreshData();
      
      setSuccess(true);
      setShowAddForm(false);
      
      setFormData(prev => ({
        ...prev,
        farmerId: '',
        linkedLogIds: [],
        discount: 0,
        additionalDiesel: 0,
        otherExpenses: []
      }));

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Error creating Harvester Job');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleAddPayment = async (jobId, payment) => {
    try {
      const job = allJobs.find(j => j._id === jobId);
      if (!job) return;
      const updatedPayments = [...(job.payments || []), payment];
      await apiService.updateHarvesterJob(jobId, { payments: updatedPayments });
      await refreshData();
    } catch (err) {
      alert('Failed to add payment: ' + err.message);
    }
  };
  
  const generateHarvesterPDF = async (job) => {
    try {
      const farmerId = job.farmer_id?._id || job.farmerId || job.farmer_id;
      const farmer = farmers.find(f => f._id === farmerId);
      await pdfGenerateHarvester(job, farmer);
    } catch (err) {
      alert('Error generating PDF: ' + err.message);
    }
  };

  return (
    <div className="app-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>அறுவடை மேலாண்மை (Harvester Management)</h1>
        {!showAddForm && <Button onClick={() => setShowAddForm(true)}>+ New Job</Button>}
      </div>

      {success && <div className="success-message">வெற்றிகரமாக சேமிக்கப்பட்டது (Successfully Saved)</div>}
      {error && <div style={{ color: '#C53030', background: '#FFF5F5', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '0.85rem', textAlign: 'center', fontWeight: 'bold' }}>{error}</div>}

      {showAddForm && (
        <form onSubmit={handleSave}>
          <div className="card">
            <InputField english="Date" tamil="தேதி" type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
            <SelectField 
              english="Farmer" tamil="விவசாயி" 
              options={farmers.map(f => ({ value: f._id, label: `${f.name} (${f.village})` }))}
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

            <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0 }}>Other Expenses (இதர செலவுகள்)</h4>
                    <button type="button" onClick={handleAddOtherExpense} style={{ background: '#1B3A6B', color: 'white', border: 'none', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>+ Add</button>
                </div>
                {formData.otherExpenses.map((exp, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 40px', gap: '10px', marginBottom: '10px' }}>
                        <input placeholder="Label (e.g. Mechanic)" value={exp.label} onChange={(e) => handleOtherExpenseChange(idx, 'label', e.target.value)} style={{ padding: '8px', border: '1px solid #CBD5E0', borderRadius: '4px' }} />
                        <input type="number" placeholder="Amount" value={exp.amount} onChange={(e) => handleOtherExpenseChange(idx, 'amount', e.target.value)} style={{ padding: '8px', border: '1px solid #CBD5E0', borderRadius: '4px' }} />
                        <button type="button" onClick={() => setFormData({...formData, otherExpenses: formData.otherExpenses.filter((_, i) => i !== idx)})} style={{ color: '#E53E3E', background: 'transparent', border: 'none', fontSize: '1.2rem' }}>×</button>
                    </div>
                ))}
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
            <Button type="button" onClick={() => setShowAddForm(false)} variant="danger" fullWidth>Cancel (ரத்து)</Button>
          </div>
        </form>
      )}

      <div className="list-container">
        <h3>அறுவடை பதிவுகள் (Harvester Jobs)</h3>
        {allJobs.map(job => {
          const farmerId = job.farmer_id?._id || job.farmerId || job.farmer_id;
          const farmerName = job.farmer_id?.name || farmers.find(f => f._id === farmerId)?.name || 'Unknown';
          const isExpanded = activeJobId === job._id;
          const status = getPaymentStatus(job.finalAmount, job.payments);
          
          return (
            <div key={job._id} className="card" onClick={() => setActiveJobId(isExpanded ? null : job._id)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{job.billId}</div>
                  <div style={{ fontSize: '0.85rem', color: '#718096' }}>{farmerName} | {job.season} {job.seasonYear}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                   <Badge status={status} />
                   <button 
                     onClick={(e) => { e.stopPropagation(); generateHarvesterPDF(job); }}
                     style={{ fontSize: '0.75rem', color: '#1B3A6B', border: '1px solid #1B3A6B', borderRadius: '4px', padding: '2px 8px', background: 'white', cursor: 'pointer' }}
                     title="PDF Generation pending API integration"
                   >
                     PDF
                   </button>
                </div>
              </div>
              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>{(job.totalHours || 0).toFixed(2)} Hrs @ {job.ratePerHour}</span>
                <span>{formatCurrency(job.finalAmount)}</span>
              </div>

              {isExpanded && (
                <div onClick={(e) => e.stopPropagation()}>
                  <div style={{ fontSize: '0.8rem', color: '#718096', margin: '10px 0', borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
                    <div>Fuel: {formatCurrency((job.dieselFromLogs||0) + (job.additionalDiesel||0))}</div>
                    <div>Other Exp: {formatCurrency(job.otherExpensesSum || 0)}</div>
                    <div style={{ fontWeight: 'bold', color: '#1A6B55' }}>Profit: {formatCurrency(job.netProfit)}</div>
                  </div>
                  <PaymentHistory 
                    payments={job.payments || []} 
                    totalAmount={job.finalAmount} 
                    onAddPayment={(p) => handleAddPayment(job._id, p)}
                  />
                </div>
              )}
            </div>
          );
        })}
        {allJobs.length === 0 && <p style={{textAlign: 'center', color: '#718096'}}>No jobs found.</p>}
      </div>
    </div>
  );
};

export default Harvester;
