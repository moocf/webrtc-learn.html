const randomName = require('adj-noun');
const express = require('express');
const WebSocket = require('ws');
const http = require('http');


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
  for(; id && !map.has(id);)
    id = randomName();
  return id;
};


X.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/index.html');
});
X.use(express.static('public'));


wss.on('connection', (ws) => {
  var id = randomId();
  send([ws], {type: 'connection', id});
  send([ws], {type: 'connections', ids: people.keys()});
  send(people.values(), {type: 'connection', id});
  people.set(id, ws);
  console.log(id+' just connected');
  ws.on('close', () => {
    var id = Map.keyOf(people, ws);
    people.delete(id);
    send(people.values(), {type: 'close', id});
    console.log(id+' just closed');
  });
  ws.on('message', (msg) => {
    var req = JSON.parse(msg);
    
  });
});


server.listen(E.PORT||80, () => {
  var addr = server.address();
  console.log(`SERVER: ready at port ${addr.port}`);
});
