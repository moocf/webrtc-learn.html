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
var $local = document.getElementById('local');
var $remote = document.getElementById('remote');


function send(conns, req) {
  var msg = JSON.stringify(req);
  // console.log('send', msg);
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


function doHang(ws, end) {
  if(!end) send([ws], {type: 'rtc-close', target: $target.value});
  for(var track of $remote.srcObject.getTracks())
    track.stop();
  for(var track of $local.srcObject.getTracks())
    track.stop();
  rtc.close();
  rtc = null;
  $status.value = 'closing call with '+$target.value;
  return false;
};

async function onNegotiationNeeded(ws, rtc) {
  var offer = await rtc.createOffer();
  await rtc.setLocalDescription(offer);
  console.log('onNegotiationNeeded', rtc.localDescription);
  send([ws], {type: 'rtc-offer', target: $target.value, sdp: rtc.localDescription});
};

function onIceCandidate(ws, rtc, event) {
  var {candidate} = event;
  console.log('onIceCandidate', candidate);
  send([ws], {type: 'rtc-candidate', target: $target.value, candidate});
};

function onTrack(ws, rtc, event) {
  var {streams} = event;
  console.log('onTrack', streams);
  $remote.srcObject = streams[0];
  $remote.start();
};

function onRemoveTrack(ws, rtc) {
  var stream = $remote.srcObject;
  var tracks = stream.getTracks();
  console.log('onRemoveTrack', tracks.length);
  if(tracks.length===0) return doHang(ws, rtc);
};

function onIceConnectionStateChange(ws, rtc) {
  var state = rtc.iceConnectionState;
  console.log('onIceConnectionStateChange', state);
  if(/closed|failed|disconnected/.test(state)) doHang(ws);
};

function setupRtcConnection(ws) {
  var rtc = new RTCPeerConnection({iceServers: ICE_SERVERS});
  console.log('setupRtcConnection', rtc);
  rtc.onnegotiationneeded = () => onNegotiationNeeded(ws, rtc);
  rtc.onicecandidate = (event) => onIceCandidate(ws, rtc, event);
  rtc.ontrack = (event) => onTrack(ws, rtc, event);
  rtc.onremovetrack = () => onRemoveTrack(ws, rtc);
  rtc.oniceconnectionstatechange = () => onIceConnectionStateChange(ws, rtc);
  rtc.onicegatheringstatechange = () => {};
  rtc.onsignallingstatechange = () => {};
  return rtc;
};

async function onRtcOffer(ws, req) {
  var {source, sdp} = req;
  console.log('onRtcOffer', sdp);
  if(rtc!=null) rtc.close();
  rtc = setupRtcConnection(ws);
  var desc = new RTCSessionDescription(sdp);
  await rtc.setRemoteDescription(desc);
  var constraints = {audio: true, video: true};
  var stream = await navigator.mediaDevices.getUserMedia(constraints);
  for(var track of stream.getTracks())
    rtc.addTrack(track, stream);
  var answer = await rtc.createAnswer();
  await rtc.setLocalDescription(answer);
  console.log('send rtc-answer', rtc.localDescription);
  send([ws], {type: 'rtc-answer', target: source, sdp: rtc.localDescription});
};

async function onRtcAnswer(ws, req) {
  var {source, sdp} = req;
  console.log('onRtcAnswer', sdp);
  var desc = new RTCSessionDescription(sdp);
  await rtc.setRemoteDescription(desc);
};

async function onRtcCandidate(ws, req) {
  var {candidate} = req;
  console.log('onRtcCandidate', candidate);
  if(candidate==null) return;
  var icecandidate = new RTCIceCandidate(candidate);
  await rtc.addIceCandidate(icecandidate);
};

function onRtcClose(ws, req) {
  var {source} = req;
  console.log('onRtcClose');
  doHang(ws, true);
};


async function doCall(ws) {
  if(rtc!=null) rtc.close();
  rtc = setupRtcConnection(ws);
  var constraints = {audio: true, video: true};
  try {
  var stream = await navigator.mediaDevices.getUserMedia(constraints);
  for(var track of stream.getTracks())
    rtc.addTrack(track, stream);
  $local.srcObject = stream;
  $local.start();
  }
  catch(e) { console.log(e.name, e.message); }
  $status.value = 'starting call to '+$target.value;
};


var ws = new WebSocket(WS_URL);
ws.onopen = () => onOpen(ws);
ws.onclose = () => onEnd(ws);
ws.onmessage = (event) => {
  console.log('recv', event.data);
  var req = JSON.parse(event.data);
  var {type} = req;
  if(type==='close') onClose(ws, req);
  else if(type==='connection') onConnection(ws, req);
  else if(type==='connections') onConnections(ws, req);
  else if(type==='rename') onRename(ws, req);
  else if(type==='message') onMessage(ws, req);
  else if(type==='rtc-offer') onRtcOffer(ws, req);
  else if(type==='rtc-answer') onRtcAnswer(ws, req);
  else if(type==='rtc-candidate') onRtcCandidate(ws, req);
  else if(type==='rtc-close') onRtcClose(ws, req);
  else console.log('unknown request', req);
};
$name.onchange = () => doRename(ws);
$send.onclick = () => doMessage(ws);
$call.onclick = () => doCall(ws) && false;
$hang.onclick = () => doHang(ws) && false;
