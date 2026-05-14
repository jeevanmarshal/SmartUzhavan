import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/api';
import useAPI from '../hooks/useAPI';
import useRealTime from '../hooks/useRealTime';
import { machineTypes } from '../data/machineTypes';
import SelectField from '../components/common/SelectField';
import InputField from '../components/common/InputField';
import Button from '../components/common/Button';
import SessionEntry from '../components/driver/SessionEntry';
import DieselInput from '../components/driver/DieselInput';
import { getHours, getDieselCost } from '../services/calculations';
import { getDuration } from '../utils/timeUtils';
import { generateLogBillId } from '../services/billId';

const DriverEntry = ({ userId }) => {
  const { data: farmersData } = useRealTime('Farmer', []);
  const { data: driversData } = useRealTime('Driver', []);
  const { data: allLogsData, syncData: setAllLogs } = useRealTime('DriverSalary', []);
  const { data: jobsData } = useRealTime('HarvesterJob', []);

  const { execute: fetchFarmers } = useAPI(apiService.getFarmers.bind(apiService));
  const { execute: fetchDrivers } = useAPI(apiService.getDrivers.bind(apiService));
  const { execute: fetchLogs } = useAPI(apiService.getAllDriverSalaries.bind(apiService));
  const { execute: fetchJobs } = useAPI(apiService.getHarvesterJobs.bind(apiService));
  const { execute: fetchSettings } = useAPI(apiService.getSettings.bind(apiService));

  const [farmers, setFarmers] = useState([]);
  const [allLogs, setLogs] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [dieselPrice, setDieselPrice] = useState(0);

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [editingLog, setEditingLog] = useState(null);
  const [confirmMsg, setConfirmMsg] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  // Admin filters
  const [filterDriver, setFilterDriver] = useState('all');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [filterMachine, setFilterMachine] = useState('all');
  
  const [formData, setFormData] = useState({
    driver_id: userId || '',
    machineType: 'harvester_tyre',
    farmerId: '',
    date: new Date().toISOString().split('T')[0],
    sessions: [{ start: '', end: '', durationHours: 0 }],
    diesel: { mode: 'none', value: 0, pricePerLitre: 0, total: 0 }
  });

  const refreshData = async () => {
    try {
      const [fData, dData, lData, jData, sData] = await Promise.all([
        fetchFarmers(), fetchDrivers(), fetchLogs(), fetchJobs(), fetchSettings()
      ]);
      setFarmers(fData?.data || fData || []);
      setDrivers(dData?.data || dData || []);
      
      const logsArray = lData?.data || lData || [];
      setLogs(logsArray);
      setAllLogs(logsArray);
      
      setJobs(jData?.data || jData || []);

      const price = sData?.data?.pricing?.diesel?.pricePerLitre || 80;
      setDieselPrice(price);
      
      if (!editingLog) {
        setFormData(prev => ({
          ...prev,
          driver_id: userId || prev.driver_id,
          diesel: { ...prev.diesel, pricePerLitre: price }
        }));
      }
    } catch (err) {
      console.error('Data sync failed:', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, [userId]);

  // Keep local state in sync with real-time state
  useEffect(() => {
    if (farmersData.length > 0) setFarmers(farmersData);
    if (driversData.length > 0) setDrivers(driversData);
    if (allLogsData.length > 0) setLogs(allLogsData);
    if (jobsData.length > 0) setJobs(jobsData);
  }, [farmersData, driversData, allLogsData, jobsData]);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSessionChange = (index, field, value) => {
    const newSessions = [...formData.sessions];
    newSessions[index][field] = value;
    const { start, end } = newSessions[index];
    if (start && end) {
      newSessions[index].durationHours = getDuration(start, end);
    } else {
      newSessions[index].durationHours = 0;
    }
    setFormData(prev => ({ ...prev, sessions: newSessions }));
  };

  const totalHours = getHours(formData.sessions);

  const addSession = () => {
    setFormData(prev => ({
      ...prev,
      sessions: [...prev.sessions, { start: '', end: '', durationHours: 0 }]
    }));
  };

  const removeSession = (index) => {
    if (formData.sessions.length > 1) {
      setFormData(prev => ({
        ...prev,
        sessions: prev.sessions.filter((_, i) => i !== index)
      }));
    }
  };

  const handleDieselChange = (field, value) => {
    setFormData(prev => {
      const newDiesel = { ...prev.diesel, [field]: value };
      newDiesel.total = getDieselCost(newDiesel.mode, newDiesel.value, dieselPrice);
      return { ...prev, diesel: newDiesel };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.driver_id) {
      setError('Please select a driver (ஓட்டுநரை தேர்ந்தெடுக்கவும்)');
      return;
    }
    
    const newLog = {
      ...formData,
      totalDuration: totalHours,
      source: 'driver_log',
      status: 'submitted'
    };

    try {
      if (editingLog) {
        await apiService.updateDriverSalary(editingLog._id, newLog);
        
        // Cascade to Harvester Jobs
        const linkedJob = jobs.find(j => j.linkedLogIds && j.linkedLogIds.includes(editingLog._id));
        if (linkedJob) {
          const allLinkedLogs = allLogs.filter(l => linkedJob.linkedLogIds.includes(l._id));
          // Substitute the edited log's new value in calculation since state hasn't updated yet
          const newTotalHours = allLinkedLogs.reduce((sum, l) => sum + (l._id === editingLog._id ? totalHours : l.totalDuration), 0);
          const newGross = newTotalHours * linkedJob.ratePerHour;
          const newFinal = Math.max(0, newGross - linkedJob.discount);
          const newDieselFromLogs = allLinkedLogs.reduce((sum, l) => sum + (l._id === editingLog._id ? (newLog.diesel?.total||0) : (l.diesel?.total||0)), 0);
          
          await apiService.updateHarvesterJob(linkedJob._id, {
            totalHours: newTotalHours,
            grossAmount: newGross,
            finalAmount: newFinal,
            dieselFromLogs: newDieselFromLogs,
          });
        }
        setEditingLog(null);
      } else {
        newLog.billId = generateLogBillId(new Date(formData.date).getFullYear(), allLogs);
        await apiService.createDriverSalary(newLog.driver_id, newLog);
      }

      await refreshData();
      setSuccess(true);
      setFormData({
        driver_id: userId || '',
        machineType: 'harvester_tyre',
        farmerId: '',
        date: new Date().toISOString().split('T')[0],
        sessions: [{ start: '', end: '', durationHours: 0 }],
        diesel: { mode: 'none', value: 0, pricePerLitre: dieselPrice, total: 0 }
      });

      setTimeout(() => { setSuccess(false); setError(''); }, 3000);
    } catch (err) {
      setError(err.message || 'Error saving log');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleEdit = (log) => {
    setEditingLog(log);
    setFormData({
      driver_id: log.driver_id,
      machineType: log.machineType,
      farmerId: log.farmerId,
      date: new Date(log.date).toISOString().split('T')[0],
      sessions: log.sessions || [{ start: '', end: '', durationHours: 0 }],
      diesel: log.diesel || { mode: 'none', value: 0, pricePerLitre: dieselPrice, total: 0 }
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteLog = (logId) => {
    const linkedJob = jobs.find(j => j.linkedLogIds && j.linkedLogIds.includes(logId));
    if (linkedJob) {
      const hasPaid = linkedJob.payments && linkedJob.payments.length > 0;
      if (hasPaid) {
        setError('இந்த பதிவு ஒரு செலுத்தப்பட்ட அறுவடை வேலையுடன் இணைக்கப்பட்டுள்ளது. நீக்க முடியாது. (This log is linked to a harvester job that has payments recorded.)');
        return;
      } else {
        setConfirmMsg('இந்த பதிவை நீக்குவது அறுவடை வேலையிலிருந்து தொடர்பை அகற்றும். தொடரவா?');
        setPendingDeleteId(logId);
        return;
      }
    }
    setConfirmMsg('இந்த பதிவை நீக்க விரும்புகிறீர்களா?');
    setPendingDeleteId(logId);
  };

  const handleConfirmDelete = async () => {
    try {
      await apiService.deleteDriverSalary(pendingDeleteId);
      
      // Unlink from job and recalculate
      const linkedJobs = jobs.filter(job => job.linkedLogIds && job.linkedLogIds.includes(pendingDeleteId));
      for (let job of linkedJobs) {
        const newIds = job.linkedLogIds.filter(id => id !== pendingDeleteId);
        const allLinkedLogs = allLogs.filter(l => newIds.includes(l._id));
        const newTotalHours = allLinkedLogs.reduce((sum,l)=>sum+l.totalDuration,0);
        const newGross = newTotalHours * job.ratePerHour;
        const newFinal = Math.max(0, newGross - job.discount);
        const newDieselFromLogs = allLinkedLogs.reduce((sum,l)=>sum+(l.diesel?.total||0),0);
        
        await apiService.updateHarvesterJob(job._id, { 
          linkedLogIds: newIds,
          totalHours: newTotalHours,
          grossAmount: newGross,
          finalAmount: newFinal,
          dieselFromLogs: newDieselFromLogs,
        });
      }
      
      setPendingDeleteId(null);
      setConfirmMsg('');
      await refreshData();
    } catch (err) {
      setError('Error deleting log: ' + err.message);
    }
  };

  const machineOptions = Object.keys(machineTypes).map(key => ({
    value: key,
    label: `${machineTypes[key].en} (${machineTypes[key].ta})`
  }));

  const driverOptions = drivers.map(d => ({ value: d._id, label: d.name }));
  const farmerOptions = farmers.map(f => ({ value: f._id, label: `${f.name} (${f.village})` }));

  const logsToDisplay = useMemo(() => {
    if (userId) {
      const today = new Date().toISOString().split('T')[0];
      return allLogs.filter(l => new Date(l.date).toISOString().split('T')[0] === today && l.driver_id === userId);
    } else {
      return allLogs.filter(l => {
        const lDate = new Date(l.date).toISOString().split('T')[0];
        const matchDriver = filterDriver === 'all' || l.driver_id === filterDriver;
        const matchFrom = !filterFromDate || lDate >= filterFromDate;
        const matchTo = !filterToDate || lDate <= filterToDate;
        const matchMachine = filterMachine === 'all' || l.machineType === filterMachine;
        return matchDriver && matchFrom && matchTo && matchMachine;
      });
    }
  }, [allLogs, userId, filterDriver, filterFromDate, filterToDate, filterMachine]);

  return (
    <div className="app-container">
      <h1>ஓட்டுநர் பதிவு (Driver Entry)</h1>
      {success && <div className="success-message">வெற்றிகரமாக சேமிக்கப்பட்டது (Successfully Saved)</div>}
      {error && <div style={{ color: '#C53030', background: '#FFF5F5', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '0.85rem', textAlign: 'center', fontWeight: 'bold' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="card">
          {editingLog ? (
            <div style={{ marginBottom: '15px', padding: '10px', background: '#EBF8FF', color: '#2B6CB0', borderRadius: '4px', fontWeight: 'bold' }}>
              Editing Log: {editingLog.billId || 'Unbilled'}
            </div>
          ) : null}
          
          <div style={{ marginBottom: '15px' }}>
            {!userId ? (
              <SelectField 
                english="Driver" tamil="ஓட்டுநர்" 
                options={driverOptions}
                value={formData.driver_id}
                onChange={(e) => handleFieldChange('driver_id', e.target.value)}
                required
              />
            ) : (
              <div style={{ padding: '10px', background: '#EDF2F7', borderRadius: '4px', fontSize: '0.9rem', color: '#4A5568' }}>
                <strong>Driver:</strong> {drivers.find(d => d._id === userId)?.name || 'N/A'}
              </div>
            )}
          </div>
          
          <SelectField 
            english="Machine Type" tamil="இயந்திர வகை"
            value={formData.machineType}
            onChange={(e) => handleFieldChange('machineType', e.target.value)}
            options={machineOptions}
            required
          />
          <SelectField 
            english="Farmer Name" tamil="விவசாயி"
            value={formData.farmerId}
            onChange={(e) => handleFieldChange('farmerId', e.target.value)}
            options={farmerOptions}
            required
          />
          <InputField 
            english="Date" tamil="தேதி" type="date"
            value={formData.date}
            onChange={(e) => handleFieldChange('date', e.target.value)}
            required
          />
        </div>

        <div className="card">
          <h3>வேலை நேரம் (Work Sessions)</h3>
          {formData.sessions.map((session, index) => (
            <SessionEntry 
              key={index} index={index} session={session}
              onChange={handleSessionChange} onRemove={removeSession}
            />
          ))}
          <div style={{ marginTop: '10px' }}>
            <Button type="button" onClick={addSession} variant="outline" fullWidth>+ Add Session (கூடுதல் நேரம்)</Button>
          </div>
          <div style={{ marginTop: '20px', textAlign: 'right', fontWeight: '700', color: '#1B3A6B', fontSize: '1.2rem' }}>
            Total Hours: {totalHours.toFixed(2)}
          </div>
        </div>

        <div className="card">
          <DieselInput 
            mode={formData.diesel.mode} value={formData.diesel.value}
            pricePerLitre={formData.diesel.pricePerLitre} onChange={handleDieselChange}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button type="submit" fullWidth>{editingLog ? 'Update Log (பதிவை புதுப்பி)' : 'பதிவு செய்க (SAVE LOG)'}</Button>
          {editingLog && (
            <Button type="button" onClick={() => { setEditingLog(null); setFormData({...formData, sessions:[{start:'', end:'', durationHours:0}]}); }} variant="danger" fullWidth>Cancel (ரத்து)</Button>
          )}
        </div>
      </form>

      {confirmMsg && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#FFF5F5', border: '1px solid #FC8181', borderRadius: '8px' }}>
          <div style={{ color: '#C53030', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>
            {confirmMsg}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button onClick={handleConfirmDelete} fullWidth variant="danger">Yes, Delete (ஆம்)</Button>
            <Button onClick={() => { setConfirmMsg(''); setPendingDeleteId(null); }} fullWidth variant="outline">Cancel (ரத்து)</Button>
          </div>
        </div>
      )}

      <div style={{ marginTop: '30px' }}>
        <h3>{!userId ? 'All Logs (அனைத்து பதிவுகள்)' : 'இன்றைய பதிவுகள் (Today\'s Logs)'}</h3>
        
        {!userId && (
          <div className="card" style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#4A5568' }}>Filters (வடிகட்டி)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <SelectField options={[{value:'all', label:'All Drivers'}].concat(driverOptions)} value={filterDriver} onChange={e=>setFilterDriver(e.target.value)} />
              <SelectField options={[{value:'all', label:'All Machines'}].concat(machineOptions)} value={filterMachine} onChange={e=>setFilterMachine(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input type="date" value={filterFromDate} onChange={e=>setFilterFromDate(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E0', width: '100%' }} />
              <input type="date" value={filterToDate} onChange={e=>setFilterToDate(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E0', width: '100%' }} />
            </div>
          </div>
        )}

        <div style={{ marginBottom: '10px', color: '#718096', fontSize: '0.9rem' }}>Showing {logsToDisplay.length} entries</div>

        {logsToDisplay.map(log => (
          <div key={log._id} className="card" style={{ padding: '15px', borderLeft: '4px solid #1B3A6B' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <strong>{log.billId || 'Unbilled'}</strong> <span style={{ color: '#718096', fontSize: '0.8rem' }}>| {new Date(log.date).toLocaleDateString()}</span>
                <div style={{ fontSize: '0.85rem', color: '#4a5568', marginTop: '5px' }}>
                  Farmer: {farmers.find(f => f._id === log.farmerId)?.name} <br/>
                  Driver: {drivers.find(d => d._id === log.driver_id)?.name} <br/>
                  Machine: {machineTypes[log.machineType]?.en}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#1A6B55', fontWeight: 'bold', fontSize: '1.1rem' }}>{(log.totalDuration || 0).toFixed(2)} Hrs</div>
              </div>
            </div>
            
            {!userId && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #E2E8F0' }}>
                <button onClick={() => handleEdit(log)} style={{ background: 'none', border: 'none', color: '#3182CE', cursor: 'pointer', fontWeight: 'bold' }}>Edit (திருத்து)</button>
                <button onClick={() => handleDeleteLog(log._id)} style={{ background: 'none', border: 'none', color: '#C53030', cursor: 'pointer', fontWeight: 'bold' }}>Delete (நீக்கு)</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DriverEntry;
