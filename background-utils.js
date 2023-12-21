import {Settings} from './general-settings.js';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
                
async function pause(pauseInterval = 2000 /*ms*/) {
    console.log("Sleeping ...");
    await sleep(pauseInterval); 
    console.log("End sleep.");
}

/*
 *  This method checks if the current tab responds to any messages sent from the plugin, since they are not loaded by a content-script.
 *  Returns true and false if the content scripts were loaded or not when the probe was called.
 */
async function probeContentScripts()
{
    let theResponse = null;
    let tabs = [];
    try {
        //let activeTab = await chrome.tabs.query({active: true, currentWindow: true});
        tabs = await chrome.tabs.query({ url: Settings.targetAppURL });
        console.log("probeContentScripts(): tabs=", tabs);
        theResponse = await chrome.tabs.sendMessage(tabs[0].id, {action: "action_background_injectors_probe"}); 
    } catch (error) {
        console.error('background-utils.js probeContentScripts(): Error:', error);
        var lastError = chrome.runtime.lastError;
        if ((error.toString().indexOf("Could not establish connection. Receiving end does not exist.") !== -1) ||
            (lastError && lastError.message.indexOf("Receiving end does not exist") !== -1)) 
        {
            console.log("Content scripts are not loaded. Loading them now.");
            injectContentScripts(tabs[0].id);
            return false;
        }
    }            
     
    if (theResponse && theResponse.action == "action_background_injectors_probe_reply")
    {
        console.log("Content scripts are loaded, we're good");
        return true;
    }

}

function injectContentScripts(tabid)
{
    var contentScripts = chrome.runtime.getManifest().lazyContentScripts;
    for (var scriptIndex in contentScripts)
    {
        var scriptName = contentScripts[scriptIndex];
        
        //Ghetto workaround for deep copying this thing
        (function (scriptNameDeep)
        {
            chrome.scripting.executeScript({
                    target: {tabId: tabid, allFrames: false},
                    files: [ scriptNameDeep ]
            });
        })(scriptName);
    }
}

export {pause, probeContentScripts, injectContentScripts};
