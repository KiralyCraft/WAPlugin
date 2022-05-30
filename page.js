// send a message to the background page containing whatever message (even an object)

function sendMessage(message) {
    console.log(window.location.href);
    console.log(message);

    chrome.runtime.sendMessage(message);
}


var originalXHR = XMLHttpRequest;
XMLHttpRequest = function()
{
    var ret = new originalXHR();
    ret.addEventListener('load', function()
    {
        console.log('Ajax request finished!');
    });
    return ret;
};

// do whatever business logic here
$(document).ready(function () {
<<<<<<< HEAD
    sendMessage(document);
});


chrome.runtime.onMessage.addListener(function(receivedMessage, sender, sendResponse) {
    console.log("Message received by content script:", receivedMessage);
});
=======
//    sendMessage('Just a demo message injected by the logging plugin!');
    console.log('Plugin is injecting code into the web page...');

    // var origOpen = XMLHttpRequest.prototype.open;
    // XMLHttpRequest.prototype.open = function() {
    //     console.log('Ajax request started!');
    //     this.addEventListener('load', function() {
    //         console.log('Ajax request completed!');
    //         console.log('Ajax request ready state: ' + this.readyState);
    //         console.log('Ajax request response from the server: ' + this.responseText);
    //     });
    //     origOpen.apply(this, arguments);
    // };

    // $(document).ajaxSuccess(
    //     function(event, xhr, settings){
    //         console.log('Ajex call: ' + xhr.responseText);
    //     }
    // );

    // $.ajaxSetup({
    //     beforeSend: function() {
    //         //do stuff before request fires
    //         console.log('It works!');
    //     }
    // });
});
>>>>>>> 08e86f3497767a36fe2b89bec59d24d9b70d0169
