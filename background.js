this.message = null; // the message
this.key = null; // my key (some sort of plug-in instalation ID)
this.version = chrome.runtime.getManifest().version;

chrome.runtime.onMessage.addListener(function(receivedMessage, sender, sendResponse) {
    //console.log("Message received:", receivedMessage);
    message = receivedMessage;
    console.log("Message received from the user's page: ", receivedMessage);
    message = receivedMessage; // just for the popup page

    var loggingObject;
    loggingObject.message = receivedMessage;
    loggingObject.reportTime = (new Date()).getTime();
    loggingObject.key = key;
    loggingObject.pluginVersion = version;

    // do wathever business logic with the loggingObject
    // either client side
    // or server side
    // $.post("https://www.scs.ubbcluj.ro/plugin/logging.php", loggingObject);
});

// clean the chrome storage
//chrome.storage.sync.remove(['key']);

// get a key if I don't have one
chrome.storage.sync.get(['key'], function(storage) {
    console.log('Settings retrieved ', storage);
    if (! storage.key || storage.key == -1) { // I don't have an key, ask for one and store it
        console.log('Key missing. Asking for one...');
        $.get('https://www.scs.ubbcluj.ro/plugin/getNewId.php', function(result) {
            console.log('New key received:', result);
            key = result; // store the key as a background page property
            chrome.storage.sync.set({'key': result}, function() { // saved the key between Chrome sessions
                console.log('Reporter key saved');
            });
        })
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
        "https://www.cs.ubbcluj.ro/*"
    ]
};

// 4est: HTTP requests logger
chrome.webRequest.onCompleted.addListener((event) => {
    console.log("new event=", event);
    console.log("new HTTP Request: \ntype=" + event.type + "\nurl=" + event.url + 
        "\nmethod=" + event.method + "\ninitiator=" + event.initiator);
    chrome.runtime.sendMessage(event);
}, networkFilters);


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

/*chrome.tabs.onActivated.addListener(activeInfo => move(activeInfo));
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
