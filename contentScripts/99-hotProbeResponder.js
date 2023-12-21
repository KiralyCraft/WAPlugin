console.log("Taskmate: Content-Script Hot Prober is now injected");
chrome.runtime.onMessage.addListener(function(receivedMessage, sender, sendResponse) 
{
	if (receivedMessage.action == "action_background_injectors_probe") 
	{
		console.log("Taskmate: Content-Script Hot Prober was pinged");
		sendResponse({action: "action_background_injectors_probe_reply"});
	}
}); 
