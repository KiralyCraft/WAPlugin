

// send a message to the background page containing whatever message (even an object)

/*function sendMessage(message) {
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
    sendMessage(document);
});
*/

console.log("Start of page.js.");
console.log("DataModel: ", DataModel);

var textElementsWithInputs = [];
// The structure of textElementsWithInputs is :
// [{"textNode" : textNode, "inputNode" : associatedInputNode, "inputNodeTag" : associatedInputNode.tagName,
//   "relativePosition" : "..." } ... ]
// The "relativePosition" attribute is the position of the inputNode relative to the textNode and it can be:
// null | right&!below | !right&below | right&below
var highlightedInputElements = [];
// The structure of highlightedInputelements is :
// [{"inputNode" : inputNode, "styleInputNode" : inputNode.style, "ancestor" : ancestor, "styleAncestor" : ancestor.style} ...]


window.frames[0].document.addEventListener('click', function(event) {
    if (event.type == "click") {
        // save target ID to local storage
        //chrome.storage.local.set({ "ClickedElementID": event.target }, function(){} );
        chrome.storage.local.set(
            {"ClickedElementID": SerializeDOMPath(window.frames[0].document.body, event.path)}, 
            function(){} 
        );
        console.log("ClickEvent detected, target=", event.path);
    }
});

//chrome.runtime.sendMessage({text: "Start Message: Content.js is up and ready."});


chrome.runtime.onMessage.addListener(function(receivedMessage, sender, sendResponse) {
    /* We use the following format for messages background <-> page :
     * sendMessage({ request : "message_[fisier sursa]_[fisier destinatie]_[actiune/metoda]", parameters: ... } )
     * sendMessage({ response : "message_[fisier sursa]_[fisier destinatie]_[actiune/metoda]", parameters: ... } )
     */

    /* 4est: after I reload the plugin, I must refresh the tab http://172.30.3.49:5555/CRMEndava/
     * because otherwise the page.js is not loaded in the context of this tab
     */
    console.log("Message received by content script:", receivedMessage);
    
    //chrome.runtime.sendMessage({response: "OK1"});
    
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
	
    if (receivedMessage.request == "message_background_page_updatePhantomDOM") {
        //TODO: urmatoarele 2 linii sunt comentate temporar pentru teste
        //processDOMDifference();
        //saveDOMDifftoLocalStorage();
        
        // Log FullDOMstring on console
        // console.log("FullDOMstring=");
        // chrome.storage.local.get(/* String or Array */["FullDOMstring"], function(items){
        //    console.log(items);
        // });
        sendResponse({response: "message_page_background_updatePhantomDOM",
            result : "Phantom DOM updated successfully."});
    } else if (receivedMessage.request == "message_popup_page_processDOMDifference") {
        console.log("Running processDOMDifference() ...");
        let detectedConceptOperation = processDOMDifference();
        var node = null;
        chrome.storage.local.get(["ClickedElementID"], function(item) {
            console.log("Data saved in chrome.storage.local:",item);
            node = item;
            console.log("node:", node);
            // TODO: a se muta in afara acestui block cu async
            //sendResponse({response: "message_page_popup_primaryNavigationBlockDetected",
            //        preLeafNode: node, concept : detectedConceptOperation.concept, 
            //        operation: detectedConceptOperation.operation});
        });
        console.log("****node:", node);
        sendResponse({response: "message_page_popup_primaryNavigationBlockDetected",
            preLeafNode: node, concept : detectedConceptOperation.concept, 
            operation: detectedConceptOperation.operation});
    } else if (receivedMessage.request == "message_popup_page_undoHighlightInputs") {
        undoHighlightInputElements();
    } else if (receivedMessage.request == "message_popup_page_undoHighlightTextInputElemAssociations") {
        undoHighlightTextInputElemAssociations(window.frames[0].document); 
    } else if (receivedMessage.action == "action_popup_visible") {
        //Do not handle
	} else if (receivedMessage.action == "action_popup_visible_inputdetect") {
        //Do not handle
	} else if (receivedMessage.action == "action_popup_injectors_probe_reply") {
        //Avoid replying to this, because the hotProbeResponder will.
    }
});


