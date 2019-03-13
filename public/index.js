var WS_URL = 'wss://test-webrtc.glitch.me';


function onOpen(ws) {
  console.log('connection opened.');
};

function onClose(ws) {
  console.log('connection closed.');
};

function onConnection(ws, req) {
};

function onConnections(ws, req) {
};

function onRename(ws, req) {
};

function onMessage(ws, req) {
};


var ws = new WebSocket(WS_URL);
ws.onopen = () => onOpen(ws);
ws.onclose = () => onclose
