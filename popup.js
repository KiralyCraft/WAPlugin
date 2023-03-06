const GREET_BACKGROUND_PAGE = false;
const GREET_CONTENT_PAGE = true;

const CONTENT_PAGE_GREETS = 
[
	/*
	 * Notification-like message for all content scripts
	 */
	"action_popup_visible",
	/*
	 * Specially-crafted greet for the plain input detector
	 */
	"action_popup_visible_inputdetect" 
]


var NavigationHistoryWindowID =- 1;

////////// UI OPEREATIONS /////////

/*
 *	Builds a DOM element, where three arguments are required by default. These arguments can either be DOM elements of their own, or strings.
 */
function buildUIEntry(theType,theButton,theAnchor)
{
	var theRow = document.createElement('tr');
	
	var theArray = [theType,theButton,theAnchor];
	
	for (var theIterator in theArray)
	{
		var theTypeElement = document.createElement('td');
		theArrayElement = theArray[theIterator];
		
		if (typeof(theArrayElement) === 'string')
		{
			theTypeElement.innerHTML = theArrayElement;
		}
		else
		{
			theTypeElement.appendChild(theArrayElement);
		}
		theRow.appendChild(theTypeElement);
	}
	
	return theRow;
}

/*
 *	Builds a clickable button that will call the provided function with the given index (identifier).
 */
function buildUIButtonCallback(theFunction,buttonIndex)
{
	var theButton = document.createElement('button');
	theButton.style = 'width:100%';
	theButton.innerHTML = "Show";
	theButton.onclick = function(){theFunction(buttonIndex);}
	
	return theButton;
}

/////////// HANDLERS //////////////

/*
 *	The callback that gets executed when a button is pressed from the list of detected inputs. It is implicitely referred by the button builder routine.
 */
function handleUIButtonCallback(buttonIndex)
{
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {action: 'action_inputdetect_show', data: buttonIndex}, function(theResponse) 
		{
			//A response is not expected
		});
	});
}

/*
 * Handles scenarios for various actions indicated by the content page or background script.
 */
function handleContentResponse(responseAction, responseData)
{
	
	if (responseAction == "action_inputdetect_preview")
	{
		for (var theElementIterator in responseData)
		{
			var theElement = responseData[theElementIterator];
			
			var theInputList = document.getElementById("inputListTable");
			theInputList.appendChild(buildUIEntry(theElement,buildUIButtonCallback(handleUIButtonCallback,theElementIterator),"N/A"));
		}
	}
}

/*
 *	This method checks if the current tab responds to any messages sent from the plugin, since they are not loaded by a content-script.
 * 	It calls the callback with a boolean argument, depending on whether the injectors were loaded when the probe was called.
 */
function probeInjectors(callbackSuccess)
{
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {action: "action_popup_injectors_probe"}, function(theResponse) 
		{
			var lastError = chrome.runtime.lastError;
			
			//This may break in Chrome updates, keep an eye on it
			if (lastError && lastError.message.indexOf("Receiving end does not exist") !== -1) 
			{
				console.log("Injectors are not loaded. Loading them now.");
				buildInjectors();
				callbackSuccess(false);
			} 
			else if (theResponse.action == "action_popup_injectors_probe_reply")
			{
				console.log("Injectors are loaded, we're good");
				callbackSuccess(true);
			}
		});
	});
}
function buildInjectors()
{
	var contentScripts = chrome.runtime.getManifest().lazyContentScripts;
	for (var scriptIndex in contentScripts)
	{
		var scriptName = contentScripts[scriptIndex];
		
		//Ghetto workaround for deep copying this thing
		(function (scriptNameDeep)
		{
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs) 
			{
				chrome.scripting.executeScript({
					target: {tabId: tabs[0].id, allFrames: false},
					files: [ scriptNameDeep ]
				});
			});
		})(scriptName);
	}
}
/*
 * Called when the plugin's UI is loaded and accessible. May be borked on IE8 :)
 */
function buildPluginUI() 
{
	/*
	 * Send a message to the background page - Let it know the thing is open now.
	 */
	if (GREET_BACKGROUND_PAGE)
	{
		chrome.runtime.sendMessage({action: "action_popup_visible"}, function(theResponse) 
		{
			console.log(theResponse);
		});
	}
	
	/*
	 *	Send a message to the content page. A JSONArray response is expected, with unique actions that are to be treated here.
	 *	The content of the JSONArray entry is expected to be an "action" (string field) and a "data" which may be whatever the handler wants.
	 */
	if (GREET_CONTENT_PAGE)
	{
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			
			for (var greetIterator in CONTENT_PAGE_GREETS)
			{				
				chrome.tabs.sendMessage(tabs[0].id, {action: CONTENT_PAGE_GREETS[greetIterator]}, function(theResponse) 
				{
					for (var responseEntry in theResponse)
					{
						handleContentResponse(theResponse[responseEntry].action,theResponse[responseEntry].data);
					}
				});
			}
		});
	}
}

