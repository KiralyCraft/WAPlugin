
import {Settings} from './general-settings.js';
import {pause, probeContentScripts, injectContentScripts} from './background-utils.js';


console.log("background.js: The general Settings are: ", Settings);

var BackgroundScriptPluginState = {
    state : "Debug" /* "Debug", "Guided browsing", "Automatic browsing", "Automatic execution" */

};

var activeTabURL = "";

let message = null; // the message
let key = null; // my key (some sort of plug-in instalation ID)
let version = chrome.runtime.getManifest().version;

let xhrTimer = null;

console.log("Background.js starts ...");


var NavigationHistory = [];
var PrimaryBlockRecording = [];
var finalizationStep = 0;

chrome.runtime.onMessage.addListener(async function(receivedMessage, sender, sendResponse) {
    //console.log("Message received:", receivedMessage);
    message = receivedMessage;
    console.log("Background.js: Message received from the user's page: ", receivedMessage);
    message = receivedMessage; // just for the popup page

    if (receivedMessage.request == "message_popup_background_StateChanged") {
        console.log("Background script's state is now: ", receivedMessage.state);
        BackgroundScriptPluginState.state = receivedMessage.state;

        if (receivedMessage.state == "Guided browsing") {
            // we start recording a primary block
            NavigationHistory = [];
            PrimaryBlockRecording = [];            
        }
    } else if (receivedMessage.request == "message_popup_background_FinalizeStepState") {
        finalizationStep = receivedMessage.state;

    } else if (receivedMessage.request == "message_page_background_clickEvent") {
        if (receivedMessage.operation=="Click") {
            NavigationHistory.push({operation : "Click", target : receivedMessage.target, 
                                    targetText: receivedMessage.targetText});
            let elem = {operation : "Click", target : receivedMessage.target, 
                        targetText: receivedMessage.targetText};
            if ((PrimaryBlockRecording.length > 0) &&
                (PrimaryBlockRecording[PrimaryBlockRecording.length-1].operation == "SELECTALL") &&
                (PrimaryBlockRecording[PrimaryBlockRecording.length-1].concept != null)) {
                    elem.targetType = "generic"; // we clicked an an entity in a table of entities
                                                 // we don't store a specific link for that entity, 
                                                 // but a generic link for all entities in this table
            }
            PrimaryBlockRecording.push(elem);
            console.log("Sending response to message_page_background_clickEvent msg..");
            // sendResponse it's not OK here since the content script does not awaits for the response
            // in the same code that sends the original message :
            // sendResponse({response: "message_background_page_clickEventRegistered",
            //            result : "Click event registered."});
            
            // If a new document was loaded in the browser tab as a consequence of the click event,
            // we must first inject the content scripts in the context of the new document loaded in the tab
            await probeContentScripts();
            await pause(2000); // this sleep is important because otherwise the content scripts are not completely
                               // loaded and page.js can not respond to the next message, message_background_page_mapUIOperation,
                               // from us

            let activeTab = await getTargetTab();
            chrome.tabs.sendMessage(activeTab[0].id, { request: "message_background_page_mapUIOperation"});
        }
    } else if (receivedMessage.request == "message_page_background_operationDetected") {
        NavigationHistory.push({operation : receivedMessage.operation, 
                                concept : receivedMessage.concept});
        PrimaryBlockRecording.push({operation : receivedMessage.operation, 
                                concept : receivedMessage.concept});
    } else if (receivedMessage.request == "message_navigationhistory_background_getNavigationHistory") {
        sendResponse(NavigationHistory);
    } else if (receivedMessage.request == "message_popup_background_getPrimaryBlockRecording") {
        sendResponse(PrimaryBlockRecording);
    }

    for(let i=0; i<NavigationHistory.length; i++) {
        console.log("Navigation step ->", NavigationHistory[i]);
    }
    console.log("--- NavigationHistory object:", NavigationHistory);
    console.log("--- PrimaryBlockRecording object:", PrimaryBlockRecording);

});

// clean the chrome storage
//chrome.storage.sync.remove(['key']);

// get a key if I don't have one
chrome.storage.sync.get(['key'], function(storage) {
    console.log('Settings retrieved ', storage);
    if (! storage.key || storage.key == -1) { // I don't have an key, ask for one and store it
        console.log('Key missing. Asking for one...');
        // 4est: Trebuie folosit fetch() !
        /*$.get('https://www.scs.ubbcluj.ro/plugin/getNewId.php', function(result) {
            console.log('New key received:', result);
            key = result; // store the key as a background page property
            chrome.storage.sync.set({'key': result}, function() { // saved the key between Chrome sessions
                console.log('Reporter key saved');
            });
        })*/
    } else { // already have a key
        key = storage.key;
    }
});

// 4est
const networkFilters = {
    //urls: [
    //    "ws://192.168.56.101:8080/BC190/*",
    //    "*://*/*"
    //]
    //urls: ["<all_urls>"]
    urls: [
        "https://www.cs.ubbcluj.ro/*",
        "http://172.30.3.49:5555/*"
    ]
};

