// This code must be injected in a <script> tag in the current DOM and must be executed
// in the beginning of the document load, before all other javascript code of the current
// DOM is executed. It must be done this way (i.e. be injected in a <script> tag) because
// content scripts of Chrome extensions are executed in an "isolated world" environment
// (see https://stackoverflow.com/questions/9515704/access-variables-and-functions-defined-in-page-context-using-a-content-script/9517879#9517879).

console.log("Bootcode is executing ..");

(function overwriteAddEventListener() {
    console.log("Bootcode is overwriting AddEventListener ...");

    Element.prototype._addEventListener = Element.prototype.addEventListener;
    //Element.prototype.addEventListener = function(type, listener, options) {
    Element.prototype.addEventListener = function(type, listener) {
        this._addEventListener(type, listener);
        if(!this.eventListenerList) this.eventListenerList = {};
        if(!this.eventListenerList[type]) this.eventListenerList[type] = [];
        this.eventListenerList[type].push(listener);

        if (type=="click") {
            this.setAttribute("taskMateEventListener", "click");
        }
    };

    Element.prototype._removeEventListener = Element.prototype.removeEventListener;
    //Element.prototype.removeEventListener = function(type, listener, options) {
    Element.prototype.removeEventListener = function(type, listener) {
        this._removeEventListener(type, listener);
        if(this.eventListenerList) {
            if(this.eventListenerList[type]) {
                if (listener) {
                    let i = -1;
                    if ((i = this.eventListenerList[type].indexOf(listener)) && (i>=0)) {
                        this.eventListenerList[type].splice(i, 1);
                    }
                    if (this.eventListenerList[type].length==0) {
                        delete this.eventListenerList[type];                    
                    }
                } else {
                    delete this.eventListenerList[type];
                }
            }
            if(Object.keys(this.eventListenerList).length==0) {
                delete this.eventListenerList;
            }
        }

        if (type=="click") {
            this.removeAttribute("taskMateEventListener");
        }
    };

}) ();

//console.log("Element.prototype at the end of bootcode.js:", Element.prototype);

/*var clicks = someElement.eventListenerList.click;
if(clicks) clicks.forEach(function(f) {
  alert("I listen to this function: "+f.toString());
});*/

