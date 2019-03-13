const express = require('express');
const WebSocket = require('ws');
const http = require('http');


const E = process.env;
const X = express();
const server = http.createServer(X);
const wss = new WebSocket.Server({server});


var people = new Map();


X.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/index.html');
});
X.use(express.static('public'));


wss.on('connection', (ws) => {
  console.log('someone just connected');
  ws.send({id: people.size()});
  ws.on('close', () => {
    people.
  });
  ws.on('message', (msg) => {
    console.log('got a message');
    var req = JSON.parse(msg);
    
  });
});


server.listen(E.PORT||80, () => {
  var addr = server.address();
  console.log(`SERVER: ready at port ${addr.port}`);
});
