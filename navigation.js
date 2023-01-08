function createClickNavElement(navigationStep) {
	let div = document.createElement("div");
	let span = document.createElement("span");
	span.appendChild(document.createTextNode("Operation: "));
	div.appendChild(span);
	span = document.createElement("span");
	span.setAttribute('class', 'navliteral');
	span.appendChild(document.createTextNode("Click"));
	div.appendChild(span);
	let br = document.createElement("br");
	div.appendChild(br);

	span = document.createElement("span");
	span.appendChild(document.createTextNode("Clicked element: "));
	div.appendChild(span);
	span = document.createElement("span");
	span.setAttribute('class', 'navliteral');
	span.appendChild(document.createTextNode(navigationStep.target));
	div.appendChild(span);
	br = document.createElement("br");
	div.appendChild(br);

	span = document.createElement("span");
	span.appendChild(document.createTextNode("Clicked element text: "));
	div.appendChild(span);
	span = document.createElement("span");
	span.setAttribute('class', 'navliteral');
	span.appendChild(document.createTextNode(navigationStep.targetText));
	div.appendChild(span);

	div.setAttribute('class', 'clicknav');
	return div;
}

function createSelectAllNavElement(navigationStep) {
	let div = document.createElement("div");
	let span = document.createElement("span");
	span.appendChild(document.createTextNode("Operation: "));
	div.appendChild(span);
	span = document.createElement("span");
	span.setAttribute('class', 'navliteral');
	span.appendChild(document.createTextNode("SELECTALL"));
	div.appendChild(span);
	let br = document.createElement("br");
	div.appendChild(br);

	span = document.createElement("span");
	span.appendChild(document.createTextNode("Concept: "));
	div.appendChild(span);
	for(let i=0; i<navigationStep.concept.length; i++) {
		span = document.createElement("span");
		span.setAttribute('class', 'navliteral');
		span.appendChild(document.createTextNode(navigationStep.concept[i]+" "));
		div.appendChild(span);
	}

	div.setAttribute('class', 'selectallnav');
	return div;
}

function createBasicNavElement(navigationStep) {
	let div = document.createElement("div");
	let span = document.createElement("span");
	span.appendChild(document.createTextNode("Operation: "));
	div.appendChild(span);
	span = document.createElement("span");
	span.setAttribute('class', 'navliteral');
	span.appendChild(document.createTextNode(navigationStep.operation));
	div.appendChild(span);
	let br = document.createElement("br");
	div.appendChild(br);

	span = document.createElement("span");
	span.appendChild(document.createTextNode("Concept: "));
	div.appendChild(span);
	span = document.createElement("span");
	span.setAttribute('class', 'navliteral');
	span.appendChild(document.createTextNode(navigationStep.concept));
	div.appendChild(span);

	div.setAttribute('class', 'basicnav');
	return div;
}


function drawArrow() {
	let canvas = document.createElement("canvas");
	canvas.style.height = "100px";
	canvas.style.width = "200px";
	if (!canvas.getContext) {
        return;
    }
    const ctx = canvas.getContext('2d');

    // set line stroke and line width
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;

    // draw a red line
    ctx.beginPath();
    ctx.moveTo(100, 20);
    ctx.lineTo(100, 90);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(90, 70);
    ctx.lineTo(100, 90);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(110, 70);
    ctx.lineTo(100, 90);
    ctx.stroke();

    return canvas;
}


window.onload = function() {
	document.querySelector("#showBtn").addEventListener('click', function(event) {
		chrome.runtime.sendMessage({request: "message_navigationhistory_background_getNavigationHistory"},
			function(response) {
				console.log("navHistory:", response);
				//document.querySelector("#nav").innerHTML=response;
				let navDiv = null;
				response.forEach(function(navigationStep) {
					switch(navigationStep.operation) {
						case 'Click':
							navDiv = createClickNavElement(navigationStep);
							break;
						case 'INSERT':
						case 'UPDATE':
						case 'DELETE':
							navDiv = createBasicNavElement(navigationStep);
							break;
						case 'SELECTALL':
							navDiv = createSelectAllNavElement(navigationStep);
							break;
						case "Generic DOM":
							navDiv = createBasicNavElement(navigationStep);
							break;
						default:
					}
					if (navDiv!=null) {
						document.querySelector("#nav").appendChild(navDiv);
						document.querySelector("#nav").appendChild(drawArrow());
					}
				})
			}
		);
	});
}
