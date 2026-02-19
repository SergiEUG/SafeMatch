/* import { ref, onUnmounted, type Ref } from 'vue';
import { io } from 'socket.io-client';

console.log('[useSocket] composable loaded');


const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

// Define a custom interface that matches the *actual* public API of the Socket object we use
// This bypasses the overly strict internal properties defined in the library's Socket type
interface PublicSocket {
  connected: boolean;
  on(event: string, callback: (...args: any[]) => void): void;
  off(event: string, callback?: (...args: any[]) => void): void;
  emit(event: string, data?: any, callback?: (...args: any[]) => void): void;
  disconnect(): void;
  id: string | null; // Add id property as it's often used
  // Add other properties if you actually use them from the Socket instance
  io: any; // Allow any for internal io object to avoid deep type issues
}

// Use this CustomSocket type for socketInstance
const socketInstance = ref<PublicSocket | null>(null);

// Explicitly define the return type of the composable
interface UseSocketReturn {
  socket: Ref<PublicSocket | null>; // Use PublicSocket here
  isConnected: Ref<boolean>;
  error: Ref<string | null>;
  connect: (token: string) => PublicSocket | null | undefined; // Use PublicSocket here
  disconnect: () => void;
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback?: (...args: any[]) => void) => void;
}

export function useSocket(): UseSocketReturn { // Use the explicit interface
  const isConnected = ref(false);
  const error = ref<string | null>(null);

  function connect(token: string): PublicSocket | null | undefined { // Added return type
    if (socketInstance.value?.connected) { // Access value
      console.log('Socket already connected');
      return socketInstance.value;
    }

    try {
      socketInstance.value = io(SOCKET_URL, { // Assign to value
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      }) as PublicSocket; // Cast to PublicSocket

      socketInstance.value.on('connect', () => { // Access value
        console.log('✅ Socket connected - useSocket.ts');
        isConnected.value = true;
        console.log('isConnected set to true - useSocket.ts');
        error.value = null;
      });

      socketInstance.value.on('disconnect', (reason) => { // Access value
        console.log('❌ Socket disconnected with reason:', reason, '- useSocket.ts');
        isConnected.value = false;
        console.log('isConnected set to false - useSocket.ts');
      });

      socketInstance.value.on('connect_error', (err) => { // Access value
        console.error('Socket connection error:', err, '- useSocket.ts');
        error.value = err.message;
        isConnected.value = false;
        console.log('isConnected set to false due to error - useSocket.ts');
      });

      return socketInstance.value;
    } catch (err: any) {
      console.error('Failed to create socket:', err);
      error.value = err.message;
      return null;
    }
  }

  function disconnect() {
    if (socketInstance.value) { // Access value
      socketInstance.value.disconnect(); // Access value
      socketInstance.value = null; // Set value to null
      isConnected.value = false;
    }
  }

  function emit(event: string, data?: any) {
    if (socketInstance.value?.connected) { // Access value
      socketInstance.value.emit(event, data); // Access value
    } else {
      console.warn(`Cannot emit ${event}: socket not connected`);
    }
  }

  function on(event: string, callback: (...args: any[]) => void) {
    if (socketInstance.value) { // Access value
      socketInstance.value.on(event, callback); // Access value
    }
  }

  function off(event: string, callback?: (...args: any[]) => void) {
    if (socketInstance.value) { // Access value
      socketInstance.value.off(event, callback); // Access value
    }
  }

  onUnmounted(() => {
    // NO desconnectem automàticament perquè pot ser compartit
    // El component principal (App.vue) s'encarregarà del lifecycle
  });

  return {
    socket: socketInstance, // Return the Ref directly
    isConnected,
    error,
    connect,
    disconnect,
    emit,
    on,
    off,
  };
}

// Export singleton per accedir a la instància desde qualsevol lloc
export function getSocketInstance(): PublicSocket | null { // Use PublicSocket here
  return socketInstance.value; // Access value
}
*/


import { ref, onUnmounted, type Ref } from 'vue';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

