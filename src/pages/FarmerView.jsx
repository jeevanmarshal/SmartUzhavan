import React, { useState, useEffect, useMemo } from 'react';
import { getData } from '../services/storage';
import { formatCurrency } from '../utils/formatters';
import { getPaymentStatus } from '../services/calculations';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { generateHarvesterPDF, generateRentalPDF, generateStatementPDF } from '../services/pdfService';

const FarmerView = ({ userId }) => {
  const [jobs, setJobs] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [farmer, setFarmer] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const allFarmers = getData('rl_farmers');
    setFarmer(allFarmers.find(f => f.id === userId));

    const allJobs = getData('rl_harvester_jobs');
    setJobs(allJobs.filter(j => j.farmerId === userId && j.status !== 'cancelled'));

    const allRentals = getData('rl_rentals');
    setRentals(allRentals.filter(r => r.farmerId === userId));
  }, [userId]);

  const stats = useMemo(() => {
    const totalBill = jobs.reduce((s, j) => s + j.finalAmount, 0) + rentals.reduce((s, r) => s + r.totalAmount, 0);
    const totalPaidOverall = [...jobs, ...rentals].reduce((s, item) => s + (item.payments || []).reduce((pSum, p) => pSum + p.amount, 0), 0);
    
    // Logic for "Current Season Paid"
    // We'll define current season as the latest year found in the jobs
    const latestYear = Math.max(...jobs.map(j => j.seasonYear), new Date().getFullYear());
    const currentSeasonPaid = jobs
        .filter(j => j.seasonYear === latestYear)
        .reduce((s, j) => s + (j.payments || []).reduce((pSum, p) => pSum + p.amount, 0), 0);

    return {
      totalDue: totalBill - totalPaidOverall,
      currentSeasonPaid
    };
  }, [jobs, rentals]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="app-container">
      {/* Module 1: Refined Dashboard */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #1B3A6B 0%, #2D3748 100%)', color: 'white', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <h2 style={{ margin: 0 }}>{farmer?.name}</h2>
                <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Farmer ID: {farmer?.id}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{farmer?.village} | {farmer?.phone}</div>
            </div>
            <Button onClick={() => generateStatementPDF(farmer, jobs, rentals)} variant="secondary" style={{ fontSize: '0.75rem' }}>Statement PDF</Button>
        </div>
        
        <div style={{ marginTop: '25px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>நடப்பு பருவத்தில் செலுத்தியது (Current Paid)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{formatCurrency(stats.currentSeasonPaid)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>மொத்த நிலுவை தொகை (Overall Due)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#FEB2B2' }}>{formatCurrency(stats.totalDue)}</div>
          </div>
        </div>
      </div>

      {/* Module 2: Bill Details */}
      <div className="list-container">
        <h3>அறுவடை மற்றும் வாடகை விவரங்கள் (Bills & History)</h3>
        {[...jobs, ...rentals].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)).map(item => {
          const isJob = !!item.billId;
          const itemId = item.id;
          const isExpanded = expandedId === itemId;
          const paid = (item.payments || []).reduce((s, p) => s + p.amount, 0);
          const total = item.finalAmount || item.totalAmount;
          const status = getPaymentStatus(total, item.payments);

          return (
            <div key={itemId} className="card" style={{ cursor: 'pointer' }} onClick={() => toggleExpand(itemId)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{item.billId || item.machineType}</div>
                  <div style={{ fontSize: '0.8rem', color: '#718096' }}>{item.date || `${item.season} ${item.seasonYear}`}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                    <Badge status={status} />
                    <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            isJob ? generateHarvesterPDF(item, farmer) : generateRentalPDF(item, farmer); 
                        }}
                        style={{ fontSize: '0.7rem', background: 'transparent', border: '1px solid #1B3A6B', color: '#1B3A6B', padding: '2px 6px', borderRadius: '4px' }}
                    >
                        PDF
                    </button>
                </div>
              </div>

              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>Bill: {formatCurrency(total)}</span>
                <span style={{ color: '#C53030' }}>Due: {formatCurrency(total - paid)}</span>
              </div>

              {isExpanded && (
                <div style={{ marginTop: '15px', borderTop: '1px solid #E2E8F0', paddingTop: '10px' }} onClick={e => e.stopPropagation()}>
                    <h5 style={{ margin: '0 0 10px 0', fontSize: '0.85rem' }}>பணம் செலுத்திய விவரம் (Payment History)</h5>
                    {(item.payments || []).length === 0 ? (
                        <div style={{ fontSize: '0.8rem', color: '#A0AEC0' }}>No payments recorded.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {item.payments.map((p, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', background: '#F7FAFC', padding: '8px', borderRadius: '4px' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{p.date}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#718096' }}>{p.mode} {p.description ? `- ${p.description}` : ''}</div>
                                    </div>
                                    <div style={{ fontWeight: 'bold', color: '#38A169' }}>+{formatCurrency(p.amount)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FarmerView;
