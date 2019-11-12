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
app.post('/viewers/add', function (req, res) {
    try {
        return res.status(200).json({viewers:(++viewers)});
    } catch (error) {
        return res.status(400).json({error: error});
    }
});

app.get('/viewers/', function (req, res) {
    try {
        return res.status(200).json({viewers:viewers});
    } catch (error) {
        return res.status(400).json({error: error});
    }
});

// stream id 
let main_stream_id = '';

app.post('/main_stream/:id', function (req, res) {
    
    try {
        main_stream_id = req.params.id;
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

let A = 0;
let B = 0;

let game_history_index = 0;
let analysis_history_index = 0;
let game_history = [];
let analysis_history = [];

let total_game_history = [];

// 게임 기록
app.post('/history/:filename', function (req, res) {
    try {
        game_history[game_history_index++] = req.params.filename;
        console.log("게임 기록 : ", A+B);
        return res.status(200).json({result:"success"});
    } catch (error) {
        return res.status(400).json({error: error});
    }
});

// 분석결과 기록
app.post('/history/analysis', function (req, res) {
    try {
        analysis_history[analysis_history_index++] = req.body;
        console.log("분석 결과 기록 : ", A+B);
        return res.status(200).json({result:"success"});
    } catch (error) {
        return res.status(400).json({error: error});
    }
});

//A 득점
app.post('/score/A/', function (req, res) {
    try {
        A++;
        console.log("A 득점");
        return res.status(200).json({result:"success"});
    } catch (error) {
        return res.status(400).json({error: error});
    }
});

//B 득점
app.post('/score/B/', function (req, res) {
    try {
        B++;
        console.log("B 득점");
        return res.status(200).json({result:"success"});
    } catch (error) {
        return res.status(400).json({error: error});
    }
});

let index = 0;
//Reset
app.post('/score/reset/:game_name', function (req, res) {
    try {
        total_game_history[index++] = {
            'game_name' : req.params.game_name,
            'A': A,
            'B': B,
            'total' : (A+B),
            'videos_history' : game_history,
            'analysis_history' : analysis_history,
        };
        A = 0;
        B = 0;
        game_history_index = 0;
        analysis_history_index = 0;
        console.log("Score Reset");
        return res.status(200).json({result:"success"});
    } catch (error) {
        return res.status(400).json({error: error});
    }
});

//Get Score
app.get('/score/', function (req, res) {
    try {
        console.log(A + " : " + B + " score get!");
        return res.status(200).json({ 
            'A': A, 
            'B': B 
        });
    } catch (error) {
        return res.status(400).json({error: error});
    }
});

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
