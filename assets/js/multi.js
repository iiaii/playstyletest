const myurl = "https://myplaystyle.shop" //"https://localhost:3000";

const localVideosContainer = document.getElementById('local-videos-container');
const remoteVideosContainer = document.getElementById('remote-videos-container');
const player_a = document.getElementById('input-player-a');
const player_b = document.getElementById('input-player-b');

let connection = new RTCMultiConnection();
let videoTag;
let stream;

let uploadNum = 0;
// 시청자 수
let viewers;

connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';

connection.session = {
    video: true
};

connection.sdpConstraints.mandatory = {
    // offerToReceivaAudio: false,
    offerToReceiveVideo: true
};

connection.mediaConstraints = {
    audio: true,
    video: {
        width: {
            min: 1280
        },
        height: {
            min: 720
        }
    },
};

let flag = true;

connection.onstream = function (event) {
    videoTag = event.mediaElement;
    stream = event.stream;

    $.get(myurl + "/viewers/", function (view_count) {
        const viewers = view_count.viewers;

        if (event.type === 'local' && viewers <= 0 && flag) {
            flag = false;
            localVideosContainer.appendChild(videoTag);
            $.post(myurl + "/main_stream/" + event.streamid, function (result) {
                console.log("streamid put " + result);
            });
        }

        console.log(viewers + ' !!!!!!!!', event.streamid);
        $.get(myurl + "/main_stream/", function (streamid) {
            const main_stream_id = streamid.id;

            if (event.type === 'remote' && viewers > 0 && main_stream_id === streamid.id && flag) {
                flag = false;
                remoteVideosContainer.appendChild(videoTag);
            }
            console.log(main_stream_id)
        });
    });

};

// let roomid = document.getElementById('txt-roomid');
// roomid.value = connection.token();
// roomid.value -> room_id
const room_id = '1';

var messageBoxA = $('#message-box-A');
var messageBoxB = $('#message-box-B');
var messagesA = [];
var messagesB = [];

var heightA = 80;
var heightB = 80;
var AstartY = document.body.offsetHeight - heightA - 5;
var BstartY = document.body.offsetHeight - heightB - 5;

function AaddMessage(url, txt) {

    var total = messagesA.length;

    for (var i = 0; i < total; i++) {
        var msg = messagesA[i];
        //var pos = startY - ((i + 1) * height);
        var pos = -((i + 1) * heightA);

        TweenLite.to(msg, 0.5, { y: pos });
    }

    var newMessage = $("<div class='message'>" + total + "세트 <a href=" + url + ">경기영상</a><br>" + txt + "</div>");

    messageBoxA.append(newMessage);
    messagesA.unshift(newMessage);

    TweenLite.fromTo(newMessage, 0.5, {
        y: heightA * 2
    }, {
        y: 0,
        autoAlpha: 1
    });
}

function BaddMessage(url, txt) {

    var total = messagesB.length;

    for (var i = 0; i < total; i++) {

        var msg = messagesB[i];
        //var pos = startY - ((i + 1) * height);
        var pos = -((i + 1) * heightB);

        TweenLite.to(msg, 0.5, { y: pos });
    }

    var newMessage = $("<div class='message'>" + total + "세트 <a href=" + url + ">경기영상</a><br>" + txt + "</div>");

    messageBoxB.append(newMessage);
    messagesB.unshift(newMessage);

    TweenLite.fromTo(newMessage, 0.5, {
        y: heightB * 2
    }, {
        y: 0,
        autoAlpha: 1
    });
}

// 입장 버튼
document.getElementById('streaming-start').onclick = async function () {
    $.post(myurl + "/viewers/add", function (view_count) {
        viewers = view_count.viewers;

        if (viewers <= 1) {
            document.getElementById('game-start').style.display = 'none';
            document.getElementById('end-A').style.display = 'none';
            document.getElementById('end-B').style.display = 'none';
            document.getElementById('view-intro').style.display = 'none';
            document.getElementById('game-start').style.display = 'inline-block';
            document.getElementById('game-over').style.display = 'inline-block';
        }
        console.log('!! ', viewers);
    });

    document.getElementById('intro').innerHTML = "";

    document.getElementById('play-record').style.display = 'inline-block';
    document.getElementById('streaming-start').style.display = 'none';

    // document.getElementById('scoreboard').style.display = 'block';
    // document.getElementById('player-a-score').style.display = 'block';
    // document.getElementById('player-b-score').style.display = 'block';

    connection.openOrJoin(room_id || 'predefiend-roomid')
};

// 경기 녹화 시작
document.getElementById('game-start').addEventListener("click", async () => {
    document.getElementById('game-start').style.display = 'none';
    document.getElementById('end-A').style.display = 'inline-block';
    document.getElementById('end-B').style.display = 'inline-block';

    recorder = new RecordRTC(stream, {
        type: 'video',
        // mimeType: 'video/webm',
    });

    await recorder.startRecording();
    recorder.camera = await stream;
})