function saveDOMDifftoLocalStorage() {
      //let fullDOM = document.body.innerHTML;
      // consider only the DOM of the iframe:
      let fullDOM = window.frames[0].document.body.innerHTML;
      let innerText = window.frames[0].document.body.innerText;

      let FullDOMstring = JSON.stringify(fullDOM);
      console.log("FullDOMstring (as string):", FullDOMstring);

      console.log("FullDOMstring (as JSON):", fullDOM);
      
      // save DOM string to local storage
      chrome.storage.local.set({ "FullDOMstring": FullDOMstring }, function(){} );
      
      // give each tag element TaskMate custom attributes
      walkDOM(document.body);
}

function processDOMDifference() {
    //let iframeDocument = window.frames[0].contentDocument || window.frames[0].contentWindow.document;
    let fullDOM = window.frames[0].document.body.innerHTML;
    let innerText = window.frames[0].document.body.innerText;
    let textElements = getTextElements(window.frames[0].document.body);
    
    console.log("textElements are:");
    textElements.forEach(function(node) {
        console.log(node.innerText, node);
    })
    highlightElements(textElements, "green");

    highlightInputElements(window.frames[0].document.body);

    textElementsWithInputs = getAssociatedInputElements(window.frames[0].document.body, textElements);
    
    highlightTextInputElemAssociations(window.frames[0].document);

    console.log("innerText: ", innerText);
    // detect concepts in inner text content
    //let detectedConcept = detectConcept(innerText);
    //console.log("Concept detected: ", detectedConcept);
    // detect concept and operation on concept/entity
    let detectedConceptOperation = detectConceptAndOperation(textElementsWithInputs);
    console.log("Concept detected: ", detectedConceptOperation);
    return detectedConceptOperation;
}

function walkDOM(main) {
    //var arr = [];
    let taskmateID = 1;
    var loop = function(main) {
        
        do {
            //arr.push(main);
            if (main.nodeType == 1) {    // ignore text nodes
                //console.log("setting custom attribute for", main);
                main.setAttribute("taskmateID", taskmateID);
                taskmateID ++;
            }

            if(main.hasChildNodes())
                loop(main.firstChild);
        }
        while (main = main.nextSibling);
    }
    loop(main);
    //return arr;
}

function getTextElements(root) {
    let textElements = []
    root.querySelectorAll("*").forEach(function(item) {
        //console.log(item.children.length,item.childNodes.length,item);
        if ((item.children.length==0) && (item.childNodes.length==1)
            && (item.tagName != "SCRIPT") && (item.tagName != "INPUT") && 
            (item.tagName != "SELECT") && (item.tagName != "OPTION") && 
            (item.tagName != "TEXTAREA") && (item.innerText.trim().length >0)) {
            //console.log(item.children.length,item.childNodes.length,item.innerText,item);
            if (isElementVisible(item)) {
                textElements.push(item);
            }
        }
    })
    //console.log("textElements=", textElements);
    return textElements;
}

function isElementVisible(item) {
    // This function returns true if item is visible in the browser window.
    // It checks style properties: display, visibility, opacity, overflow and
    // top, left to see that the element is rendered in the view part of the 
    // browser window. It should also probably check its z-index in case of
    // other element overlapping it.
    
    return true;
}


