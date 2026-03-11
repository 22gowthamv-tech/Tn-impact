import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../constants/api';
import { useSocket } from './useSocket';

export function useDriverData(driverId) {
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { on } = useSocket();
  const intervalRef = useRef(null);

  const fetchDriver = useCallback(async () => {
    if (!driverId) return;
    try {
      const res = await axios.get(`${BACKEND_URL}/drivers`);
      const found = res.data.find(d => d.id === driverId);
      if (found) {
        setDriver(found);
        setError(null);
      }
    } catch (err) {
      setError('Backend unreachable');
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  // Poll every 5 seconds for full driver data
  useEffect(() => {
    fetchDriver();
    intervalRef.current = setInterval(fetchDriver, 5000);
    return () => clearInterval(intervalRef.current);
  }, [fetchDriver]);

  // Listen to GPS updates for real-time position
  useEffect(() => {
    const unsub = on('gps_update', (data) => {
      if (data.driver_id === driverId) {
        setDriver(prev => prev ? {
          ...prev,
          lat: data.lat,
          lng: data.lng,
          status: data.status,
          progress: data.progress,
          current_stop: data.current_stop,
          total_stops: data.total_stops,
        } : prev);
      }
    });
    return unsub;
  }, [driverId, on]);

  // Listen to route updates
  useEffect(() => {
    const unsub = on('route_updated', (data) => {
      if (data.driver_id === driverId) {
        setDriver(prev => prev ? {
          ...prev,
          route: data.new_route,
          road_path: data.road_path,
          sequence: data.sequence,
          etas: data.etas,
          total_distance: data.total_distance,
        } : prev);
      }
    });
    return unsub;
  }, [driverId, on]);

  return { driver, loading, error, refetch: fetchDriver };
}
