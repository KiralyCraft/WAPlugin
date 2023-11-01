

function clickTrigger(target, delay=1000) {
	if (target==null) {
		console.log("clickTrigger(): target is null!");
	}
	const event = new MouseEvent('click', {
    	view: window,
    	bubbles: true,
    	cancelable: true
  	});

	return new Promise(function(resolve, reject) {
		// Dispatch the event
		//let timeoutID = window.setTimeout(function() {target.dispatchEvent(event)}, delay);
		target.dispatchEvent(event);
		//target.click();
		console.log("clickTrigger(): Debug ...");
		resolve("");
	});
}

function blurTrigger(target, delay=1000) {
	if (target==null) {
		console.log("clickTrigger(): target is null!");
	}
	const event = new MouseEvent('blur', {
    	view: window,
    	bubbles: true,
    	cancelable: true
  	});

	return new Promise(function(resolve, reject) {
		// Dispatch the event
		//let timeoutID = window.setTimeout(function() {target.dispatchEvent(event)}, delay);
		target.dispatchEvent(event);
		//target.click();
		console.log("blurTrigger(): Debug ...");
		resolve("");
	});
}

