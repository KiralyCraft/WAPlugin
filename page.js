// send a message to the background page containing whatever object

function sendMessage(object) {
    console.log(window.location.href);
    console.log(object);

    chrome.runtime.sendMessage(object);
}

// do whatever business logic here
$(document).ready(function () {
    sendMessage(document);
});