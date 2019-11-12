const myurl = "https://myplaystyle.shop" //"https://localhost:3000";

const localVideosContainer = document.getElementById('local-videos-container');
const remoteVideosContainer = document.getElementById('remote-videos-container');

let connection = new RTCMultiConnection();
let videoTag;
let stream;

// 업로드하는 영상의 수 (라운드수)
let uploadNum = 0;
// 시청자 수
let viewers;

connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';

connection.session = {
    // audio: false,
    video: true,
};

connection.sdpConstraints.mandatory = {
    // offerToReceivaAudio: false,
    offerToReceiveVideo: true
};

connection.mediaConstraints = {
    video: {
        width: {
            min: 1280
        },
        height: {
            min: 720
        }
    }
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

var messageBox = $('#message-box-A');
var messages = [];

var height = 80;
var startY = document.body.offsetHeight - height - 5;

function addMessage(msg) {

    var total = messages.length;

    for (var i = 0; i < total; i++) {

        var msg = messages[i];
        //var pos = startY - ((i + 1) * height);
        var pos = -((i + 1) * height);

        TweenLite.to(msg, 0.5, { y: pos });
    }

    var newMessage = $("<div class='message'>" + total + "세트 </div>");

    messageBox.append(newMessage);
    messages.unshift(newMessage);

    TweenLite.fromTo(newMessage, 0.5, {
        y: height * 2
    }, {
        y: 0,
        autoAlpha: 1
    });
}

// 입장 버튼
document.getElementById('streaming-start').onclick = async function () {
    $.post(myurl + "/viewers/", function (view_count) {
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

    // $.post(myurl+"/score/A/", function (data) {
    //     console.log('A 득점!!')
    // });

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

    // $.post(myurl+"/score/B/", function (data) {
    //     console.log('B 득점!!')
    // });

    recorder.stopRecording(async () => {
        const fileObject = make_file_from_blob(recorder, 'B');
        await upload_to_server(fileObject);
        get_my_playstyle(fileObject.name);
    });
});

// var reset_Btn = document.getElementById('game-over');
// reset_Btn.addEventListener("click", async () => {
//     $.post(myurl+"/score/reset/", function (data) {
//         console.log('점수 Reset!!')
//     });
// });


// setInterval(function () {
//     $.get(myurl+"/score/", function (data) {
//         // flag = response.result;
//         score = data
//         console.log(score)
//     });
// }, 2000);


// 블롭으로 부터 파일 객체 생성
const make_file_from_blob = (recorder, player) => {
    const blob = recorder.getBlob()
    const fileName = room_id + '_' + player + '_' + (++uploadNum) + '.mkv';

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

        xhr = new XMLHttpRequest();

        $.get({
            url: "https://python-elb-934761745.ap-northeast-2.elb.amazonaws.com/analysis/" + fileName,
            type: 'GET',
            dataType: 'json',
            success: function (json) { alert('A : ' + json.A.result + '\n B : ' + json.B.result); },
            error: function () { alert('error!'); },
            beforeSend: setHeader
        });

        function setHeader(xhr) {
            xhr.setRequestHeader("Access-Control-Allow-Origin", '*');
            xhr.setRequestHeader("Access-Control-Allow-Credentials", "true");
            xhr.setRequestHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE");
            xhr.setRequestHeader("Access-Control-Max-Age", "3600");
            xhr.setRequestHeader("Access-Control-Allow-Headers", "Content-Type, Accept, X-Requested-With, remember-me");
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader("Accept", "application/json");
        }
    } catch (error) {
        alert("분석실패");
    }
}