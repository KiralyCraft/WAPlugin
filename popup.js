
import {Settings} from './general-settings.js';
import {probeContentScripts, injectContentScripts} from './background-utils.js';
import {RecordedPrimaryBlocks} from "./contentScripts/01-primaryBlocks.js";


/**************** Code for injecting the lazy scripts into current Document *************************/


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
		let theArrayElement = theArray[theIterator];
		
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
 * Called when the document is loaded
 */
document.addEventListener("DOMContentLoaded", async function(event) { 
	console.log("Popup.js: DOMContentLoaded event was triggered.");
	const successStatus = await probeContentScripts();
	//console.log("Popup.js: DOMContentLoaded event: probeContentScripts status=", successStatus);
	if (successStatus)
	{
		buildPluginUI();
	}
	else
	{
		console.log("Please reopen the popup window. The page is now injected.");
	}

    chrome.storage.local.get(['NavigationHistoryWindowID']).then(async (localObj) => {
    	if (localObj != null) {
    		NavigationHistoryWindowID = localObj.NavigationHistoryWindowID;
    	}
	    console.log('NavigationHistoryWindowID=', NavigationHistoryWindowID);    

		if ((NavigationHistoryWindowID !=-1) && (NavigationHistoryWindowID != null)) {
			chrome.windows.get(NavigationHistoryWindowID).then(async (window) => {
				if (window != null) {
					await chrome.windows.remove(NavigationHistoryWindowID);
				}
			})
		}
		
		// TODO - we should create this window by clicking a button, not automatically. For now it is commented out.
		/*chrome.windows.create({'focused': false, 'url': 'navigation-history.html', 'type': 'popup', 
			'width': 600, 'height' : 600, left: 100, top: 300}, function(window) {
   				console.log('Navigation history popup created. WindowID=', window.id);
   				window.alwaysOnTop = false;
   				NavigationHistoryWindowID = window.id;
           		chrome.storage.local.set(
               		{"NavigationHistoryWindowID": NavigationHistoryWindowID},  
           		);
   		});*/
	});
	return true;
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

console.log("In popup.js");



/******************** Code for communication with other parts of the plugin ******************/

chrome.runtime.onMessage.addListener(function(receivedMessage, sender, sendResponse) {
    /* We use the following format for messages background <-> page :
     * sendMessage({ request : "message_[fisier sursa]_[fisier destinatie]_[actiune/metoda]", parameters: ... } )
     * sendMessage({ response : "message_[fisier sursa]_[fisier destinatie]_[actiune/metoda]", parameters: ... } )
     */

     console.log("Popup.js: message received:", receivedMessage);
    
    if (receivedMessage.request == "message_page_popup_UIOperationStarted") {
    	document.querySelector("#status-message").innerHTML="Processing...";
    	document.querySelector(".progress-allgreen").style.display = "none";
    	document.querySelector(".progress").style.display = "block";
    } else if (receivedMessage.request == "message_page_popup_UIOperationCompleted") {
    	document.querySelector("#status-message").innerHTML="Waiting UI operation..";
    	document.querySelector(".progress-allgreen").style.display = "block";
    	//document.querySelector(".progress").style.display = "none";
    } else if (receivedMessage.request =="message_page_popup_operationDetected") {
    	//const preLeafNode = responseMessage.preLeafNode.split("|");
        //const preLeafNode = responseMessage.preLeafNode;
    	document.querySelector("#navigationMap").innerHTML = 
                "<p>[" + "preLeafNode" + "] -> [Concept: " + receivedMessage.concept + ", Operation: " + 
                receivedMessage.operation + "]</p>";
    }
});




/****************************** Various event listeners for popup's UI *****************************/

/* Code for the tab-based navigation */
document.querySelectorAll(".tabs > #tabsHeader > span").forEach(function(tabheader) {
	console.log("adding click event listener to ", tabheader);
	tabheader.addEventListener('click', function(event) {
		document.querySelectorAll(".tabs > #tabsHeader > span").forEach(function(tabheader) {
			tabheader.classList.remove("activetab");
		})
		tabheader.classList.add("activetab");
		let targetTab = tabheader.getAttribute("targetTab");
		document.querySelector("#debug").style.display = "none";
		document.querySelector("#guidedBrowsing").style.display = "none";
		document.querySelector("#automaticBrowsing").style.display = "none";
		document.querySelector("#automaticExecution").style.display = "none";

		document.querySelector("#"+targetTab).style.display = "block";

	})
})


document.querySelector('#processDOMDifferenceButton').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {request: 'message_popup_page_processDOMDifference'}, 
            function(response) {});
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
	chrome.storage.local.get(['NavigationHistoryWindowID']).then(async (localObj) => {
    	if (localObj != null) {
    		NavigationHistoryWindowID = localObj.NavigationHistoryWindowID;
    	}
	    console.log('NavigationHistoryWindowID=', NavigationHistoryWindowID);    

		if ((NavigationHistoryWindowID != -1) && (NavigationHistoryWindowID != null)) {
			chrome.windows.get(NavigationHistoryWindowID)
				.then (async (window) => {
					if (window != null) {
						console.log("#showNavigationHistoryButton click handler: " +
								"NavigationHistoryWindow state=" + window.state);
					}
				}).catch ((error) => {
					// probably the navigation history window was closed (destroyed) => create the window
					console.log("Error getting the NavigationHistory window: ", error);
					chrome.windows.create({'focused': false, 'url': 'navigation-history.html', 'type': 'popup', 
						'width': 600, 'height' : 600, left: 100, top: 300}, function(window) {
   						console.log('Navigation history popup created. WindowID=', window.id);
   						window.alwaysOnTop = false;
   						NavigationHistoryWindowID = window.id;
           				chrome.storage.local.set(
               				{"NavigationHistoryWindowID": NavigationHistoryWindowID}  
           				);
   					});
				});
		} else {
			// there is no navigation history window => create it
			chrome.windows.create({'focused': false, 'url': 'navigation-history.html', 'type': 'popup', 
				'width': 600, 'height' : 600, left: 100, top: 300}, function(window) {
   					console.log('Navigation history popup created. WindowID=', window.id);
   					window.alwaysOnTop = false;
   					NavigationHistoryWindowID = window.id;
           			chrome.storage.local.set(
               			{"NavigationHistoryWindowID": NavigationHistoryWindowID}  
           			);
   			});
		}
	});
});