interface PublicSocket {
  connected: boolean;
  on(event: string, callback: (...args: any[]) => void): void;
  off(event: string, callback?: (...args: any[]) => void): void;
  emit(event: string, data?: any, callback?: (...args: any[]) => void): void;
  disconnect(): void;
  id: string | null;
  io: any;
}

const socketInstance = ref<PublicSocket | null>(null);
const _hasBeenManuallyDisconnected = ref(false); // New flag

let connectPromise: Promise<PublicSocket | null>;
let resolveConnect: ((socket: PublicSocket | null) => void) | null = null;

function createConnectPromise() {
  connectPromise = new Promise((resolve) => {
    resolveConnect = resolve;
  });
}

createConnectPromise(); // Initialize on module load

interface UseSocketReturn {
  socket: Ref<PublicSocket | null>;
  isConnected: Ref<boolean>;
  error: Ref<string | null>;
  connect: (token: string) => void;
  disconnect: () => void;
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback?: (...args: any[]) => void) => void;
  onConnect: () => Promise<PublicSocket | null>;
}

export function useSocket(): UseSocketReturn {
  const isConnected = ref(false);
  const error = ref<string | null>(null);

  function connect(token: string): void {
    if (socketInstance.value?.connected) {
      console.debug('Socket already connected.');
      if (resolveConnect) resolveConnect(socketInstance.value);
      return;
    }

    if (_hasBeenManuallyDisconnected.value) {
      console.debug('Socket was manually disconnected. Re-initializing connection.');
      _hasBeenManuallyDisconnected.value = false;
      createConnectPromise(); // Create a new promise for reconnection
    }

    try {
      socketInstance.value = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        path: '/socket.io/', // Explicitly set the path for Socket.IO connection
      }) as PublicSocket;

      socketInstance.value.on('connect', () => {
        console.debug('✅ Socket connected.');
        isConnected.value = true;
        error.value = null;
        if (resolveConnect) resolveConnect(socketInstance.value);
      });

      socketInstance.value.on('disconnect', (reason) => {
        console.debug(`❌ Socket disconnected: ${reason}`);
        isConnected.value = false;
        if (!_hasBeenManuallyDisconnected.value) {
          // If disconnected unexpectedly, prepare for next connection attempt
          createConnectPromise();
        }
      });

      socketInstance.value.on('connect_error', (err) => {
        console.error(`Socket connection error: ${err.message}`);
        error.value = err.message;
        isConnected.value = false;
        if (!_hasBeenManuallyDisconnected.value) {
          // If connection failed, prepare for next connection attempt
          createConnectPromise();
        }
      });
    } catch (err: any) {
      console.error('Failed to create socket:', err);
      error.value = err.message;
      isConnected.value = false;
      if (resolveConnect) resolveConnect(null);
      createConnectPromise(); // Prepare for next attempt
    }
  }

  function disconnect() {
    if (socketInstance.value) {
      console.debug('Manually disconnecting socket.');
      _hasBeenManuallyDisconnected.value = true;
      socketInstance.value.disconnect();
      socketInstance.value = null;
      isConnected.value = false;
    }
    createConnectPromise(); // Always create a new promise after disconnect
  }

  function emit(event: string, data?: any) {
    if (socketInstance.value?.connected) {
      socketInstance.value.emit(event, data);
    } else {
      console.warn(`Cannot emit ${event}: socket not connected.`);
    }
  }

  function on(event: string, callback: (...args: any[]) => void) {
    if (socketInstance.value) {
      socketInstance.value.on(event, callback);
    }
  }

  function off(event: string, callback?: (...args: any[]) => void) {
    if (socketInstance.value) {
      socketInstance.value.off(event, callback);
    }
  }

  const onConnect = () => connectPromise;

  onUnmounted(() => {
    // Lifecycle handled by App.vue for shared instance
  });

  return {
    socket: socketInstance,
    isConnected,
    error,
    connect,
    disconnect,
    emit,
    on,
    off,
    onConnect,
  };
}

export function getSocketInstance(): PublicSocket | null {
  return socketInstance.value;
}