function getAssociatedInputElements(root, textElements) {
    // Assumption: we consider that an input node has as associated label the closest 
    // text node situated in the North-Vest quadrant (i.e. an input will always be placed on
    // the right or on the bottom or on the right-bottom of its associated label).
    let textAndInputNodes = [];
    root.querySelectorAll("input[type='text'],select,textarea").forEach(function(inputNode) {
        let inputNodePosition = inputNode.getBoundingClientRect();
        let assocTextNode = null;
        let minimumDistance = 1000; // a large enough value
        let relativePosition = null;
        textElements.forEach(function(textNode) {    
            let textNodePosition = textNode.getBoundingClientRect();
            let distance = 1000; // a large enough value
            let pos = null;
            if ((textNodePosition.right <= inputNodePosition.left) &&
                (textNodePosition.top <= inputNodePosition.top) && 
                (textNodePosition.bottom > inputNodePosition.top)) {
                /* inputNode is on the (right & !below) of the textNode;
                 * so we compute the distance between textNode(top,right)
                 * and inputNode(top,left) corners.
                 */
                distance = (inputNodePosition.top - textNodePosition.top) +
                           (inputNodePosition.left - textNodePosition.right);
                pos = "right&!below";
            } else if ((textNodePosition.right > inputNodePosition.left) &&
                (textNodePosition.left <= inputNodePosition.left) && 
                (textNodePosition.bottom <= inputNodePosition.top)) {
                /* inputNode is on the (!right & below) of the textNode;
                 * so we compute the distance between textNode(bottom,left)
                 * and inputNode(top,left) corners.
                 */
                distance = (inputNodePosition.top - textNodePosition.bottom) +
                           (inputNodePosition.left - textNodePosition.left);
                pos = "!right&below";
            } else if ((textNodePosition.right <= inputNodePosition.left) &&
                (textNodePosition.bottom <= inputNodePosition.top)) {
                /* inputNode is on the (right & below) of the textNode;
                 * so we compute the distance between textNode(bottom,right)
                 * and inputNode(top,left) corners.
                 */
                distance = (inputNodePosition.top - textNodePosition.bottom) +
                           (inputNodePosition.left - textNodePosition.right);
                pos = "right&below";
            } // else { we do not care .. }

            
            if (distance < minimumDistance) {
                    assocTextNode = textNode;
                    minimumDistance = distance;
                    relativePosition = pos;
            } 

        });

        if (assocTextNode != null) {
            textAndInputNodes.push({"textNode" : assocTextNode, "inputNode" : inputNode, 
                    "inputNodeTag" : inputNode.tagName, "relativePosition" : relativePosition});
        } 
        textElements.splice(textElements.indexOf(assocTextNode), 1);
    });


    // add the remaining text nodes (which do not have an input node correspondent)
    textElements.forEach(function(textNode) {
        textAndInputNodes.push({"textNode" : textNode, "inputNode" : null,
                    "inputNodeTag" : null, "relativePosition" : null});
    });

    return textAndInputNodes;
}


function detectConcept(text) {
    let detectedConcept = "";

    for (concept in DataModel) { 
        console.log(concept, DataModel[concept]);
        let occurences = 0;
        for (property of DataModel[concept]) {
            if (text.includes(property)) occurences++;
            //console.log(property, occurences);
        };
        console.log("occurences=", occurences, " noOfProperties=", DataModel[concept].length);
        if (occurences==DataModel[concept].length) {
            detectedConcept = concept;
        }
    }

    return detectedConcept;
};

function detectConceptAndOperation(textElementsWithInputs) {
    /* Pentru detectia operatiei (SELECT, INSERT, UPDATE), pluginul face urmatoarele:
     * -- acolo unde detecteaza un atribut textual al conceptului in DOM (acest atribut va fi un label),
     * trebuie sa gasim si un "<input type=text>|<select>|<textarea>" in apropierea acestul atribut 
     * textual (i.e. text inputul legat de acest label); acest tag-ul de input este asociat acestui 
     * label in documentul randat in browser; detectam astfel toate input-urile sau text area sau 
     * select-urile asociate fiecarui atribut textual al conceptului detectat.
     * -- daca nu gasim nici un astfel de control de input (e.g. input type text, text area, select),
     * inseamna ca operatia este SELECT.
     * -- daca gasim controale de input si daca aceste input-uri nu au valoare (sunt goale), operatia 
     * este INSERT.
     * -- altfel, daca cel putin un astfel de input are valoare, operatia e UPDATE.
     */
    let detectedConceptOperation = {"concept" : null, "operation" : null};
    
    for (concept in DataModel) { 
        console.log(concept, DataModel[concept]);
        let attributeOccurences = 0;
        let inputNodesCount = 0;
        let nonemptyInputNodesCount = 0;
        for (property of DataModel[concept]) {
            let i = 0;
            while (i<textElementsWithInputs.length) {
                if (textElementsWithInputs[i].textNode && 
                    textElementsWithInputs[i].textNode.innerText.includes(property)) {
                    
                    attributeOccurences++;
                    if (textElementsWithInputs[i].inputNode && 
                        ((textElementsWithInputs[i].inputNodeTag.toUpperCase() == "INPUT") ||
                        (textElementsWithInputs[i].inputNodeTag.toUpperCase() == "TEXTAREA"))) {
                        // we should have also tested the value of SELECT, but we ignore them for now
                        inputNodesCount++;
                        if (textElementsWithInputs[i].inputNode.value != "") {
                            nonemptyInputNodesCount++;    
                        }
                    }

                    break;
                }
                i++;
            }
            //console.log(property, occurences);
        };
        console.log("attributeOccurences=", attributeOccurences, " noOfProperties=", DataModel[concept].length);
        if (attributeOccurences==DataModel[concept].length) {
            detectedConceptOperation.concept = concept;
            if (inputNodesCount==0) {
                detectedConceptOperation.operation = "SELECT";
            } else if (nonemptyInputNodesCount > 1) { // it can also be ">0"
                detectedConceptOperation.operation = "UPDATE";
            } else {
                detectedConceptOperation.operation = "INSERT";
            }          

            break;
        }
    }

    return detectedConceptOperation;
};