document.querySelector('#debugButton').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {request: 'message_popup_page_debug'}, 
                                function(response) {});
    });
});

document.querySelector('#startPrimaryBlockButton').addEventListener('click', function() {
	console.log("Start recording primary block...");
	// send message to background
	chrome.runtime.sendMessage({request: 'message_popup_background_StateChanged', state: "Guided browsing"});
	// send message to page
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {request: 'message_popup_page_StateChanged', 
        						state: "Guided browsing"}, function(response) {});
    });
    document.querySelector('#startPrimaryBlockButton').style.display = "none";
    document.querySelector('#endPrimaryBlockButton').style.display = "block";
});

document.querySelector('#endPrimaryBlockButton').addEventListener('click', function() {
	console.log("End recording primary block...");
    document.querySelector('#endPrimaryBlockButton').style.display = "none";
    document.querySelector('#startPrimaryBlockButton').style.display = "block";

    /*chrome.runtime.sendMessage({request: "message_popup_background_getPrimaryBlockRecording"},
		function(response) {
			console.log("PrimaryBlockRecording:", response);
			document.querySelector("#PrimaryBlockJSON").innerHTML = JSON.stringify(response);		
		}
	);*/
});

document.querySelector('#finalizeStep').addEventListener('click', function() {
	console.log("Click on finalization step...");
    
    chrome.runtime.sendMessage({request: 'message_popup_background_FinalizeStepState', 
    		state: document.querySelector('#finalizeStep').checked});
});

document.querySelector('#startAutomaticBrowsingButton').addEventListener('click', function() {
	console.log("Start automatic mapping of a website...");
	// send message to background
	chrome.runtime.sendMessage({request: 'message_popup_background_StateChanged', state: "Automatic browsing"});
	// send message to page
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {request: 'message_popup_page_StateChanged', 
        						state: "Automatic browsing"}, function(response) {});
    });
    
});

