let currentSlide = 0;

slides = ['slide0', 'slide1', 'slide2', 'slide3', 'slide4']


let glider;
window.addEventListener('load', function() {
	glider = new Glider(document.getElementById('glider'), {
		slidesToShow: 1,
		dots: '#dots'
	});

	document.querySelector('.glider').addEventListener('glider-slide-visible', function(event){
		if (event.detail.slide == 2) {
			$("#nameInput").select()
		} else if (event.detail.slide == 3) {

			$("#nameInput").blur()
			setTimeout(() => newUserCapture(), 200)
		}
		
	})
})


function newUserInit() {
	bindKeys()
}

function bindKeys() {
	$(document).off('keydown')
	$(document).keydown(function(e) {
		if (e.keyCode == 13) {
			if (currentSlide == 2) {
				tempUserName = $("input").val()

				if (users.includes(tempUserName)) {
					$("#inputText").text("Dieser Name ist bereits vergeben.")
				} else {
					glider.scrollItem(++currentSlide)
				}

			} else if (currentSlide < 4) {
				glider.scrollItem(++currentSlide)
			} else {
				startTracking()
			}
			
		} else if (e.keyCode == 27) {
			abort()
		}
	})
}

async function newUserCapture() {
	showVideo()
	setTimeout(() => clearLandmarks())
	countdown = $('#countdown')
	countdown.text("5")

	function timer(n) {
		if (n == 0) {
			countdown.text("")
			capture()
		} else {
			setTimeout(() => countdown.text(n-1), 1000)
			setTimeout(() => timer(n-1), 1000)
		}
	}

	timer(5)

	mode = 'userCapture'
	play()
	let progress = 0

	function capture() {
		scan()
		const intervalTime = 200
		const interval = setInterval(async function(){
			faceAPIResults = await play()
			console.log(faceAPIResults)
			if (faceAPIResults && faceAPIResults.length == 1) {	
				userData.descriptors.push(faceAPIResults[0].descriptor)
				userData.age.push(faceAPIResults[0].age)
				userData.gender.push({
					'gender': faceAPIResults[0].gender,
					'confidence': faceAPIResults[0].genderProbability
				})
				progress += 10

				$('#userCaptureProgress').width(Math.min(100, progress).toString() + '%')
				$('#userCaptureProgressLabel').text(Math.min(100, progress).toString() + '%')
			}
		}, intervalTime);

		setTimeout(() => {
			clearInterval(interval);
			checkCapture()
		}, 3000)
	}

	function checkCapture() {
		if (userData.descriptors.length < 5) {
			capture()
		} else {
			stopScan()
			$('#userCaptureProgress').width('100%')
			$('#userCaptureProgressLabel').text('100%')
			setTimeout(() => compileCapture(), 500)
		}
	}
}

function compileCapture() {
	newUserStats()
	glider.scrollItem(++currentSlide)
}

function startTracking() {
	capitalize = (s) => {
		if (typeof s !== 'string') return ''
		return s.charAt(0).toUpperCase() + s.slice(1)
	}

	currentUser = userName
	$('#name').text(userName)
	$('#age').text(identities[userName].ageEst)
	$('#gender').text(capitalize(identities[userName].genderEst))

	resetNewUser()

	$(document).keydown('off')
	$(document).keydown(function(e) {
		if (e.keyCode == 27) {
			abort()
		}
	})
    mode = 'tracking'
    switchScreen('newUser', 'tracking')
    setTimeout(() => play())
}

function resetNewUser() {
	hideVideo()
	$(document).off('keydown')
	currentSlide = 0
	glider.scrollItem(0)

	userData = userDataTemplate()
	userName = null
	document.querySelector("input").value = ''
	$("#inputText")[0].innerHTML = "<strong>Bestätige</strong> die Eingabe der <strong>Enter-Taste</strong>."

	$('#userName').text('')
	$('#userAge').text('')
	$('#userGender').text('')
	$('#userCaptureProgress').width('0%')
	$('#userCaptureProgressLabel').text('0%')
}

function newUserStats() {
	ageAvg = average(userData.age)
	var ageEst;
	if (ageAvg < 5) {
		ageEst = '0-5'
	} else if (ageAvg < 15) {
		ageEst = '5-15'
	} else if (ageAvg < 25) {
		ageEst = '15-25'
	} else if (ageAvg < 35) {
		ageEst = '25-35'
	} else if (ageAvg < 45) {
		ageEst = '35-45'
	} else if (ageAvg < 55) {
		ageEst = '45-55'
	} else if (ageAvg < 65) {
		ageEst = '65-80'
	} else {
		ageEst = '80+'
	}

	maleConfidence = 0
	femaleConfidence = 0

	for (i=0; i< 5; i++) {
		g = userData.gender[i]
		if (g.gender == 'male') {
			maleConfidence += g.confidence
			femaleConfidence += 1 - g.confidence
		} else if (g.gender == 'female') {
			femaleConfidence += g.confidence
			maleConfidence += 1 - g.confidence
		}
	}

	var genderEst;
	if (maleConfidence > femaleConfidence) {
		genderEst = 'männlich'
	} else {
		genderEst = 'weiblich'
	}

	userData.ageEst = ageEst
	userData.genderEst = genderEst

	$("#userAge").text(ageEst)
	$("#userGender").text(genderEst)
	userName = $("input").val()
	$("#userName").text(userName)

	registerUser()
}

function average(arr) {
	if (arr.length) {
	    var sum = arr.reduce(function(a, b) {return a + b});
	    var avg = sum / arr.length;
	    return avg
	} else {
		return 0
	}
}

function makeLabeledDescriptors(identities) {
    labeledDescriptors = []

    for (id in identities) {
        labeledDescriptors.push(new faceapi.LabeledFaceDescriptors(id, identities[id]))
    }

    return labeledDescriptors
}

function registerUser() {
	identities[userName] = userData
	descriptors[userName] = userData.descriptors
	labeledDescriptors = makeLabeledDescriptors(descriptors)
    faceMatcher = new faceapi.FaceMatcher(labeledDescriptors)

    cacheData()
    console.log("Saved user: ", userName)
}


function loadUser(name) {
	currentUser = name
	$('#name').text(name)
	$('#age').text(identities[name].ageEst)
	$('#gender').text(identities[name].genderEst)
}

function abort() {
	if (mode == 'tracking') {
		switchScreen('tracking', 'idle')
		draw()
	} else if (mode == 'newUser') {
		switchScreen('newUser', 'idle')
		draw()
	}
	
	resetNewUser()
	return setTimeout(() => {mode = 'idle'; play()}, 3000)
}