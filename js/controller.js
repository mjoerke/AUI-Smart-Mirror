// which mode the UI is currently in
// mode = 'loading' | 'idle' | 'recognition' | 'newUser' | 'userCapture' | tracking'

let mode = 'loading';

async function play() {
	// Load models, wait until both return first result.
	// Will not initiate unless someone is standing infront of the screen.
	if (mode == 'loading') {
		if (!isFaceAPILoaded() && !affdexLoaded) {
			return setTimeout(() => play());
		}

		loop = setTimeout(() => play(), 250)

		faceAPIResults = await getFaceAPIResults(mode)
		if (faceAPIResults && !faceAPILoaded) {
			faceAPILoaded = true;
			$('#faceAPILoaded').css('color', 'lime')
			console.log("FaceAPI Loaded")
		}

		if (affdexResults && !affdexLoaded) {
			affdexLoaded = true;
			$('#affdexLoaded').css('color', 'lime')
			console.log("Affdex Loaded")
		}

		if (faceAPIResults && affdexResults) {
			console.log(faceAPIResults, affdexResults)
			clearTimeout(loop)
			mode = 'idle'
			switchScreen('loading', 'idle');
			// mode = 'tracking'
			// switchScreen('loading', 'tracking')
			hideVideo()
			return setTimeout(() => play(), 2000)
		}

	} else if (mode == 'idle') {
		loadCache()
		faceAPIResults = await getFaceAPIResults(mode)

		if (faceAPIResults) {
			area = faceAPIResults.box.area
			console.log("AREA: ", area)

			if (area > IDLE_THRESHOLD) {
				mode = 'recognition'
				return setTimeout(() => play());
			}
		}

		return setTimeout(() => play(), 250);

	} else if (mode == 'recognition') {
		console.log("recognizing user...")
		faceAPIResults = await getFaceAPIResults(mode)

		if (!faceAPIResults) {
			return setTimeout(() => play())
		}

		if (faceMatcher) {
			matchResult = faceMatcher.findBestMatch(faceAPIResults.descriptor)
			console.log(matchResult)

			if (matchResult.label != 'unknown' &&
				matchResult.distance < IDENTITY_DISTANCE_THRESHOLD) {

				name = matchResult.label
				loadUser(name)
				mode = 'tracking'
				switchScreen('idle', 'tracking')
				clearInterval(idleLoop)
				return setTimeout(() => play())
			}
		}

		setTimeout(() => newUserInit(), 0)
		switchScreen('idle', 'newUser')
		clearInterval(idleLoop)
		mode = 'newUser'
		return setTimeout(() => play());

	} else if (mode == 'newUser') {
		if (currentSlide == 3) {
			mode = 'userCapture'
			requestAnimationFrame(clearLandmarks)
		} else {

			faceAPIResults = await getFaceAPIResults(mode)
			return setTimeout(() => play());
		}
	} else if (mode == 'userCapture') {
		faceAPIResults = await getFaceAPIResults(mode)
		// if (faceAPIResults) {
		// 	drawLandmarks(video, overlay, faceAPIResults)
		// }
		return faceAPIResults
	} else if (mode == 'tracking') {
		faceAPIResults = await getFaceAPIResults(mode)

		if (faceAPIResults) {
			maintain()
			matchResult = faceMatcher.findBestMatch(faceAPIResults.descriptor)
			name = matchResult.label

			if (name != currentUser) {
				console.log(name)
				if (name == 'unknown') {
					unknownUserTimer = setTimeout(() => unknownUser(), 2000)
				} else {
					loadUser(name)
					mode = 'tracking'
					clearTimeout(unknownUserTimer)
				}
			} else {
				clearTimeout(unknownUserTimer)
			}
		}
		return setTimeout(() => play())
	}
}

let active = null;

function maintain() {
	if (active) {
		clearTimeout(active)
	}

	active = setTimeout(() => abort(), 4000)
}

let unknownUserTimer = null;

function unknownUser() {
	clearTimeout(active)
	currentUser = null
	mode = 'newUser'
	newUserInit()
	switchScreen('tracking', 'newUser')
}

play()
hideVideo()