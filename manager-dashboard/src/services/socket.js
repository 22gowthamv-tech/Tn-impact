import { io } from 'socket.io-client';
import { SOCKET_URL } from '../constants/api';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('✅ Socket.IO connected');
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket.IO disconnected');
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ Socket.IO connection error:', err.message);
    });
  }

  return socket;
}
