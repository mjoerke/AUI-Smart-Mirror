const videoContainer = document.querySelector('#videoContainer')
const video = document.querySelector("#video")
const videoCanvas = document.querySelector("#videoCanvas")
const overlay = document.querySelector('#overlay')
const videoCtx = videoCanvas.getContext('2d');
const trackingCanvas = document.querySelector('#trackingCanvas')

const w = 640;
const h = 480;

// const HD1080 = true;
// if (HD1080) {
// 	w = 1920 / 2;
// 	h = 1440 / 2;
// } else {
// 	w = 1280 / 2;
// 	h = 960 / 2;
// }

video.width = w;
video.height = h;
videoCanvas.width = w;
videoCanvas.height = h;
overlay.width = w;
overlay.height = h;

if (navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(function (stream) {
        video.srcObject = stream;
    })
    .catch(function (error) {
        console.log(error);
    });
}

function getFrame() {
	videoCtx.drawImage(video, 0, 0, w, h);
}

function clearFrame() {
	videoCtx.clearRect(0, 0, w, h);
    overlay.getContext('2d').clearRect(0, 0, w, h);
}

function hideVideo() {
    videoContainer.style.visibility = 'hidden'
}

function showVideo() {
    clearFrame()
    videoContainer.style.visibility = 'visible'
}

let scanState = 'off'

function scan() {
    if (scanState != 'off') {
        return
    }

    scanner = $("#scanner")
    scanner.css('visibility', 'visible')
    scanner.css('left', '915px')
    scanState = '<--'

    $("#scanner").bind('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function() { 
        if (scanState == 'off') {
            stopScan()
            scanner.css('visibility', 'hidden')
            scanner.css('left', '280px')
            $("#scanner").unbind('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend')
        } else if (scanState == '<--') {
            scanState = '-->'
            $(this).css('left', '280px')
        } else if (scanState == '-->') {
            scanState = '<--'
            $(this).css('left', '915px')
        }
    });
}

function stopScan() {
    scanState = 'off'
}