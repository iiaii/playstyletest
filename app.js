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

let viewers = -1;
app.get('/room/:roomId', function (req, res) {
    try {
        return res.status(200).json({viewers:(++viewers)});
    } catch (error) {
        return res.status(400).json({error: error});
    }
});

// stream id 
let main_stream_id = '';

app.post('/main_stream/:id', function (req, res) {
    
    try {
        main_stream_id = id;
        return res.status(200).json({result:"success"});
    } catch (error) {
        return res.status(400).json({error: error});
    }
});

app.get('/main_stream/', function (req, res) {
    
    try {
        return res.status(200).json({id:main_stream_id});
    } catch (error) {
        return res.status(400).json({error: error});
    }
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
        --viewers;
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
