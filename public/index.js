var WS_URL = 'wss://test-webrtc.glitch.me';


var name = '';
var $name = document.getElementById('name');
var $target = document.getElementById('target');
var $targets = document.getElementById('targets');
var $message = document.getElementById('message');
var $send = document.getElementById('send');
var $call = document.getElementById('call');
var $messages = document.getElementById('messages');
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
  var {source} = req;
  for(var $option of Array.from($targets.childNodes))
    if($option.value===source) $targets.removeChild($option);
  $status.value = $targets.childNodes.length+' people connected';
};

function onConnections(ws, req) {
  var {targets} = req;
  for(var id of targets) {
    var $option = document.createElement('option');
    $option.value = id;
    $targets.appendChild($option);
  }
  $status.value = $targets.childNodes.length+' people connected';
};

function onConnection(ws, req) {
  var {target} = req;
  var $option = document.createElement('option');
  $option.value = target;
  $targets.appendChild($option);
  $status.value = $targets.childNodes.length+' people connected';
};

function onRename(ws, req) {
  var {source, target} = req;
  if(source==null) return $status.value = $name.value+' not available';
  if(target==null) return $name.value = name = source;
  if(source===name) return $status.value = 'you renamed to '+(name = target);
  for(var $option of Array.from($targets.childNodes))
    if($option.value===source) $option.value = target;
};

function onMessage(ws, req) {
  var {source, target, value} = req;
  if(value==null) return $status.value = 'failed to message '+target;
  if(source===name) $messages.value += '\n->'+target+': '+value;
  else $messages.value += '\n'+source+': '+value;
  if(source===name) $message.value = '';
};

function doRename(ws) {
  send([ws], {type: 'rename', source: name, target: $name.value});
  return false;
};

function doMessage(ws) {
  send([ws], {type: 'message', target: $target.value, value: $message.value});
  return false;
};


var ws = new WebSocket(WS_URL);
ws.onopen = () => onOpen(ws);
ws.onclose = () => onEnd(ws);
ws.onmessage = (event) => {
  var req = JSON.parse(event.data);
  var {type} = req;
  if(type==='close') onClose(ws, req);
  else if(type==='connection') onConnection(ws, req);
  else if(type==='connections') onConnections(ws, req);
  else if(type==='rename') onRename(ws, req);
  else if(type==='message') onMessage(ws, req);
};
$name.onchange = () => doRename(ws);
$send.onclick = () => doMessage(ws);
