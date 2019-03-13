var WS_URL = 'wss://test-webrtc.glitch.me';
var ICE_SERVERS = [{urls: 'stun:stun.stunprotocol.org'}];

var name = '';
var rtc = null;
var $name = document.getElementById('name');
var $target = document.getElementById('target');
var $targets = document.getElementById('targets');
var $message = document.getElementById('message');
var $send = document.getElementById('send');
var $call = document.getElementById('call');
var $hang = document.getElementById('hang');
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


function setupRtcConnection(ws) {
  var conn = new RTCPeerConnection({iceServers: ICE_SERVERS});
  conn.onnegotiationneeded = async () => {
    var offer = await conn.createOffer();
    await conn.setLocalDescription(offer);
    send([ws], {type: 'rtc-offer', target: });
  };
  conn.onicecandidate = () => {};
  conn.ontrack = () => {};
  conn.onremovetrack = () => {};
  conn.oniceconnectionstatechange = () => {};
  conn.onicegatheringstatechange = () => {};
  conn.onsignallingstatechange = () => {};
  return conn;
};


async function doCall(ws) {
  if(rtc!=null) rtc.close();
  rtc = setupRtcConnection(ws);
  var constraints = {audio: true, video: true};
  var stream = await navigator.mediaDevices.getUserMedia(constraints);
  for(var track of stream.getTracks())
    rtc.addTrack(track, stream);
};

function doHang(ws) {
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
$call.onclick = () => doCall(ws) && false;
$hang.onclick = () => doHang(ws) && false;