// 4est: HTTP requests logger
chrome.webRequest.onCompleted.addListener((event) => {
    if (event.type=="xmlhttprequest") {
        console.log("new event=", event);
        console.log("new HTTP Request: \ntype=" + event.type + "\nurl=" + event.url + 
            "\nmethod=" + event.method + "\ninitiator=" + event.initiator);
    }

    // settimeout() does not work in Chrome extensions
    /*clearTimeout(this.xhrTimer);
    this.xhrTimer = settimeout(xhrTimeout, 500);*/

    // clear previous pending alarms and set a new alarm
//    console.log("clearing all alarms...");
    chrome.alarms.clear("xhrAlarm");
//    console.log("create new alarm...");
    chrome.alarms.create (
        "xhrAlarm",                           // name of alarm
        {delayInMinutes:0.5}                  // alarmInfo 
        // the minimum allowed delay seems to be 1 minute 
    );
    chrome.alarms.getAll( 
        /* since Promises are not yet available with chrome.alarms.getAll(),
         * welcome to callbacks nightmare.
         * TODO: must switch to Manivest v3 and remove the callback parameter
         * so that chrome.alarms.getAll() returns a Promise which can then
         * be followed by a .then() call
         */
        function(alarms) {
//            console.log("All alarms are:", alarms);
        }
    );

}, networkFilters);


chrome.alarms.onAlarm.addListener(
    async function () {
        console.log('xhrAlarm():', new Date().toLocaleString());
        let activeTab = await getTargetTab();
        console.log("activeTab:", activeTab, activeTab[0].id);
        chrome.tabs.sendMessage(activeTab[0].id, { request: "message_background_page_updatePhantomDOM"}, 
            function(response) { console.log("received response from content script:", response);
            });  
    }
);


async function getTargetTab() {
    //let activeTab = await chrome.tabs.query({ url: "http://172.30.3.49:5555/CRMEndava3/*" });
    let activeTab = await chrome.tabs.query({ url: Settings.targetAppURL });
    return activeTab;
}


/*
chrome.tabs.onActivated.addListener(async function (tabId, changeInfo, tab) {
    console.log("tabs.onActivated event..");
    let activeTab = await getTargetTab();
    console.log("activeTab:", activeTab, activeTab[0].id);
    console.log("Background.js: sending message to content.js.");
    chrome.tabs.sendMessage(activeTab[0].id, { action: "getDOM Test1"}, function(response) {
        console.log("received response from content script:", response);
    }); 

});
*/


chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
        console.log("tabs.onUpdated event.. tabId=", tabId, " changeInfo=", changeInfo, " tab=", tab);
        let activeTab = await getTargetTab();
        console.log("activeTab:", activeTab /*, activeTab[0].id*/);
        if ((activeTab!=null) && (activeTabURL != activeTab[0].url)) {
            changeInfo.url = activeTab[0].url;
            activeTabURL = activeTab[0].url;
        }
        if (changeInfo.url) {
            console.log(`Tab: ${tabId} URL changed to ${changeInfo.url}`);
            console.log("Background.js: injecting content script in tab.");
            // we inject the lazy content scripts in the tab context if they are not already loaded
            await probeContentScripts();
        }
    }
});



/*chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  chrome.tabs.sendMessage(tabs[0].id, {greeting: "hello"});
});

chrome.tabs.onActivated.addListener(function (tabId, changeInfo, tab) {
    console.log("tabs.onActivated event..");
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
        console.log("tabs.onUpdated event..");
    }
});

chrome.tabs.onActivated.addListener(activeInfo => move(activeInfo));
function move(activeInfo) {
  try {
    chrome.tabs.move(activeInfo.tabId, {index: 0});
    console.log('Success.');
  } catch (error) {
    if (error == 'Error: Tabs cannot be edited right now (user may be dragging a tab).') {
      setTimeout(() => move(activeInfo), 50);
    }
  }
}*/



class WebSocket {
  // https://websockets.spec.whatwg.org/#the-websocket-interface
  _websocket;
  
  //constructor(USVString url, optional (DOMString or sequence<DOMString>) protocols = []);
  constructor(url, protocols) {
      _websocket = new WebSocket(url, protocols);
  }
  //readonly attribute USVString url;
  get url() { return _websocket.url; }

  // ready state
  //const unsigned short CONNECTING = 0;
  get CONNECTING() { return _websocket.CONNECTING; }
  //const unsigned short OPEN = 1;
  get OPEN() { return _websocket.OPEN; }
  //const unsigned short CLOSING = 2;
  get CLOSING() { return _websocket.CLOSING; }
  //const unsigned short CLOSED = 3;
  get CLOSED() { return _websocket.CLOSED; }
  //readonly attribute unsigned short readyState;
  get readyState() { return _websocket.readyState; }
  //readonly attribute unsigned long long bufferedAmount;
  get bufferedAmount() { return _websocket.bufferedAmount; }

  // networking
  //attribute EventHandler onopen;
  get onopen() { return _websocket.onopen; }
  set onopen(eventHandler) { this.onopen = EventHandler; }
  //attribute EventHandler onerror;
  get onerror() { return _websocket.onerror; }
  set onerror(eventHandler) { this.onerror = EventHandler; }
  //attribute EventHandler onclose;
  get onclose() { return _websocket.onclose; }
  set onclose(eventHandler) { this.onclose = EventHandler; }
  //readonly attribute DOMString extensions;
  get extensions() { return _websocket.extensions; }
  //readonly attribute DOMString protocol;
  get protocol() { return _websocket.protocol; }
  //undefined close(optional [Clamp] unsigned short code, optional USVString reason);
  close (code, reason) {
        _websocket.close(code, reason);
  }

  // messaging
  //attribute EventHandler onmessage;
  get onmessage() { return _websocket.onmessage; }
  set onmessage(eventHandler) { this.onmessage = eventHandler; }
  //attribute BinaryType binaryType;
  get binaryType() { return _websocket.binaryType; }
  set binaryType(eventHandler) { this.binaryType = eventHandler; }
  //undefined send((BufferSource or Blob or USVString) data);
  send (date) {
        _websocket.send(data);
  }
};
