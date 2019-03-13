const randomName = require('adj-noun');
const express = require('express');
const WebSocket = require('ws');
const http = require('http');
require('extra-map');


const E = process.env;
const X = express();
const server = http.createServer(X);
const wss = new WebSocket.Server({server});


var people = new Map();


function send(conns, res) {
  var msg = JSON.stringify(res);
  for(var conn of conns)
    conn.send(msg);
};

function randomId(map) {
  var id = null;
  for(; !id || map.has(id);)
    id = randomName().join('-');
  return id;
};


X.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/index.html');
});
X.use(express.static('public'));


function onConnection(ws) {
  var source = randomId(people);
  send([ws], {type: 'rename', source});
  send([ws], {type: 'connections', targets: Array.from(people.keys())});
  send(people.values(), {type: 'connection', target: source});
  people.set(source, ws);
  console.log(source+' just connected');
};

function onClose(ws, source) {
  people.delete(source);
  send(people.values(), {type: 'close', source});
  console.log(source+' just closed');
};

function onRename(ws, source, req) {
  var {target} = req;
  if(people.has(target)) return send([ws], {type: 'rename'}); // error
  send(people.values(), {type: 'rename', source, target});
  people.delete(source);
  people.set(target, ws);
  console.log(source+' renamed to '+target);
};

function onMessage(ws, source, req) {
  var {target, value} = req;
  if(!people.has(target)) return send([ws], {type: 'message', source, target}); // error
  send([ws, people.get(target)], {type: 'message', source, target, value});
  console.log(source+' messaged to '+target);
};

function onDefault(ws, source, req) {
  var {type, target} = req;
  req.source = {source};
  if(!people.has(target)) return send([ws], {type, source, target});
  send([people.get(target)], req);
  console.log(source+' defaulted to '+target);
};

wss.on('connection', (ws) => {
  onConnection(ws);
  ws.on('close', () => {
    var source = Map.keyOf(people, ws);
    onClose(ws, source);
  });
  ws.on('message', (msg) => {
    var req = JSON.parse(msg);
    var {type} = req;
    var source = Map.keyOf(people, ws);
    if(type==='rename') onRename(ws, source, req);
    else if(type==='message') onMessage(ws, source, req);
    else onDefault(ws, source, req);
  });
});


server.listen(E.PORT||80, () => {
  var addr = server.address();
  console.log(`SERVER: ready at port ${addr.port}`);
});
