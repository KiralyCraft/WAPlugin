const GREET_BACKGROUND_PAGE = false;
const GREET_CONTENT_PAGE = true;

/*
 * Handles scenarios for various actions indicated by the content page or background script.
 */
function handleContentResponse(responseAction, responseData)
{
	console.log(responseAction);
	console.log(responseData);
}

/*
 *	This method checks if the current tab responds to any messages sent from the plugin, since they are not loaded by a content-script.
 */
function probeInjectors()
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
			} 
			else if (theResponse.action == "action_popup_injectors_probe_reply")
			{
				console.log("Injectors are loaded, we're good");
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
					target: {tabId: tabs[0].id, allFrames: true},
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
			chrome.tabs.sendMessage(tabs[0].id, {action: "action_popup_visible"}, function(theResponse) 
			{
				for (var responseEntry in theResponse)
				{
					handleContentResponse(theResponse[responseEntry].action,theResponse[responseEntry].data);
				}
			});
		});
	}
}

/*
 * Called when the document 
 */
document.addEventListener("DOMContentLoaded", function(event) { 
	probeInjectors();
	//buildInjectors(); //Don't always force the building of injectors, because they may already be injected
	buildPluginUI();
});
