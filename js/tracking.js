const IDLE_THRESHOLD = 17000;
const FACE_DETECTION_THRESHOLD = 0.7;
const IDENTITY_DISTANCE_THRESHOLD = 0.6;

// let faceAPIResults = null;
let affdexResults = null;

let identities = {};
let descriptors = {}

function userDataTemplate() {
	return {
		descriptors: [],
		age: [],
		gender: []
	}
}
let userName = null;
let userData = userDataTemplate()
let faceMatcher = null;
let users = []

userName = 'Matthew'
userName.ageEst = '15-25'
userName.genderEst = 'männlich'

// AFFDEX
// const faceMode = affdex.FaceDetectorMode.LARGE_FACES;
// const detector = new affdex.FrameDetector(faceMode);
var divRoot = $("#affdex_elements")[0];
var width = 640;
var height = 480;
var faceMode = affdex.FaceDetectorMode.LARGE_FACES;
//Construct a CameraDetector and specify the image width / height and face detector mode.
var detector = new affdex.CameraDetector(divRoot, width, height, faceMode);


detector.detectAllExpressions();
detector.detectAllEmotions();
detector.detectAllEmojis();
detector.detectAppearance.gender = false;
detector.detectAppearance.age = true;
detector.detectAppearance.ethnicity = false;
detector.detectAppearance.glasses = true;

let affdexLoaded = false;
detector.addEventListener("onInitializeSuccess", function() {
	console.log("Affdex Initialized")
});

detector.addEventListener("onImageResultsSuccess", function (faces, image, timestamp) {
	if (faces.length > 0) {
		affdexResults = faces[0]
	} else {
		return
	}

	if (mode == 'tracking') {
        maintain()
		drawEmotions(affdexResults.emotions)
		drawExpressions(affdexResults.expressions)
		drawOrientation(affdexResults.measurements.orientation)
        drawAffectivaLandmarks(affdexResults.featurePoints, trackingCanvas)
	}
});

// function getAffdexResults() {
// 	getFrame()
// 	start = (new Date()).getTime() / 1000;
// 	imageData = videoCtx.getImageData(0, 0, w, h);
// 	now = (new Date()).getTime() / 1000;
// 	dt = now - start;
// 	t = detector.process(imageData, dt);
// }


// FACE API
const useTinyDetector = true;
const useTinyLankmark = true;
let faceDetectorModel;
let landmarkModel;

async function loadModels() {
    if (useTinyDetector) {
        await faceapi.loadTinyFaceDetectorModel("models");
        faceDetectorModel = faceapi.nets.tinyFaceDetector;
    } else {
        await faceapi.loadSsdMobilenetv1Model("models");
        faceDetectorModel = faceapi.nets.ssdMobilenetv1;
    }
    if (useTinyLankmark) {
        await faceapi.loadFaceLandmarkTinyModel("models");
        landmarkModel = faceapi.nets.faceLandmark68TinyNet;
    } else {
        await faceapi.loadFaceLandmarkModel("models");
        landmarkModel = faceapi.nets.faceLandmark68Net
    }

    await faceapi.loadFaceRecognitionModel("models");
    await faceapi.loadFaceExpressionModel("models");
    await faceapi.loadAgeGenderModel("models");

    console.log("FaceAPI Models Loaded")
}

function isFaceAPILoaded() {
    function isLoaded(net) {
    	if (!net) {
    		return false;
    	}
        return !!net.params
    }

    models = [faceDetectorModel,
              landmarkModel,
              faceapi.nets.faceExpressionNet,
              faceapi.nets.ageGenderNet,
              faceapi.nets.faceRecognitionNet]

    if (models.every(isLoaded)) {
        return true
    } else {
        return false
    }
}

async function getFaceAPIResults(mode) {
	if (!isFaceAPILoaded()) {
		console.log("not loaded")
		return null;
	}

    threshold = 0.7

    let options;

    if (useTinyDetector) {
    	let inputSize;
  		if (mode == 'tracking') {
  			inputSize = 128
  		} else {
  			inputSize = 256
  		}

        options = new faceapi.TinyFaceDetectorOptions({inputSize: inputSize, scoreThreshold: threshold})
    } else {
        options = new faceapi.SsdMobilenetv1Options({minConfidence: threshold})
    }

    let results;

    try {
	    if (mode == 'loading' || mode == 'idle' || mode == 'newUser') {
	    	results = await faceapi.detectSingleFace(video, options);
	    } else if (mode == 'recognition' || mode == 'tracking') {
	    	results = await faceapi.detectSingleFace(video, options).withFaceLandmarks(useTinyLankmark)
	    															.withFaceDescriptor();
	    } else if (mode == 'userCapture') {
	    	results = await faceapi.detectAllFaces(video, options).withFaceLandmarks(useTinyLankmark)
	                                                                .withAgeAndGender()
	                                                                .withFaceDescriptors();
	    }
	    return results
	} catch(e) {
		console.log("Fetching face-api results failed", e.message)
		return null;
	}
}

function clearLandmarks() {
	overlay.getContext('2d').clearRect(0, 0, w, h)
}

let faceAPILoaded = false;

async function loadFaceTrackers() {
	detector.start()
	loadModels()
}

loadFaceTrackers()