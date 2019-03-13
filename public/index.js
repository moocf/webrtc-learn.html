var WS_URL = 'wss://test-webrtc.glitch.me';

var $targets = document.getElementById('targets');
var $status = document.getElementById('status');


function send(conns, req) {
  var msg = JSON.stringify(req);
  for(var conn of conns)
    conn.send(msg);
};

function onOpen(ws) {
  $status.value = 'connection opened';
};

function onEnd(ws) {
  $status.value = 'connection closed';
};

function onClose(ws, req) {
  var {id} = req;
  for(var $option of Array.from($targets.childNodes))
    if($option.value===id) $targets.removeChild($option);
  $status.value = $targets.childNodes.length+' people connected';
};

function onConnections(ws, req) {
  var {ids} = req;
  for(var id of ids) {
    var $option = document.createElement('option');
    $option.value = id;
    $targets.appendChild($option);
  }
  $status.value = ids.length+' people connected';
};

function onConnection(ws, req) {
  var {id} = req;
  var $option = document.createElement('option');
  $option.value = id;
  $targets.appendChild($option);
  $status.value = id+' just connected';
};

function onRename(ws, req) {
  var {id, value} = req;
  $source.value = id;
  console.log('source set to '+id);
};

function onMessage(ws, req) {
};


var ws = new WebSocket(WS_URL);
ws.onopen = () => onOpen(ws);
ws.onclose = () => onEnd(ws);
ws.onmessage = (event) => {
  var req = JSON.parse(event.data);
  console.log(req);
  var {type} = req;
  if(type==='close') onClose(ws, req);
  else if(type==='connection') onConnection(ws, req);
  else if(type==='connections') onConnections(ws, req);
  else if(type==='rename') onRename(ws, req);
  else if(type==='message') onMessage(ws, req);
};
