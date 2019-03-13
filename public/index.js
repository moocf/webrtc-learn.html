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
  var {ids} = req;
  var $targets = document.getElementById('targets');
  for(var id of ids) {
    var $option = document.createElement('option');
    $option.value = id;
    $targets.appendChild($option);
  }
};

function onRename(ws, req) {
};

function onMessage(ws, req) {
};


var ws = new WebSocket(WS_URL);
ws.onopen = () => onOpen(ws);
ws.onclose = () => onClose(ws);
ws.onmessage = (event) => {
  var req = JSON.parse(event.data);
  var {type} = req;
  if(type==='connection') onConnection(ws, req);
  else if(type==='connections') onConnections(ws, req);
  else if(type==='rename') onRename(ws, req);
  else if(type==='message') onMessage(ws, req);
};
