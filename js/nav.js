var screens = {
	"loading": "#loadingScreen",
	"idle": "#idleScreen",
	"recognition": '#recognitionScreen',
	"newUser": "#newUserScreen",
	"tracking": "#trackingScreen"
};

function switchScreen(src, tgt) {
	srcId = screens[src]
	tgtId = screens[tgt]
	console.log(`${src} --> ${tgt}`)
	$(srcId).addClass('hiddenScreen')
	$(tgtId).removeClass('hiddenScreen')
	$(srcId).removeClass('visibleScreen')
	$(tgtId).addClass('visibleScreen')
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}