/*
 * Called when the document 
 */
document.addEventListener("DOMContentLoaded", function(event) { 
	probeInjectors(function(successStatus)
	{
		if (successStatus)
		{
			buildPluginUI();
		}
		else
		{
			console.log("Please reopen the popup window. The page is now injected.");
		}
	});
	//buildInjectors(); //Don't always force the building of injectors, because they may already be present

    chrome.storage.local.get(['NavigationHistoryWindowID']).then(async (localObj) => {
    	if (localObj != null) {
    		NavigationHistoryWindowID = localObj.NavigationHistoryWindowID;
    	}
	    console.log('NavigationHistoryWindowID=', NavigationHistoryWindowID);    

		if (NavigationHistoryWindowID !=-1) {
			chrome.windows.get(NavigationHistoryWindowID).then(async (window) => {
				if (window != null) {
					await chrome.windows.remove(NavigationHistoryWindowID);
				}
			})
		}
		
		chrome.windows.create({'focused': false, 'url': 'navigation-history.html', 'type': 'popup', 
			'width': 600, 'height' : 600, left: 100, top: 300}, function(window) {
   				console.log('Navigation history popup created. WindowID=', window.id);
   				window.alwaysOnTop = false;
   				NavigationHistoryWindowID = window.id;
           		chrome.storage.local.set(
               		{"NavigationHistoryWindowID": NavigationHistoryWindowID},  
           		);
   		});
	});
});

/*
 * Asta merge la conceptDetect-SELECT_ALL, temporar
 */
document.querySelector('#DetectTablesButton').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) 
	{
		let tableDetectionAlgorithm = document.querySelector( 'input[name="tableDetectionAlgorithm"]:checked').value;
		let tableDetectionParameters = {};
		
		if (tableDetectionAlgorithm === "standard")
		{
			tableDetectionParameters.algorithm = "standard";
		}
		else if (tableDetectionAlgorithm === "alternative")
		{
			tableDetectionParameters.algorithm = "alternative";
		}
		
		chrome.tabs.sendMessage(tabs[0].id, {request: 'message_popup_page_detectTables',parameters:tableDetectionParameters});
	});
});

console.log("In POPUP.JS");

document.querySelector('#processDOMDifferenceButton').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {request: 'message_popup_page_processDOMDifference'}, 
            function(responseMessage) {
                console.log("Popup.js RESPONSE:", responseMessage);
                if (responseMessage.response == "message_page_popup_primaryNavigationBlockDetected") {
                    //const preLeafNode = responseMessage.preLeafNode.split("|");
                    //const preLeafNode = responseMessage.preLeafNode;
                    document.querySelector("#navigationMap").innerHTML = 
                  		"<p>[" + "preLeafNode" + "] -> [Concept: " + responseMessage.concept + ", Operation: " + 
                        responseMessage.operation + "]</p>";
                }
        });
    });
});

document.querySelector('#undoHighlightInputsButton').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {request: 'message_popup_page_undoHighlightInputs'}, 
                                function(response) {});
    });
});

document.querySelector('#undoHighlightTextInputAssociationsButton').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {request: 'message_popup_page_undoHighlightTextInputElemAssociations'}, 
                                function(response) {});
    });
});

document.querySelector('#showNavigationHistoryButton').addEventListener('click', function() {
	chrome.runtime.sendMessage({action: "action_popup_visible"}, function(theResponse) 
	{
			console.log(theResponse);
	});
});


document.querySelector('#debugButton').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {request: 'message_popup_page_debug'}, 
                                function(response) {});
    });
});


chrome.runtime.onMessage.addListener(function(receivedMessage, sender, sendResponse) {
    /* We use the following format for messages background <-> page :
     * sendMessage({ request : "message_[fisier sursa]_[fisier destinatie]_[actiune/metoda]", parameters: ... } )
     * sendMessage({ response : "message_[fisier sursa]_[fisier destinatie]_[actiune/metoda]", parameters: ... } )
     */

     console.log("********** DEBUG: message received:", receivedMessage);
    
    if (receivedMessage.request == "message_page_popup_UIOperationStarted") {
    	document.querySelector("#status-message").innerHTML="Processing...";
    	document.querySelector(".progress-allgreen").style.display = "none";
    	document.querySelector(".progress").style.display = "block";
    } else if (receivedMessage.request == "message_page_popup_UIOperationCompleted") {
    	document.querySelector("#status-message").innerHTML="Waiting UI operation..";
    	document.querySelector(".progress-allgreen").style.display = "block";
    	//document.querySelector(".progress").style.display = "none";
    } else if (receivedMessage.request =="message_page_popup_operationDetected") {
    	document.querySelector("#navigationMap").innerHTML = 
                  		"<p>[" + "preLeafNode" + "] -> [Concept: " + receivedMessage.concept + ", Operation: " + 
                        receivedMessage.operation + "]</p>";
    }
});