function highlightElements(nodes, color) {
    nodes.forEach(function(node) {
        if (node) {
            node.style.border = "1px solid " + color;
        }
    })
}

function highlightInputElements(root) {
    highlightedInputelements = [];

    console.log("Input nodes: ");
    root.querySelectorAll("input[type='text'],select,textarea").forEach(function(node) {
        let elem = {"inputNode" : node, "styleInputNode" : node.style, "ancestor" : null, "styleAncestor" : null}; 

        console.log("input node is: ", node);
        node.style.border = "1px dotted red";
        //node.style.display = "inline-block";
        //node.style.visibility = "visible";
        node.style.overflow = "visible"; 
        node.style.zIndex = "999"; 
        node.style.position = "relative";

        // Find the closest ancestor that has "display: none" and change it to 
        // "visibility: hidden", so that the input element is visible in the browser
        let ancestor = node.parentNode;
        while (ancestor) { 
            if (window.getComputedStyle(ancestor).display=="none") break; 
            else ancestor = ancestor.parentNode;
            if (ancestor.isEqualNode(root)) { ancestor = null; break; }
        };
        //let ancestor = node.closest("[display=none]");
        if (ancestor) {
            elem.ancestor = ancestor;
            elem.styleAncestor = ancestor.style;
            console.log("display:none ancestor is:", ancestor);
            ancestor.style.display = "contents";
            ancestor.style.visibility = "visible";
        };

        highlightedInputelements.push(elem);
    });
}

function undoHighlightInputElements() {
    highlightedInputelements.forEach(function(elem) {
        if (elem.inputNode) {
            elem.inputNode.style = elem.styleInputNode;
        }
        if (elem.ancestor) {
            elem.ancestor.style = elem.styleAncestor;
        }
    });
}

