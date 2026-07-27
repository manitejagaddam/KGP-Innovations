import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';

let wss;
const clients = new Map(); // Map<ws, { userId, role }>

export function initWsServer(httpServer) {
  wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    let isAlive = true;

    ws.on('pong', () => {
      isAlive = true;
    });

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'auth' && data.token) {
          // Verify JWT from auth message
          jwt.verify(data.token, process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET, (err, decoded) => {
            if (err) {
              ws.send(JSON.stringify({ type: 'error', message: 'Authentication failed' }));
              ws.close();
              return;
            }
            
            // Store client info
            clients.set(ws, { 
              userId: decoded.sub || decoded.id, 
              role: decoded.role || 'user' 
            });
            
            ws.send(JSON.stringify({ type: 'auth_success', message: 'Authenticated successfully' }));
          });
        }
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
    });

    // Send ping every 30s
    const pingInterval = setInterval(() => {
      if (!isAlive) {
        clients.delete(ws);
        return ws.terminate();
      }
      isAlive = false;
      ws.ping();
    }, 30000);

    ws.on('close', () => {
      clearInterval(pingInterval);
    });
  });
}

export function broadcast(type, data) {
  if (!wss) return;
  const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  
  for (const [ws, info] of clients.entries()) {
    if (ws.readyState === 1) { // OPEN
      ws.send(message);
    }
  }
}

export function sendToUser(userId, type, data) {
  if (!wss) return;
  const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  
  for (const [ws, info] of clients.entries()) {
    if (info.userId === userId && ws.readyState === 1) {
      ws.send(message);
    }
  }
}
