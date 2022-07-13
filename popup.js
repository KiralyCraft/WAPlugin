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
 * Called when the plugin's UI is loaded and accessible. May be borked on IE8 :)
 */
function buildPluginUI() 
{
	/*
	 * Send a message to the background page - Let it know the thing is open now.
	 */
	if (GREET_BACKGROUND_PAGE)
	{
		chrome.runtime.sendMessage({action: "action_popup_visible"}, function(theResponse) {
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
			chrome.tabs.sendMessage(tabs[0].id, {action: "action_popup_visible"}, function(theResponse) {
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
	buildPluginUI();
});
