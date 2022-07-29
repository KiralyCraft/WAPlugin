

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

console.log("Start of page.js pentru Alex.");
console.log(DataModel);

//chrome.runtime.sendMessage({text: "Start Message: Content.js is up and ready."});


chrome.runtime.onMessage.addListener(function(receivedMessage, sender, sendResponse) {

    /* 4est: after I reload the plugin, I must refresh the tab http://172.30.3.49:5555/CRMEndava/
     * because otherwise the page.js is not loaded in the context of this tab
     */
    console.log("Message received by content script:", receivedMessage);
    
    //chrome.runtime.sendMessage({response: "OK1"});

    // var origOpen = XMLHttpRequest.prototype.open;
    // XMLHttpRequest.prototype.open = function() {
    //     console.log('Ajax request started!');
    //     this.addEventListener('load', function() {
    //         console.log('Ajax request completed!');
    //         console.log('Ajax request ready state: ' + this.readyState);
    //         console.log('Ajax request response from the server: ' + this.responseText);
    //     });
    //     origOpen.apply(this, arguments);
    // };

    // $(document).ajaxSuccess(
    //     function(event, xhr, settings){
    //         console.log('Ajex call: ' + xhr.responseText);
    //     }
    // );

    // $.ajaxSetup({
    //     beforeSend: function() {
    //         //do stuff before request fires
    //         console.log('It works!');
    //     }
    // });
	
    if (receivedMessage.action == "updatePhantomDOM") {
        detectDOMDifference();
        saveDOMtoLocalStorage();
        // Log FullDOMstring on console
        // console.log("FullDOMstring=");
        // chrome.storage.local.get(/* String or Array */["FullDOMstring"], function(items){
        //    console.log(items);
        // });
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
      let innerText = window.frames[0].document.body.innerText;

      let FullDOMstring = JSON.stringify(fullDOM);
      console.log("FullDOMstring (as string):", FullDOMstring);

      console.log("FullDOMstring (as JSON):", fullDOM);
      
      // save DOM string to local storage
      chrome.storage.local.set({ "FullDOMstring": FullDOMstring }, function(){} );
      
      // give each tag element TaskMate custom attributes
      walkDOM(document.body);
}

function detectDOMDifference() {
    let fullDOM = window.frames[0].document.body.innerHTML;
    let innerText = window.frames[0].document.body.innerText;
    let textContent = getInnerTextElements(window.frames[0].document.body);
    
    console.log(innerText);


    // detect concepts in inner text content
    let detectedConcept = detectConcept(innerText);
    console.log("Concept detected: ", detectedConcept);
}

function walkDOM(main) {
    //var arr = [];
    let taskmateID = 1;
    var loop = function(main) {
        
        do {
            //arr.push(main);
            if (main.nodeType == 1) {    // ignore text nodes
                //console.log("setting custom attribute for", main);
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

function getInnerTextElements(root) {
    let textNodes = []
    root.querySelectorAll("*").forEach(function(item) {
        //console.log(item.children.length,item.childNodes.length,item);
        if ((item.children.length==0) && (item.childNodes.length==1)
            && (item.tagName != "SCRIPT") && (item.innerText.trim().length >0)) {
            console.log(item.children.length,item.childNodes.length,item.innerText,item);
            textNodes.push(item.innerText);
        }
    })
    console.log("textNodes=", textNodes);
    return textNodes;
}


function detectConcept(text) {
    let detectedConcept = "";

    for (concept in DataModel) { 
        console.log(concept, DataModel[concept]);
        let occurences = 0;
        for (property of DataModel[concept]) {
            if (text.includes(property)) occurences++;
            console.log(property, occurences);
        };
        console.log("occurences=", occurences, " noOfProperties=", DataModel[concept].length);
        if (occurences==DataModel[concept].length) {
            detectedConcept = concept;
        }
    }

    return detectedConcept;
};
