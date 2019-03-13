var WS_URL = 'wss://test-webrtc.glitch.me';


function send(conns, req) {
  var msg = JSON.stringify(req);
  for(var conn of conns)
    conn.send(msg);
};

function onOpen(ws) {
  console.log('connection opened.');
};

function onClose(ws) {
  console.log('connection closed.');
};

function onConnection(ws, req) {
  var {id} = req;
  var $source = document.getElementById('source');
  $source.value = id;
  console.log('source set to '+id);
};

function onConnections(ws, req) {
};

function onRename(ws, req) {
};

function onMessage(ws, req) {
};


var ws = new WebSocket(WS_URL);
ws.onopen = () => onOpen(ws);
ws.onclose = () => onClose(ws);
ws.onmessage = (msg) => {
  var req = JSON.parse(msg);
  var {type} = req;
  if(type==='connection') onConnection(ws, req);
  else if(type==='connections') onConnections(ws, req);
  else if(type==='rename') onRename(ws, req);
  else if(type==='message') onMessage(ws, req);
};
