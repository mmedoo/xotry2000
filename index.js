const rooms = {};
let clients = 0;
let once = 0;
const ws = require('websocket').server;
const express = require('express');
const http = require('http');
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
app.use(require("body-parser").json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(express.static('website'));
const httpServer = http.createServer(app);
const wss = new ws({ httpServer: httpServer , autoAcceptConnections: false })
function check(url) {
    let port = "";
    for (let i = 1; i < url.length; i++) {
        if (url[i] == "?") {
            break;
        }
        port += url[i];
    }
    return port;
}
wss.on("request",(req) => {
    let name = check(req.httpRequest.url);
    let room = rooms[name];
    let client = req.accept();
    room.push(client);
    client.on("message",(data) => {
      let n = JSON.parse(data.utf8Data)[0];
      if (n == 99) room[0] = []; else room[0].push(n);
      for (let i = 1; i < room.length; i++) {
        if (room[i] != client)
          room[i].send(JSON.stringify({0:n}));
        }
    })
    client.on("close",() => {
      if (room.length == 2) {
        delete rooms[name];
      } else {
        room.splice(room.indexOf(client),1);
      }
    })
})

app.post('/create',addRoom);
function addRoom(req,res) {
  let roomName = req.body.room.toString();
  if (rooms.hasOwnProperty(roomName)) {
    res.send(false);
    return;
  }
  clients++;
  let moves = [];
  let room = [moves];
  rooms[roomName] = room;
  let porto = Object.keys(rooms).length+'0'+clients+'0'+1;
  res.send({porto,roomName});
}

app.post('/join',clientJoin);
function clientJoin(req,res) {
  let roomName = req.body.room.toString();
  if (Object.keys(rooms).length-1 == 0 || !rooms.hasOwnProperty(roomName)) {
    res.send(false);
    return;
  }
  roomName = req.body.room;
      clients++;
      let porto = Object.keys(rooms).length+'0'+clients+'0'+rooms[roomName].length+'';
      let moves = rooms[roomName][0];
      res.send({porto,roomName,moves});
}
httpServer.listen(process.env.PORT || 3000);