function highlightTextInputElemAssociations(root) {
    textElementsWithInputs.forEach(function(item) {
        if ((item['textNode'] != null) && (item['inputNode'] != null) /*&& (item['textNode'].innerText == "POSTS")*/) {
            //console.log("textElementsWithInputs item:", item);
            let inputNodePosition = item['inputNode'].getBoundingClientRect();
            let textNodePosition = item['textNode'].getBoundingClientRect();
            console.log("inputNodePosition: ", inputNodePosition, " textNodePosition: ", textNodePosition);
            let canvas = root.createElement("canvas");
            canvas.setAttribute("class", "taskmate-canvas");
            canvas.setAttribute("id", item['textNode'].innerText+"|"+item['inputNode'].outerHTML);
            canvas.style.position = "absolute";
            //canvas.style.border = "1px solid cyan";
            if (item['relativePosition'] == "right&!below") {
                canvas.style.left = textNodePosition.right +"px";
                canvas.style.top = textNodePosition.top + "px";
                canvas.width = inputNodePosition.left - textNodePosition.right;
                canvas.height = inputNodePosition.bottom - textNodePosition.top;
                const ctx = canvas.getContext('2d');
                ctx.strokeStyle = 'green';
                ctx.lineWidth = 1;
                // draw a line
                ctx.beginPath();
                ctx.moveTo(0, (textNodePosition.bottom-textNodePosition.top)/2);
                ctx.lineTo(canvas.width,inputNodePosition.top-textNodePosition.top +
                                        (inputNodePosition.bottom-inputNodePosition.top)/2);
                ctx.stroke();
            } else if (item['relativePosition'] == "!right&below") {
                canvas.style.left = textNodePosition.left + "px";
                canvas.style.top = textNodePosition.bottom + "px";
                canvas.width = inputNodePosition.right - textNodePosition.left;
                canvas.height = inputNodePosition.top - textNodePosition.bottom;
                const ctx = canvas.getContext('2d');
                ctx.strokeStyle = 'green';
                ctx.lineWidth = 1;
                // draw a line
                ctx.beginPath();
                ctx.moveTo((textNodePosition.right-textNodePosition.left)/2, 0);
                ctx.lineTo(inputNodePosition.left-textNodePosition.left +
                            (inputNodePosition.right-inputNodePosition.left)/2, canvas.height);
                ctx.stroke();                
            } else if (item['relativePosition'] == "right&below") {
                canvas.style.left = textNodePosition.right + "px";
                canvas.style.top = textNodePosition.top /*+ window.scrollY*/ + "px";
                canvas.width = inputNodePosition.left - textNodePosition.right;
                canvas.height = inputNodePosition.bottom - textNodePosition.top;
                const ctx = canvas.getContext('2d');
                ctx.strokeStyle = 'green';
                ctx.lineWidth = 1;
                // draw a line
                ctx.beginPath();
                ctx.moveTo(0, (textNodePosition.bottom - textNodePosition.top)/2);
                ctx.lineTo(canvas.width, inputNodePosition.top - textNodePosition.top +
                                        (inputNodePosition.bottom-inputNodePosition.top)/2);
                ctx.stroke();
            }
            //let ancestor = getClosestAncestorWithVerticalScroll(root, item['textNode']);
            let ancestor = getClosestCommonAncestor(root, item['textNode'], item['inputNode']);
            //ancestor.style.border = "2px solid purple";
            ancestor.style.position = "relative";
            if (ancestor != null) {
                // TODO: Setarile de top si left de mai jos sunt stupide (daca nu pun +'px' in aceeasi linie nu e nici un efect)
                canvas.style.top = parseFloat(canvas.style.top) - ancestor.getBoundingClientRect().top + 'px';
                canvas.style.left = parseFloat(canvas.style.left) - ancestor.getBoundingClientRect().left + 'px';
                ancestor.appendChild(canvas);
                console.log("ClosestAncestorWithVerticalScroll", ancestor);
            } else  
                root.body.appendChild(canvas);
            
            //console.log("canvas bounding box: ", canvas.getBoundingClientRect());

        }
    });
}

function undoHighlightTextInputElemAssociations(root) {
    root.querySelectorAll(".taskmate-canvas").forEach(function(node) {node.remove()})
}


function getClosestAncestorWithVerticalScroll(root, node) {
    let ancestor = node.parentNode;
    while (ancestor) { 
            if ((ancestor.scrollHeight > ancestor.clientHeight) && 
                !(window.getComputedStyle(ancestor).overflow && 
                    window.getComputedStyle(ancestor).overflow == 'hidden')) {
                 break; 
            } else ancestor = ancestor.parentNode;
            if (ancestor.isEqualNode(root)) { ancestor = null; break; }
        };
    console.log("ancestor.scrollHeight=", ancestor.scrollHeight, " ancestor.clientHeight=", 
        ancestor.clientHeight, " ancestor=", ancestor);
    return ancestor;
}

function getClosestCommonAncestor(root, node1, node2) {
    if (node1 == node2) return node1;
    let parent = node1;
    while (parent = parent.parentNode) {
        if (parent.contains(node2)) return parent;
        if (parent.isEqualNode(root)) return root;
    }
    return null;
}


function SerializeDOMPath(root, path) {
    let str = "";
    for(i=0; i<path.length; i++) {
        if (path[i].isEqualNode(root)) break;
        //console.log("node:", path[i]);
        str += path[i].tagName;
        if (path[i].getAttribute("id") && path[i].getAttribute("id") != "") 
            str += "#" + path[i].getAttribute("id");
        else if (path[i].getAttribute("class") && path[i].getAttribute("class") != "") 
            str += "." + path[i].getAttribute("class");
        str += "|";
    };
    console.log(str);  
    return str;  
}


//console.log("Running processDOMDifference() ...");
//processDOMDifference();
