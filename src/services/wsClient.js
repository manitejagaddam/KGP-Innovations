const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000';

let ws = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
let isIntentionalDisconnect = false;

const MAX_RECONNECT_DELAY = 30000;

export const connectWs = (token, onMessage) => {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  isIntentionalDisconnect = false;
  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    reconnectAttempts = 0;
    // Send auth message
    ws.send(JSON.stringify({ type: 'auth', token }));
    
    // Setup heartbeat
    window.wsHeartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 15000);
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'pong') return;
      onMessage(data.type, data.payload || data.data || data);
    } catch (err) {
      console.error('Failed to parse WS message', err);
    }
  };

  ws.onclose = () => {
    clearInterval(window.wsHeartbeat);
    ws = null;
    if (!isIntentionalDisconnect) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
      reconnectAttempts++;
      reconnectTimer = setTimeout(() => connectWs(token, onMessage), delay);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
};

export const disconnectWs = () => {
  isIntentionalDisconnect = true;
  clearTimeout(reconnectTimer);
  clearInterval(window.wsHeartbeat);
  if (ws) {
    ws.close();
    ws = null;
  }
};

export const isWsConnected = () => {
  return ws !== null && ws.readyState === WebSocket.OPEN;
};
