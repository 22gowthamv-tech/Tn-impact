import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../constants/api';

let sharedSocket = null;

function getSocket() {
  if (!sharedSocket) {
    sharedSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return sharedSocket;
}

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (socket.connected) setConnected(true);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const on = useCallback((event, handler) => {
    const socket = socketRef.current;
    if (socket) socket.on(event, handler);
    return () => { if (socket) socket.off(event, handler); };
  }, []);

  const emit = useCallback((event, data) => {
    const socket = socketRef.current;
    if (socket) socket.emit(event, data);
  }, []);

  return { socket: socketRef.current, connected, on, emit };
}
