import { useState, useEffect } from 'react';
import socketService from '../services/socketService';

export const useOfflineMode = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [socketStatus, setSocketStatus] = useState('disconnected'); // 'connected' | 'disconnected'

  useEffect(() => {
    // 1. Browser Network Listeners
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 2. Socket Connection Listeners
    const unsubSocketStatus = socketService.subscribe('connection:status', (data) => {
      setSocketStatus(data.status);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubSocketStatus();
    };
  }, []);

  // Compute a comprehensive "App Status"
  const appStatus = isOffline 
    ? 'offline_network' 
    : (socketStatus === 'disconnected' ? 'offline_server' : 'online');

  return { isOffline, socketStatus, appStatus };
};

export default useOfflineMode;
