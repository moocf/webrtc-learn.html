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
  var id = randomId(people);
  send([ws], {type: 'rename', id});
  send([ws], {type: 'connections', ids: Array.from(people.keys())});
  send(people.values(), {type: 'connection', id});
  people.set(id, ws);
  console.log(id+' just connected');
};

function onClose(ws, id) {
  people.delete(id);
  send(people.values(), {type: 'close', id});
  console.log(id+' just closed');
};

function onRename(ws, id, req) {
  var value = req.id;
  if(people.has(value)) return send([ws], {type: 'rename', id: null}); // error
  send(people.values(), {type: 'rename', id, value});
  people.set(value, ws);
  people.delete(id);
  console.log(id+' rename to '+value);
};

function onMessage(ws, id, req) {
  var target = req.id, {value} = req;
  if(!people.has(target)) return send([ws], {type: 'message', });
  send([ws, people.get(target)], {type: 'message', id: target, value});
  console.log(id+' messaged to '+target);
};

wss.on('connection', (ws) => {
  onConnection(ws);
  ws.on('close', () => {
    var id = Map.keyOf(people, ws);
    onClose(ws, id);
  });
  ws.on('message', (msg) => {
    var req = JSON.parse(msg);
    var {type} = req;
    var id = Map.keyOf(ws);
    if(type==='rename') onRename(ws, id, req);
    else if(type==='message') onMessage(ws, id, req);
  });
});


server.listen(E.PORT||80, () => {
  var addr = server.address();
  console.log(`SERVER: ready at port ${addr.port}`);
});
