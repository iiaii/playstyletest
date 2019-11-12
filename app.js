'use strict';

var os = require('os');
var nodeStatic = require('node-static');
//var socketIO = require('socket.io');
var express = require('express');
var app = express();
var http = require('http').createServer(app);

app.use(express.static('assets'))

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

let roomID;
//이건 방관리하는거임. 흠.....처음엔 false 그 후엔 true만 반환.
let ROOM = [];

let viewers = -1;
app.get('/room/:roomId', async function (req, res) {
    roomID = req.params.roomId;

    // if (ROOM[roomID] === undefined) { // 방을 새로 만들었을때
    //   ROOM[roomID] = 0;
    // } else { // 방이 이미 생성되었을때
    //   ROOM[roomID]++;
    // }
    await viewers++;
    res.send(viewers);
});

// let A = 0;
// let B = 0;
// //A 득점
// app.post('/score/A/', function (req, res) {
//     console.log("A 득점");
//     A++;
// });

// //B 득점
// app.post('/score/B/', function (req, res) {
//     console.log("B 득점");
//     B++;
// });

// //Reset
// app.post('/score/reset/', function (req, res) {
//     console.log("Score Reset");
//     A = 0;
//     B = 0;
// });

// //Get Score
// app.get('/score/', function (req, res) {
//     console.log(A + " : " + B + " score get!");
//     let score = { 'A': A, 'B': B };
//     res.send(score);
// });

http.listen(process.env.PORT || 3000, function () {
    console.log('listening on *:3000');
});

var io = require('socket.io')(http);
const RTCMultiConnectionServer = require('rtcmulticonnection-server');
io.on('connection', function (socket) {

    RTCMultiConnectionServer.addSocket(socket);

    socket.on('bye', function () {
        console.log('received bye');
    });

    socket.on('disconnect', () => {
        console.log('disconnected ' + socket.id);
        io.sockets.in(room_info[socket.id]).emit("disconnect", 'diconnect');
        room_info[socket.id] = null;
    });

    socket.on('message', function (message) {
        console.log('Client said: ', message);
        // for a real app, would be room-only (not broadcast)
        socket.broadcast.emit('message', message);
    });
});
