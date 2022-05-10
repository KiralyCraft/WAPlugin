this.message = null; // the message
this.key = null; // my key (some sort of plug-in instalation ID)
this.version = chrome.runtime.getManifest().version;

chrome.runtime.onMessage.addListener(function(receivedMessage, sender, sendResponse) {
    console.log("Message received:", receivedMessage);
    message = receivedMessage;
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