document.querySelector('#executeProcessButton').addEventListener('click', function() {
	console.log("Popup.js: Automatic execution started...");
	// send message to background
	chrome.runtime.sendMessage({request: 'message_popup_background_StateChanged', state: "Automatic execution"});
	// 1. codul de mai jos executa un singur bloc primar (merge)
	/*chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {request: 'message_popup_page_StateChanged', 
        						state: "Automatic execution"}, function(response) {});
    });*/
    // 2. codul asta executa 2 blocuri primare in succesiune (merge)
	(async () => {
		console.log("Popup.js: Starting executing the first primary block!");
    	//await executeProcess(JSON.parse(document.querySelector("#processDescription").value));
    	await executeProcess(InsertAccount_PrimaryBlock);
    	await pause(10000);
    	console.log("Popup.js: Starting executing the second primary block!");
    	//await executeProcess(JSON.parse(document.querySelector("#processDescription").value));
    	await executeProcess(InsertAccount_PrimaryBlock);
    	//await pause(10000);  	
    })();

    // 3. codul asta executa un proces complex dat de user in "Automatic execution" tab of the Popup (de testat)
    /* Ex. de proces complex dat de user in "Automatic execution" tab din Popup:
    	[
			// an InsertAccount_PrimaryBlock
			{concept: "Account", operation: "INSERT", parameters:{"Account Name":"UBBtest","Phone":"00000000000", 
   					"Fax":"00000000000","Website":"www.ubbcluj.ro","Parent Account":"", "Ticker Symbol":"a", 
			  		"Address":"Str.M.Kogalniceanu,Cluj", "Description":"University", "Industry":"Academic","SICCode":"00000","Ownership":""}},
			// an UpdateAccount_PrimaryBlock of the Account Name "UBBtest" ("Account Name" is the key of the entity)
			{concept: "Account", operation: "UPDATE", parameters:{"Account Name":"UBBtest","Phone":"00000000000", 
   					"Fax":"00000000000","Website":"www.ubbcluj.ro","Parent Account":"", "Ticker Symbol":"a", 
			  		"Address":"Str.M.Kogalniceanu,Cluj", "Description":"University", "Industry":"Academic","SICCode":"00000","Ownership":""}},
			// an SelectAllAccount_PrimaryBlock
			{concept: "Account", operation: "SELECTALL"}
		];
	*/
	/*let complexProcess = JSON.parse(document.querySelector("#processDescription").value);
    for (let primaryBlockSpec of complexProcess) {
    	let primaryBlockKey = primaryBlockSpec.operation + " " + primaryBlockSpec.concept;
    	if !(primaryBlockKey in RecordedPrimaryBlocks) {
    		console.log("Popup.js: automatic execution: there is no recorded ", primaryBlockKey, " primary block");
    	} else {
    		let primaryBlock = RecordedPrimaryBlocks[primaryBlockKey];
    		(async () => {
				console.log("Popup.js: Starting executing a primary block!");
    			await executeProcess(primaryBlock);
    			await pause(10000);
    			console.log("Popup.js: End executing the primary block!");  	
    		})();	
    	}
	}*/

    console.log("Popup.js: Automatic execution ended.");
    return true;
});


