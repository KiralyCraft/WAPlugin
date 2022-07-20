// send a message to the background page containing whatever message (even an object)

/*function sendMessage(message) {
    console.log(window.location.href);
    console.log(message);

    chrome.runtime.sendMessage(message);
}


var originalXHR = XMLHttpRequest;
XMLHttpRequest = function()
{
    var ret = new originalXHR();
    ret.addEventListener('load', function()
    {
        console.log('Ajax request finished!');
    });
    return ret;
};

// do whatever business logic here
$(document).ready(function () {
    sendMessage(document);
});
*/

console.log("Start of content.js ");

chrome.runtime.sendMessage({text: "Start Message: Content.js is up and ready."});


chrome.runtime.onMessage.addListener(function(receivedMessage, sender, sendResponse) {
	console.log("Page.js: Message received by content script:", receivedMessage);
	
	if (receivedMessage.action == "updatePhantomDOM") 
	{
		saveDOMtoLocalStorage();
		chrome.storage.local.get(/* String or Array */["FullDOMstring"], function(items){
			console.log(items);
		});
		sendResponse({response: "Phantom DOM updated successfully."});
	}
	else if (receivedMessage.action == "action_popup_visible")
	{
        //Do not handle
	}
	else if (receivedMessage.action == "action_popup_visible_inputdetect")
	{
        //Do not handle
	}
	else if (receivedMessage.action == "action_popup_injectors_probe_reply")
    {
        //Avoid replying to this, because the hotProbeResponder will.
    }

});


function saveDOMtoLocalStorage() {
      //let fullDOM = document.body.innerHTML;
      // consider only the DOM of the iframe:
      let fullDOM = window.frames[0].document.body.innerHTML;
      

      let FullDOMstring = JSON.stringify(fullDOM);
      console.log("FullDOMstring:", FullDOMstring);

      // save DOM string to local storage
      chrome.storage.local.set({ "FullDOMstring": FullDOMstring }, function(){} );


      // give each tag element TaskMate custom attributes
      walkDOM(document.body);
}


function walkDOM(main) {
    //var arr = [];
    let taskmateID = 1;
    var loop = function(main) {
        
        do {
            //arr.push(main);
            if (main.nodeType == 1) {    // ignore text nodes
                console.log("setting custom attribute for", main);
                main.setAttribute("taskmateID", taskmateID);
                taskmateID ++;
            }

            if(main.hasChildNodes())
                loop(main.firstChild);
        }
        while (main = main.nextSibling);
    }
    loop(main);
    //return arr;
}