// A가 이겼을때
document.getElementById('end-A').addEventListener("click", () => {
    document.getElementById('game-start').style.display = 'inline-block';
    document.getElementById('game-over').style.display = 'inline-block';
    document.getElementById('end-A').style.display = 'none';
    document.getElementById('end-B').style.display = 'none';

    $.post(myurl + "/score/A/", function (data) {
        console.log('A 득점!!')
    });



    recorder.stopRecording(async () => {
        const fileObject = make_file_from_blob(recorder, 'A');
        await upload_to_server(fileObject);
        get_my_playstyle(fileObject.name);
    });
});

// B가 이겼을때
var end_B_Btn = document.getElementById('end-B');
end_B_Btn.addEventListener("click", () => {
    document.getElementById('game-start').style.display = 'inline-block';
    document.getElementById('game-over').style.display = 'inline-block';
    document.getElementById('end-A').style.display = 'none';
    document.getElementById('end-B').style.display = 'none';

    $.post(myurl + "/score/B/", function (data) {
        console.log('B 득점!!')
    });

    recorder.stopRecording(async () => {
        const fileObject = make_file_from_blob(recorder, 'B');
        await upload_to_server(fileObject);
        get_my_playstyle(fileObject.name);
    });
});

// 게임 종료
var reset_Btn = document.getElementById('game-over');
reset_Btn.addEventListener("click", async () => {
    const game_name = player_a.value + " vs " + player_b.value
    $.post(myurl + "/score/reset/" + game_name, function (data) {
        console.log('점수 Reset!!')
    });
});


setInterval(function () {
    $.get(myurl + "/score/", function (data) {
        document.getElementById('A-score').innerHTML = data.A;
        document.getElementById('B-score').innerHTML = data.B;
    });
}, 2000);


// 블롭으로 부터 파일 객체 생성
const make_file_from_blob = (recorder, player) => {
    const blob = recorder.getBlob()
    const fileName = player_a.value + '_' + player_b.value + '_' + player + '_' + (++uploadNum) + '.mkv';

    return new File(
        [blob],
        fileName,
        { type: 'video/mkv' }
    );
}

// aws s3에 업로드
const upload_to_server = async (fileObject) => {
    const albumBucketName = "playstyle";
    const bucketRegion = "ap-northeast-2";
    const IdentityPoolId = "ap-northeast-2:e52b3ad7-a28f-4204-8a60-3fa1b2cea79b";
    const file = fileObject;
    const fileName = file.name;
    const fileKey = "videos/" + fileName; // 예시 videos/test0.mp4

    AWS.config.update({
        region: bucketRegion,
        credentials: new AWS.CognitoIdentityCredentials({
            IdentityPoolId: IdentityPoolId
        })
    });

    // Use S3 ManagedUpload class as it supports multipart uploads
    const upload = new AWS.S3.ManagedUpload({
        params: {
            Bucket: albumBucketName,
            Key: fileKey,
            Body: file,
            ACL: "public-read"
        }
    });

    try {
        await upload.promise();
        $("div.success").fadeIn(300).delay(1500).fadeOut(400);
        $.post(myurl + "/history/" + fileName, function (data) {
            console.log('점수 기록!!')
        });
        // alert("영상 업로드 성공 : " + fileName);
    } catch (error) {
        $("div.failure").fadeIn(300).delay(1500).fadeOut(400);
        // alert("영상 업로드 오류 : ", err.message);
    }
}

// 영상 분석 서버에서 분석 결과 가져오기
const get_my_playstyle = (fileName) => {
    try {
        console.log(fileName + " 분석시작");

        const url = "https://analysis.myplaystyle.shop/analysis/" + fileName;

        $.ajax({
            url: "https://analysis.myplaystyle.shop/analysis/" + fileName,
            dataType: 'jsonp',
            jsonpCallback: 'myCallback',
            timeout: 500000,
            success: function (data) {

                // const json = JSON.parse(data.responseText);
                // console.log("jsonp", data);
                // alert('A : ' + data.A.result + ' B : ' + data.B.result);
            },
            error: function (xhr) {

                // alert(xhr);
            }
        });



        // success: function (data) { 

        // },
        // error: function (data) {  },
        // });

    } catch (error) {
        alert("분석실패");
    } finally {
        request = new XMLHttpRequest();
        request.open('GET', 'https://playstyle.s3.ap-northeast-2.amazonaws.com/results.json', true);

        request.onload = function () {
            if (request.status >= 200 && request.status < 400) {
                // Success!
                data = JSON.parse(request.responseText);
                // alert('A : ' + data.A.result + ' B : ' + data.A.result);
                const file_url = "https://playstyle.s3.ap-northeast-2.amazonaws.com/videos/" + fileName;

                AaddMessage(file_url, data.A.result);
                BaddMessage(file_url, data.B.result);
            } else {
                // We reached our target server, but it returned an error

            }
        };

        request.onerror = function () {
            // There was a connection error of some sort
        };

        request.send();

        // AaddMessage()
        // AaddMessage()

        $.ajax({
            url: myurl + '/history/analysis',
            method: 'POST',
            data: result,
            success: function (data) {
                console.log('history 등록', data);
            },
            error: function (data) {
                console.log('err', data.toString());
            }
        });
    }
}