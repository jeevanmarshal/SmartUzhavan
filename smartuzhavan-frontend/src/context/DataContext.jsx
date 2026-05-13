import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiService } from '../services/api';
import socketService from '../services/socketService';
import useOfflineMode from '../hooks/useOfflineMode';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const { appStatus } = useOfflineMode();
  
  const [dashboardSummary, setDashboardSummary] = useState({
    totalPending: 0,
    totalPaid: 0,
    totalExpenses: 0,
    activeDrivers: 0,
    pendingPayments: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetching from the API service which handles offline fallback internally
      const data = await apiService.getDashboardSummary();
      if (data) {
        setDashboardSummary(data);
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchDashboardData();

    // Ensure socket connection is active globally
    socketService.connect();

    // Subscribe to real-time global dashboard updates
    const unsubDashboard = socketService.subscribe('dashboard:summary_updated', (newData) => {
      setDashboardSummary(prev => ({ ...prev, ...newData }));
    });

    return () => {
      unsubDashboard();
    };
  }, [fetchDashboardData]);

  // Handle reconnect sync
  useEffect(() => {
    if (appStatus === 'online') {
      fetchDashboardData();
    }
  }, [appStatus, fetchDashboardData]);

  const value = {
    dashboardSummary,
    loading,
    error,
    appStatus,
    refreshDashboard: fetchDashboardData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export default DataContext;
