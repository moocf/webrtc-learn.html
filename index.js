const express = require('express');
const http = require('http');


const E = process.env;
const X = express();
const server = http.createServer(X);


X.use(express.static('public'));
X.get('/', function(request, response) {
  response.sendFile(__dirname + '/views/index.html');
});


server.listen(E.PORT||80, () => {
  var addr = server.address();
  console.log(`SERVER: ready at port ${addr.port}`);
});