/******* Codul acesta e temporar aici si ar trebui mutat intr-un fisier separat !!!!!!! ******/
var InsertAccount_PrimaryBlock = [ 
	{operation:"Click", target: "IMG#homeButtonImage/ SPAN.navTabButtonImageContainer/ A#HomeTabLink/ SPAN#TabHome/ DIV#navTabGroupDiv/ DIV#navBar/ DIV#crmMasthead/ ", targetText : ""}, 
	{concept: "", operation : "Generic DOM"}, 
	{operation: "Click", target : "IMG/ SPAN.navActionButtonIcon/ SPAN.navActionButtonIconContainer/ A#SFA/ LI.nav-group/ SPAN.nav-layout/ SPAN.nav-groupBody/ SPAN.nav-groupContainer/ LI.nav-subgroup/ UL.nav-tabBody/ DIV#actionGroupControl/ DIV#actionGroupControl_viewport/ DIV#actionGroupControl_scrollableContainer/ DIV.mainTab-nav-scrl/ DIV.navActionGroupContainer/ DIV#crmMasthead/ ", targetText : ""}, 
	{concept: "", operation : "Generic DOM"}, 
	{operation: "Click", target: "SPAN.nav-rowLabel/ A#nav_accts/ LI.nav-subgroup/ SPAN.nav-section/ SPAN.nav-layout/ SPAN.nav-groupBody/ SPAN.nav-groupContainer/ LI.nav-group/ UL.nav-tabBody/ DIV#detailActionGroupControl/ DIV#detailActionGroupControl_viewport/ DIV#detailActionGroupControl_scrollableContainer/ DIV.nav-scrl/ DIV.navActionListContainer/ DIV#crmMasthead/ ", targetText: "Accounts"}, 
	{concept : ['Account'], operation: "SELECTALL"}, 
	{operation: "Click", target: "SPAN.ms-crm-CommandBar-Menu/ A.ms-crm-Menu-Label/ SPAN.ms-crm-CommandBar-Button.ms-crm-Menu-Label/ LI#account|NoRelationship|HomePageGrid|Mscrm.HomepageGrid.account.NewRecord/ UL.ms-crm-CommandBar-Menu/ DIV#commandContainer1/ DIV#crmRibbonManager/ DIV#crmTopBar/ ", targetText: "NEW"}, 
	{concept: "Account", operation: "INSERT", parameters:{"Account Name":"UBBtest","Phone":"00000000000", 
						"Fax":"00000000000","Website":"www.ubbcluj.ro","Parent Account":"", "Ticker Symbol":"a", 
						"Address":"Str.M.Kogalniceanu,Cluj", "Description":"University", "Industry":"Academic","SICCode":"00000","Ownership":""}},
	//{operation:"Post-Operation", target: "SPAN.ms-crm-CommandBar-Menu/ A.ms-crm-Menu-Label/ SPAN.ms-crm-CommandBar-Button.ms-crm-Menu-Label/ LI#account|NoRelationship|Form|Mscrm.Form.account.Save/ UL.ms-crm-CommandBar-Menu/ DIV#commandContainer3/DIV#crmRibbonManager/ DIV#crmTopBar/" , targetText: "SAVE"}  
	//{operation:"Post-Operation", target: "A.ms-crm-Menu-Label/ SPAN.ms-crm-CommandBar-Button.ms-crm-Menu-Label/ LI#account|NoRelationship|Form|Mscrm.Form.account.Save/ UL.ms-crm-CommandBar-Menu/ DIV#commandContainer3/DIV#crmRibbonManager/ DIV#crmTopBar/" , targetText: "SAVE"}  
//	{operation:"Post-Operation", target: "A.ms-crm-Menu-Label/ SPAN.ms-crm-CommandBar-Button.ms-crm-Menu-Label/ LI#account|NoRelationship|Form|Mscrm.Form.account.SaveAndClose/ UL.ms-crm-CommandBar-Menu/ DIV#commandContainer3/DIV#crmRibbonManager/ DIV#crmTopBar/" , targetText: "SAVE & CLOSE"}  
];


// code care este in 01-utils.js
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
                
async function pause(pauseInterval = 10000 /*ms*/) {
    console.log("Sleeping ...");
    await sleep(pauseInterval); 
    console.log("End sleep.");
}


async function executeProcess(process) {

	// send message to page
	console.log("Popup.js::executeProcess() Settings.targetAppURL=", Settings.targetAppURL);
	let activeTab = await chrome.tabs.query({active: true, currentWindow: true});
	console.log("Popup.js::executeProcess() activeTab=", activeTab);
    const response = await chrome.tabs.sendMessage(activeTab[0].id, {request: 'message_popup_page_ExecuteAppURLInitialization'});
    
    console.log("Popup.js::executeProcess() sleeping after reinitialization of the startup URL in browser");
    await pause(10000);
    // after document reload in the browser, we must manually reinject all the content scripts in the
    // context of the new document loaded in the browser; otherwise, all content scripts functionality
    // of the plugin will stop
    // Normally this is not needed, the lazy content scripts should already be loaded by background script
    // on tabs.onUpdated or by the popup on DOMContentLoaded
	await probeContentScripts();
    await pause(5000); // this sleep is important because otherwise the content scripts are not completely
    					// loaded and page.js can not respond to the message_popup_page_ExecutePrimaryBlock message from us

	// send message to page
	console.log("Popup.js: sending message_popup_page_ExecutePrimaryBlock to Page.js");
	const response1 = await chrome.tabs.sendMessage(activeTab[0].id, {request: 'message_popup_page_ExecutePrimaryBlock',
			primaryBlock: process});
    console.log('ExecutePrimaryBlock done!');
    console.log("Popup.js::executeProcess() ExecutePrimaryBlock done! response= " + response1);

}

/*
async function injectContentScripts(tabId) {
	console.log("Popup.js: injecting content script in tab.");
    let contentScripts = chrome.runtime.getManifest().lazyContentScripts;
    for (let scriptIndex in contentScripts)
    {
        let scriptName = contentScripts[scriptIndex];
        //Ghetto workaround for deep copying this thing
        (function (scriptNameDeep)
            {
                chrome.scripting `.executeScript({
                    target: {tabId: tabId, allFrames: false},
                    files: [ scriptNameDeep ]
                    });
                })(scriptName);
            }
}*/
