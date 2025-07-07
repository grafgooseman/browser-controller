const WebSocket = require('ws');
const readline = require('readline');

// Helper to send native messages (length-prefixed JSON)
function sendNativeMessage(msg) {
  const json = JSON.stringify(msg);
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32LE(Buffer.byteLength(json), 0);
  process.stdout.write(lenBuf);
  process.stdout.write(json);
}

// Read native messages from Chrome
const rl = readline.createInterface({ input: process.stdin });

// Connect to remote server
let ws = null;
function connectWebSocket() {
  ws = new WebSocket('ws://localhost:8080');
  ws.on('open', () => sendNativeMessage({ type: 'ws_status', status: 'connected' }));
  ws.on('close', () => sendNativeMessage({ type: 'ws_status', status: 'disconnected' }));
  ws.on('message', (data) => {
    // Forward server message to Chrome extension
    sendNativeMessage({ type: 'server_message', data: data.toString() });
  });
  ws.on('error', (err) => sendNativeMessage({ type: 'ws_error', error: err.message }));
}
connectWebSocket();

// Relay messages from Chrome extension to server
rl.on('line', (line) => {
  try {
    const msg = JSON.parse(line);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    } else {
      sendNativeMessage({ type: 'error', error: 'WebSocket not connected' });
    }
  } catch (e) {
    sendNativeMessage({ type: 'error', error: 'Invalid JSON from extension' });
  }
});

// Optionally, reconnect logic can be added for robustness 