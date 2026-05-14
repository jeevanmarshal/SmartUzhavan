import { useEffect, useState } from 'react';
import socketService from '../services/socketService';

export const useRealTime = (entityType, initialData = []) => {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    // Make sure socket is connected
    socketService.connect();

    const handleCreated = (newItem) => {
      setData((prev) => [newItem, ...prev]);
    };

    const handleUpdated = (updatedItem) => {
      setData((prev) => 
        prev.map(item => item._id === updatedItem._id ? updatedItem : item)
      );
    };

    const handleDeleted = ({ id }) => {
      setData((prev) => prev.filter(item => item._id !== id));
    };

    // Subscribing to generic entity events
    // Assuming backend emits `${entityType}:created`, `${entityType}:updated`, etc.
    const unsubCreated = socketService.subscribe(`${entityType}:created`, handleCreated);
    const unsubUpdated = socketService.subscribe(`${entityType}:updated`, handleUpdated);
    const unsubDeleted = socketService.subscribe(`${entityType}:deleted`, handleDeleted);

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubDeleted();
    };
  }, [entityType]);

  // Provide a way to manually sync initial data or reset state
  const syncData = (newData) => {
    setData(newData);
  };

  return { data, syncData };
};

export default useRealTime;
