
var scriptTag = document.createElement('script');
console.log(chrome);
scriptTag.src = chrome.runtime.getURL('contentScripts/bootcode.js');
scriptTag.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(scriptTag);
