function drawEmotions(results) {
	emotions = ['anger', 'contempt', 'disgust', 'fear', 
				'joy', 'sadness', 'surprise', 'engagement', 'valence']

	for (i = 0; i < emotions.length; i++) {
		e = emotions[i]
		el = $("#" + e)
		val = results[e].toFixed(2).toString() + "%"
		requestAnimationFrame(() => el.width(val))
		el.width(val)
	}
}

function drawExpressions(results) {
	expressions = ['attention', 'browFurrow', 'browRaise', 'cheekRaise',
				   'chinRaise', 'dimpler', 'eyeClosure', 'eyeWiden', 
				   'innerBrowRaise', 'jawDrop', 'lidTighten', 'lipCornerDepressor', 
				   'lipPress', 'lipPucker', 'lipStretch', 'lipSuck', 
				   'mouthOpen', 'noseWrinkle', 'smile', 'smirk', 'upperLipRaise']

	for (i = 0; i < expressions.length; i++) {
		e = expressions[i]
		el = $("#" + e)
		val = results[e].toFixed(2).toString() + "%"
		requestAnimationFrame(() => el.width(val))
		el.width(val)
	}
}

function drawEmoji(results) {
	let emoji;
	if (results.dominantEmoji == "☺") {
		emoji = String.fromCodePoint(0x1F60A);
	} else {
		emoji = results.dominantEmoji;
	}

	$("#emoji").text(emoji)
}

function drawBoundingBox(video, canvas, results) {
	let dims = faceapi.getMediaDimensions(video)
    let ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    let box, x, y, w, h;
    if (results.box) {
    	box = results.box

    	x = Math.round((box.x / dims.width) * canvas.width)
	    y = Math.round((box.y / dims.height) * canvas.height)
	    w = Math.round((box.width / dims.width) * canvas.width)
	    h = Math.round((box.height / dims.height) * canvas.height)

    } else if (results.detection && results.landmarks) {
    	// faceapi.draw.drawDetections(canvas.results.detection)
    	resizedResults = faceapi.resizeResults(results, {'width': canvas.width,
    													 'height': canvas.height})
    	box = resizedResults.detection.box
    	x = box.x
    	y = box.y
    	w = box.width
    	h = box.height
    }
}

function drawLandmarks(video, canvas, results) {
	let ctx = canvas.getContext('2d')
	ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (results.landmarks) {
    	resizedResults = faceapi.resizeResults(results, {'width': canvas.width,
    													 'height': canvas.height})
    	faceapi.draw.drawFaceLandmarks(canvas, resizedResults.landmarks)
    }

}

function transformPoint(ogX, ogY, ogW, ogH, newW, newH) {
	let newX = (ogX / ogW) * newW
	let newY = (ogY / ogH) * newH
	return [Math.round(newX), Math.round(newY)]
}

var selector = -1

const faceLines = [
	[0, 1, 2, 3, 4], //chin
	[5, 6, 7], // l eyebrow
	[8, 9, 10], // r eyebrow
	[11, 12, 15, 14, 13], //nose
	[24, 25, 26, 27, 20], //mouth
	[26, 29], //lower lip
	[21, 22, 28], // upper lip 1
	[23, 22], // upper lip 2
	[19, 33, 18, 32, 19], // r eye
	[17, 30, 16, 31, 17] // l eye
]


function drawAffectivaLandmarks(landmarks, canvas) {
	let newW = canvas.width
	let newH = canvas.height

	ctx = canvas.getContext('2d')
	ctx.clearRect(0, 0, newW, newH)


	for (i = 0; i < 34; i++) {
		var x = landmarks[i].x
		var y = landmarks[i].y
		var [newX, newY] = transformPoint(x, y, w, h, newW, newH)
		ctx.beginPath();
      	ctx.arc(newX, newY, 2, 0, 2 * Math.PI, false);
      	ctx.lineWidth = 2;
      	if (i == selector) {
      		ctx.strokeStyle = 'red'
      	} else {
      		ctx.strokeStyle = '#48ffa4';
      	}
      	ctx.stroke();
      	ctx.beginPath();
      	ctx.arc(newX, newY, 8, 0, 2 * Math.PI, false);
      	ctx.lineWidth = 1;
      	if (i == selector) {
      		ctx.strokeStyle = 'red'
      	} else {
      		ctx.strokeStyle = '#48ffa4';
      	}
      	ctx.stroke();
	}

	for (i = 0; i < faceLines.length; i++) {
		line = faceLines[i]
		ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.strokeStyle = '#48ffa4';
		var start = landmarks[line[0]]
		var [newX, newY] = transformPoint(start.x, start.y, w, h, newW, newH)
		ctx.moveTo(newX, newY);
		for (j = 1; j < line.length; j++) {
			var end = landmarks[line[j]]
			var [newX, newY] = transformPoint(end.x, end.y, w, h, newW, newH)
			ctx.lineTo(newX, newY)
		}
		ctx.stroke()
	}
}

function resizeCanvasAndResults(dimensions, canvas, results) {
    const { width, height } = dimensions instanceof HTMLVideoElement
        ? faceapi.getMediaDimensions(dimensions)
        : dimensions
    canvas.width = width
    canvas.height = height
    faceapi.matchDimensions(canvas, {width, height})
    return faceapi.resizeResults(results, { width, height })
}

let Buffer = class {
	constructor(size) {
		this.size = size
		this.data = []
	}

	get average() {
		if (this.data.length) {
		    var sum = this.data.reduce(function(a, b) {return a + b});
		    var avg = sum / this.data.length;
		    return avg
		} else {
			return 0
		}
	}

	push(val) {
		if (this.data.length < this.size) {
			this.data.push(val)
		} else {
			this.data.shift()
			this.data.push(val)
		}
	}
}

let pitch = new Buffer(5);
let roll = new Buffer(5);
let yaw = new Buffer(5);

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(100, 1, 1, 2000);

var renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#rotationCanvas') });
renderer.setSize(300, 300);

var geometry = new THREE.BoxGeometry(100, 100, 100, 1, 1, 1);
var geo = new THREE.EdgesGeometry(geometry);
var mat = new THREE.LineBasicMaterial({color: 'white', linewidth: 3});

var cube = new THREE.LineSegments(geo, mat);

scene.add(cube);

camera.position.z = 120;

function toRad(deg) {
	return deg * (Math.PI / 180)
}

function drawOrientation(results) {
	// requestAnimationFrame(drawOrientation);

	p = toRad(results.pitch)
	pitch.push(p)
	r = toRad(results.roll)
	roll.push(r)
	y = toRad(results.yaw)
	yaw.push(y)

	cube.rotation.x = -pitch.average; //up-down
	cube.rotation.y = yaw.average;
	cube.rotation.z = roll.average;

	renderer.render(scene, camera);
}