Storage.prototype.setObject = function(key, value) {
    this.setItem(key, JSON.stringify(value));
}

Storage.prototype.getObject = function(key) {
    return JSON.parse(this.getItem(key));
}

function clearCache() {
	localStorage.removeItem('identities')
	localStorage.removeItem('descriptors')
	localStorage.removeItem('users')
}

function cacheData() {
	localStorage.setObject("identities", identities)
	localStorage.setObject("descriptors", descriptors)
	localStorage.setObject("users", users)
}

function loadCache() {
	identitiesTemp = localStorage.getObject("identities")
	descriptorsTemp = localStorage.getObject("descriptors")
	usersTemp = localStorage.getObject("users")

	if (!!identitiesTemp) {
		identities = identitiesTemp
	} else {
		console.log("Failed to load identities")
	}
	if (!!usersTemp) {
		users = usersTemp
	} else {
		console.log("Failed to load users")
	}
	if (!!descriptorsTemp) {
		descriptors = descriptorsTemp
		console.log(descriptors)
		descriptors = formatDescriptors(descriptors)
		labeledDescriptors = makeLabeledDescriptors(descriptors)
    	faceMatcher = new faceapi.FaceMatcher(labeledDescriptors)
	} else {
		console.log("Failed to load descriptors")
	}

	console.log("Loaded data")
}

function formatDescriptors(descriptors) {
	newDescriptors = {}
	users = Object.keys(descriptors)

	for (i = 0; i < users.length; i++) {
		u = users[i]
		data = descriptors[u]

		newDescriptors[u] = []
		
		for (j = 0; j < data.length; j++) {
			arr = Object.values(data[j])
			newDescriptors[u].push(new Float32Array(arr))
		}
	}
	return newDescriptors
}


