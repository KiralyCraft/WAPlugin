

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

if (window.frames[0]) {
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
}

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
    } else if (receivedMessage.request == "message_popup_page_detectTables") 
    {
        if (receivedMessage.parameters.algorithm == "standard")
        {
            detectTables();
        }
    } else if (receivedMessage.request == "message_popup_page_undoHighlightInputs") {
        undoHighlightInputElements();
    } else if (receivedMessage.request == "message_popup_page_undoHighlightTextInputElemAssociations") {
        undoHighlightTextInputElemAssociations(getDocumentRoot() /*window.frames[0].document*/); 
    } else if (receivedMessage.request == "message_popup_page_debug") {
        debug();
    } else if (receivedMessage.action == "action_popup_visible") {
        //Do not handle
	} else if (receivedMessage.action == "action_popup_visible_inputdetect") {
        //Do not handle
	} else if (receivedMessage.action == "action_popup_injectors_probe_reply") {
        //Avoid replying to this, because the hotProbeResponder will.
    }

    // functia care calculeaza Diff DOM
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
    let root = getDocumentRoot();
    let textElements = getTextElements(root.body, true /*only visible elements*/);
    
    console.log("textElements are:");
    textElements.forEach(function(node) {
        console.log(node.innerText, node);
    })
    highlightElements(textElements, "green");

    highlightInputElements(root.body);

    textElementsWithInputs = getAssociatedInputElements(root.body, textElements);
    
    highlightTextInputElemAssociations(root /*window.frames[0].document*/);

    console.log("innerText: ", innerText);
    // detect concepts in inner text content
    //let detectedConcept = detectConcept(innerText);
    //console.log("Concept detected: ", detectedConcept);
    // detect concept and operation on concept/entity
    let detectedConceptOperation = detectConceptAndOperation(textElementsWithInputs);
    console.log("Concept detected: ", detectedConceptOperation);

    // detectam atribute Foreign Keys
    let FKFields = detectForeignKeyFields(detectedConceptOperation.concept, textElements, root.body);
    // The structure of FKFields is:
    //  [ {ForeignKey: entry.ForeignKey, TextElem : txtElem, AssocInputNode: null}, ... ] 

    let visibleNodes = [];
    let invisibleNodes = [];
    let newVisibleNodes = [];
    let newInvisibleNodes = [];
    updateVisibleDOM(root.body, visibleNodes, invisibleNodes, newVisibleNodes, newInvisibleNodes);    
//    clickTrigger(FKFields[0].AssocInputNode, 1000).then(function() {
//        console.log('Click triggered on '+FKFields[0].AssocInputNode);
        //alert('Click triggered on '+FKFields[0].AssocInputNode);

        console.log(visibleNodes.length, invisibleNodes.length, newVisibleNodes.length, newInvisibleNodes.length);
        clickTrigger(root.querySelector("#parentcustomerid1_i"), 1000).then(function() {
            console.log('Click triggered on ' + root.querySelector("#parentcustomerid1_i"));
            //alert('Click triggered on ' + root.querySelector("#parentcustomerid1_i"));
        });

        pause().then(function() {  
            newVisibleNodes = [];
            newInvisibleNodes = [];
            updateVisibleDOM(root.body, visibleNodes, invisibleNodes, newVisibleNodes, newInvisibleNodes); 
            console.log(visibleNodes.length, invisibleNodes.length, newVisibleNodes.length, newInvisibleNodes.length);
            //console.log("processDOMDifference(): newVisibleNodes:", newVisibleNodes);
            let commonAncestor = null;
            if (newVisibleNodes.length>0) {
                commonAncestor = newVisibleNodes[1];
                commonAncestor.style.border = "2px solid red";
                for(let i=1; i<newVisibleNodes.length; i++) {
                    commonAncestor = getClosestCommonAncestor(root.body, commonAncestor, newVisibleNodes[i]);
                }
            }
            console.log("processDOMDifference(): commonAncestor is:", commonAncestor);
            if (commonAncestor!=null) {
                commonAncestor.style.border = "2px solid red";
            }
        });
//    });

    return detectedConceptOperation;
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
                
async function pause() {
    console.log("Sleeping ...");
    await sleep(20000);
    console.log("End sleep.");
}

function debug() {
    /*let button = root.createElement("button");
    button.style.position = "absolute";
    button.style.top = "200px";
    button.style.left = "200px";
    button.innerText = "Click me";
    root.body.appendChild(button);
    button.addEventListener('click', function(){
        console.log("BUTTON CLICKED!!!!");
    });

    clickTrigger(button);*/
    clickTrigger(getDocumentRoot().body.querySelector("#parentcustomerid1_lookupValue"));
    clickTrigger(getDocumentRoot().body.querySelector("#parentcustomerid1_i"));
    //getDocumentRoot().body.querySelector("#parentcustomerid1_i").click();
    console.log("click2");
}


function updateVisibleDOM(root, visibleNodes, invisibleNodes, newVisibleNodes, newInvisibleNodes) {
    function findNodeInArray(array, node) {
        for(let i=0; i<array.length; i++) 
            if (array[i].isEqualNode(node)) return true;
        return false;
    }

    if ((visibleNodes==null) || (invisibleNodes==null) || (newVisibleNodes==null) || (newInvisibleNodes==null)) {
        return;
    }

    console.log("updateVisibleDOM: root=", root);
    if ((visibleNodes.length>0) || (invisibleNodes.length>0)) {
        newVisibleNodes.length = 0;
        newInvisibleNodes.length = 0;

        root.querySelectorAll("*").forEach(function(node) {
            let visibility = isElementVisible(node);
            if (node.getAttribute("id")=="Dialog_parentcustomerid1_IMenu") {
                console.log("updateVisibleDOM: visibility of #Dialog_parentcustomerid1_IMenu:", visibility);
            }
            if (findNodeInArray(visibleNodes, node)) {
                if (!visibility) {
                    newInvisibleNodes.push(node);
                }
            } else if (findNodeInArray(invisibleNodes, node)) {
                if (visibility) {
                    newVisibleNodes.push(node);
                }
            } else { // new node in the DOM
                if (visibility) newVisibleNodes.push(node);
                else newInvisibleNodes.push(node);
            }
        });
    }

    // rebuild visibleNodes and invisibleNodes
    visibleNodes.length = 0;
    invisibleNodes.length = 0;
    root.querySelectorAll("*").forEach(function(node) {
        let visibility = isElementVisible(node);
        if (visibility) visibleNodes.push(node);
        else invisibleNodes.push(node);
    });

    //console.log("updateVisibleDOM(): newVisibleNodes=", newVisibleNodes);
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

function getTextElements(root, onlyVisibleNodes=false) {
    function numberOfDirectTextChildNodes(node) {
        let count =0;
        for (let i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i].nodeType === Node.TEXT_NODE) count++;
        }
        return count;
    }

    /* If a node has one or more innertexts (i.e. Node.TEXT_NODE nodes), but
    * also it has several other direct children tags, for ex:
    *      <div> Test <span>aaa</span> <span>bbb</span> Test1 </div>
    * in this case, we take all Node.TEXT_NODE children and wrap them around
    * <SPAN></SPAN> tags.
    * Normally, this code should only be executed once for the currently loaded 
    * document. For now, we leave it like this, being executed each time the
    * getTextElements() function is being called.
    */
    root.querySelectorAll("*").forEach(function(item) {
        if ((item.childNodes.length > item.children.length) &&
            (item.tagName != "SCRIPT") && (item.tagName != "INPUT") && 
            (item.tagName != "SELECT") && (item.tagName != "OPTION") && 
            (item.tagName != "TEXTAREA") && (item.innerText.trim().length >0) &&
            (numberOfDirectTextChildNodes(item) >= 1)) {
                if (!onlyVisibleNodes || (onlyVisibleNodes && isElementVisible(item))) {
                    if (item.children.length > 0) {
                        // this node has innertexts (i.e. Node.TEXT_NODE nodes), but
                        // also it has several other direct non-innertext children tags
                        for (let i = 0; i < item.childNodes.length; i++) {
                            if ((item.childNodes[i].nodeType === Node.TEXT_NODE) &&
                                (item.childNodes[i].textContent.trim().length >0) ) {
                                let elem = document.createElement("span");
                                elem.appendChild(document.createTextNode(item.childNodes[i].textContent));
                                elem.setAttribute("style", "border: 0; padding: 0; margin: 0;");
                                item.replaceChild(elem, item.childNodes[i]);
                            }
                        }
                    }
                } 
        }
    });

    let textElements = [];
    root.querySelectorAll("*").forEach(function(item) {
        if ((item.childNodes.length==1) && (item.children.length==0) &&
            (item.tagName != "SCRIPT") && (item.tagName != "INPUT") && 
            (item.tagName != "SELECT") && (item.tagName != "OPTION") && 
            (item.tagName != "TEXTAREA") && (item.innerText.trim().length >0)) {
                if (!onlyVisibleNodes || (onlyVisibleNodes && isElementVisible(item))) {
                        // this node has only an inner text and no other descendent tags
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

    if (item==null) return false;
    let style = window.getComputedStyle(item);
    let boundingBox = item.getBoundingClientRect();
    if ((style.visibility=="hidden") || (style.display=="none") || (style.opacity=="0") ||
        (style.top<0) || (style.bottom<0) || (style.left<0) || (style.right<0) ||
        (boundingBox.top<0) || (boundingBox.bottom<0) || (boundingBox.left<0) || (boundingBox.right<0)) {
            return false;
    }
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
        if (concept=="ForeignKeys") continue; 
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
        if (concept=="ForeignKeys") continue; 

        console.log(concept, DataModel[concept]);
        let attributeOccurences = 0;
        let inputNodesCount = 0;
        let nonemptyInputNodesCount = 0;
        for (property of DataModel[concept]) {
            let i = 0;
            while (i<textElementsWithInputs.length) {
                if (textElementsWithInputs[i].textNode && 
                    textElementsWithInputs[i].textNode.innerText.toLowerCase().includes(property.toLowerCase())) {
                    
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
            console.log(property, attributeOccurences);
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

function detectForeignKeyFields(concept, textElements, root) {
    let FKarray = [];
    DataModel["ForeignKeys"].forEach(function(entry) {
        if (entry.ForeignTable==concept) {
            let txtElem = null;
            textElements.forEach(function(textNode) {
                if (textNode.innerText.toLowerCase().includes("company"))
                    console.log(textNode.innerText.toLowerCase(), " - ", textNode);
                if (entry.ForeignKey.toLowerCase()==textNode.innerText.toLowerCase()) {
                    txtElem = textNode;
                }
            })
            if (txtElem != null) {
                FKarray.push({ForeignKey: entry.ForeignKey, TextElem : txtElem, AssocInputNode: null}); 
            };
        }
    });

    console.log("detectForeignKeyFields(): ", FKarray);
    console.log("Label positions: ", FKarray[0].TextElem.getBoundingClientRect().top,
        " ", FKarray[0].TextElem.getBoundingClientRect().left);

    let i=0;
    for(i=0; i<FKarray.length; i++) {
        /* Search for associated input element on the South-East quadrant of the textElement containing 
         * the ForeignKey. The "associated input element" does not actually need to be an <input>-like
         * element, it is just a node which is visible and stands out to the user, i.e. it satisfies
         * at least one of the following conditions:
         *     - the node only has an innerText and no other children
         *     - the node has a border (this makes the node stand out to the user)
         *     - the node has a background color that is different than the default one 
         *       (i.e. the root's background color); this also makes the node stand out to the user
         * Here we want to accomodate for the situation where this "associated input element" is just
         * a regular div, but it looks like an input element and when the user clicks on or hovers it,
         * an actual <input> replaces it so that the user can input text.
        */
        let minDistance = 0xffffffff;
        let assocInputNode = null;

        root.querySelectorAll(":not(.taskmate-canvas)").forEach(function(node) {
            // the input node associated with a label must be visible and it should either contain
            // non empty string or it should have a border (to make it visible to the human user),
            // and it should be in the South-East quadrant of the label; please note that here, the
            // input node is not necessarily an <input> node, it can be any type of DOM element
            //if (node.getAttribute("id")!="parentcustomerid1_lookupDiv") return;

            if (!isElementVisible(node)) return;
            let style = window.getComputedStyle(node);
            if (((node.childNodes.length!=1) || (node.children.length!=0) || (node.innerText.trim().length <=0)) && 
                ((style.borderWidth=="") || (style.borderWidth=="0px") || (style.borderStyle=="") || (style.borderStyle=="none")) &&
                ((style.backgroundColor=="") || (style.backgroundColor=="rgba(0, 0, 0, 0)") || (style.backgroundColor==window.getComputedStyle(root).backgroundColor))) {
                return;
                // background-color is not inherited; if an element does not have background-color explicitely
                // set in inline CSS or external CSS, window.getComputedStyle(elem).backgroundColor always 
                // returns "rgba(0, 0, 0, 0)".
            }

            let nodePosition = node.getBoundingClientRect();
            let relativePosition = null;
            let textNodePosition = FKarray[i].TextElem.getBoundingClientRect();
            let maxAcceptableDistance = textNodePosition.width > textNodePosition.height ?
                                        textNodePosition.width : textNodePosition.height; 
            let distance; 
            let pos = null;
            if ((textNodePosition.right <= nodePosition.left) &&
                (textNodePosition.top <= nodePosition.top) && 
                (textNodePosition.bottom > nodePosition.top)) {
                /* inputNode is on the (right & !below) of the textNode;
                 * so we compute the distance between textNode(top,right)
                 * and inputNode(top,left) corners.
                 */
                distance = (nodePosition.top - textNodePosition.top) +
                           (nodePosition.left - textNodePosition.right);
                pos = "right&!below";
            } else if ((textNodePosition.right > nodePosition.left) &&
                (textNodePosition.left <= nodePosition.left) && 
                (textNodePosition.bottom <= nodePosition.top)) {
                /* inputNode is on the (!right & below) of the textNode;
                 * so we compute the distance between textNode(bottom,left)
                 * and inputNode(top,left) corners.
                 */
                distance = (nodePosition.top - textNodePosition.bottom) +
                           (nodePosition.left - textNodePosition.left);
                pos = "!right&below";
            } else if ((textNodePosition.right <= nodePosition.left) &&
                (textNodePosition.bottom <= nodePosition.top)) {
                /* inputNode is on the (right & below) of the textNode;
                 * so we compute the distance between textNode(bottom,right)
                 * and inputNode(top,left) corners.
                 */
                distance = (nodePosition.top - textNodePosition.bottom) +
                           (nodePosition.left - textNodePosition.right);
                pos = "right&below";
            } else { 
                // Node is not in the South-East quadrant with respect to textNode, so it not of interest .. 
                distance = 0xffffffff; // set distance to a large enough value
            }

            
            if ((distance <= maxAcceptableDistance) && (distance < minDistance)) {
                    console.log("detectForeignKeyFields(): candidate node associated to label '",
                        FKarray[i].TextElem.innerText, "' distance=", distance,
                        " maxAcceptableDistance=", maxAcceptableDistance, " is: ");
                    console.log(node);
                    console.log("Node top and left positions:", nodePosition.top, nodePosition.left," pos=", pos);
                    
                    minDistance = distance;
                    assocInputNode = node;
                    //node.style.border = "2px solid black";
            } 

        });

        if (assocInputNode != null) {
            console.log("detectForeignKeyFields(): the node associated to label '",
                        FKarray[i].TextElem.innerText, " is: ", assocInputNode);
            assocInputNode.style.border = "2px solid black";
            FKarray[i].AssocInputNode = assocInputNode;
        }
    }
        
    return FKarray;
}


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
            if (ancestor != null) {
                //ancestor.style.border = "2px solid purple";
                ancestor.style.position = "relative";
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
    if (node1.contains(node2)) return node1;
    if (node2.contains(node1)) return node2;
    let parent = node1;
    while (parent = parent.parentNode) {
        if (parent.contains(node2)) return parent;
        if (parent.isEqualNode(root)) return root;
    }
    return null;
}


function SerializeDOMPath(root, path) {
    let str = "";
    for(let i=0; i<path.length; i++) {
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


function getDocumentRoot() {
    // return document if this document has no frames/iframes, or if it has frames/iframes
    // return the document of the last visible frame.
    console.log ("There are ", window.frames.length, " frames in the current window.");

    let root = document;
    let i = 0;
    while (i<window.frames.length) {
        // hack pentru Ms Dynamics 2016 CRM (nu ar trebui sa fie nevoie de asta daca implementam
        // cod care sa caute root/text/inputElements/table/orice doar in diff-ul de DOM (elem.
        // care nu au atributul "taskmateID"))
        if (window.frames[i].frameElement.getAttribute("id") == "NavBarGloablQuickCreate") {
            i++;
            continue;
        }

        // set as root the last iframe that is visible
        if (window.frames[i]) {
            //let style = window.getComputedStyle(document.getElementsByTagName("iframe")[i]);
            let style = window.getComputedStyle(window.frames[i].frameElement);
            console.log("getDocumentRoot(): frame=", window.frames[i].frameElement);
            if ((style.visibility != "hidden") && (style.display != "none")) {
                root = window.frames[i].document;
                console.log("Root element is the " + i + "-th frame.");
                console.log(window.frames[i].frameElement);
                //break;
            }
        }
        i++;
    }
    return root;
}

function detectTables() {
    console.log("Detecting tables..");
    let root = getDocumentRoot().body;
    let detectedTextElements = filterDetectedTextElements(getTextElements(root, true));

    console.log("textElements are:");
    detectedTextElements.forEach(function(node) {
        console.log(node.innerText, node);
    })
    highlightElements(detectedTextElements, "green");
    
    //findMostCommonFontsize(window.frames[0].document.body, detectedTextElements);
    //let defaultFontSize = getDefaultFontSize(root);

    let rowClustersList = clusterTextElementsHorizontally(root, detectedTextElements);
    let detectedTables = clusterRowsVertically(root, rowClustersList);

    // highlight tables
    if (detectedTables != null) {
        detectedTables.forEach(function(table) {
            if (table.tableRootTag!=null) {
                table.tableRootTag.style.border = "2px solid red";
            }
        })
    }
    console.log("Detected tables:", detectedTables); 
}


function getDefaultFontSize(root){
    root = root || document.body;
    let testDiv = document.createElement('div');
    testDiv.style.cssText='display:inline-block; padding:0; line-height:1; position:absolute; visibility:hidden; font-size:1em';
    testDiv.appendChild(document.createTextNode('M'));
    root.appendChild(testDiv);
    let fs = testDiv.offsetHeight;
    root.removeChild(testDiv);
    return fs;
}


function clusterTextElementsHorizontally(root, textElements) {
    let rowClustersList = [];

    // Sort ascending textElements based on their Top position
    textElements.sort(function(elem1, elem2) {
        if (elem1.getBoundingClientRect().top < elem2.getBoundingClientRect().top)
            return -1;
        else if (elem1.getBoundingClientRect().top == elem2.getBoundingClientRect().top)
            return 0;
        else return 1;
    })

    // Now we try to find clusters of node candidates that represent a Table row.
    // The text nodes candidates from a row cluster must satisfy the following 
    // inequality: max N.Top - min N.Top <= min N.Height
    // where max N.Top is the maximum Top property from all N nodes from the cluster,
    // max N.Top is the minimum Top property from all N nodes from the cluster and
    // min N.Height is the minimum height of all N nodes from the cluster
    // These nodes form a FeasibleClusterSet.

    let rowclusterRootTags = [];
    let feasibleClusterSet = null;
    while (textElements.length>1) {
        //UNDOhighlightRowClusters(rowclusterRootTags);   // for debugging purposes
        /*if (feasibleClusterSet)
            feasibleClusterSet.innerTextNodes.forEach(function(item) { // for debugging purposes - undo highlight
                item.style.border = "";
            });*/        
        textElements[0].style.border = "2px solid magenta"; // for debugging

        let savedLength = textElements.length;
        // take the first node and initialize the cluster
        feasibleClusterSet = { minTop : textElements[0].getBoundingClientRect().top, 
                               maxTop : textElements[0].getBoundingClientRect().top,
                               maxBottom : textElements[0].getBoundingClientRect().bottom,
                               minHeight : textElements[0].getBoundingClientRect().height,
                               innerTextNodes : [textElements[0]], 
                               ancestorNodes : [ { node: textElements[0], cluster: -1 /*no cluster*/} ],
                               clusters : [] /* list of cluster IDs */,
                               maxNodesCountInACluster : 0 /* the no. of nodes in the largest cluster */};
        textElements.shift(); // remove the first text element from array
        console.log("clusterTextElementsHorizontally: feasibleClusterSet.ancestorNodes.length=", 
                feasibleClusterSet.ancestorNodes.length);

        let iteration = -1;
        while (textElements.length > 0) {
            iteration++;
            console.log("clusterTextElementsHorizontally: iteration=",iteration,
                        " feasibleClusterSet.ancestorNodes.length=", feasibleClusterSet.ancestorNodes.length);
            let candidateNode = textElements.shift(); // take the first node 
            if (!addCandidateToFeasibleClusterSet(feasibleClusterSet, candidateNode)) {
                textElements.unshift(candidateNode);
/*TODO: Remove this*/  candidateNode.style.border = ""; // for debugging
                break;
            }
        }
        let bottomLimitForNextRowCluster;
        if (textElements.length>0) {
            bottomLimitForNextRowCluster = textElements[0].getBoundingClientRect().top * 1.10; // + 10 percents
        } else {
            bottomLimitForNextRowCluster = root.getBoundingClientRect().bottom;
        }
        let feasibleClusterSetResult = clusterizeHorizontally (root, feasibleClusterSet, bottomLimitForNextRowCluster);
        //let feasibleClusterSetResult = clusterizeHorizontally_ver1 (root, feasibleClusterSet, bottomLimitForNextRowCluster);
        // If no cluster was discovered (feasibleClusterSetResult == null) we should probably add
        // all the leftover nodes (i.e. all textElements from the initial feasibleClusterSet) to 
        // the textElements array, except the first one; instead, we drop all these leftover nodes
        // here for efficiency reasons - maybe this is not the correct decision
        if (feasibleClusterSetResult != null) {
            // compute leftover nodes from the clusterization solution (i.e. nodes that do not belong to any cluster)
            let leftoverNodes = [];
            for(let j=0; j<feasibleClusterSetResult.ancestorNodes.length; j++) {
                if (feasibleClusterSetResult.ancestorNodes[j].cluster < 0) {
                    leftoverNodes.push(feasibleClusterSetResult.innerTextNodes[j]);
                }
            }
            // sort descending the lefovers based on their Top position, so that when we add them back
            // to the textElements array in reverse, they will be in ascending order
            leftoverNodes.sort(function(elem1, elem2) {
                if (elem1.getBoundingClientRect().top > elem2.getBoundingClientRect().top)
                    return -1;
                else if (elem1.getBoundingClientRect().top == elem2.getBoundingClientRect().top)
                    return 0;
                else return 1;
            });
            for(let j=0; j<leftoverNodes.length; j++) {
                textElements.unshift(leftoverNodes[j]);
/*TODO: Remove this*/  leftoverNodes[j].style.border = ""; // for debugging
            }
            // if no new cluster was discovered in the previous cycle, skip over the first textElement node
            if (savedLength == textElements.length) textElements.shift(); 
            rowclusterRootTags = computeRowClusterRootTags(root, feasibleClusterSetResult);
            highlightRowClusterNodes(feasibleClusterSetResult);
            highlightRowClusters(rowclusterRootTags);
            
            // save the row clusters discovered; each element of rowClustersList represents a
            // set of rowclusters discovered for that row, i.e. rowClusterList[i] contains a 
            // set of rowclusters discovered in that row (this rowclusters do not necesarily
            // belong to the same table)
            if ((rowclusterRootTags!=null) && (rowclusterRootTags.length>0)) {
                let rowclusters = { innerTextNodes : feasibleClusterSetResult.innerTextNodes,
                                    ancestorNodes : feasibleClusterSetResult.ancestorNodes /*[{node: .., cluster: .. }]*/,
                                    clusters : feasibleClusterSetResult.clusters,
                                    rowclusterRoots : rowclusterRootTags };
                rowClustersList.push(rowclusters);
            };
        }
    }

    return rowClustersList;
}


function addCandidateToFeasibleClusterSet(feasibleClusterSet, textNode) {
    function checkTopConditions(feasibleClusterSet, textNode) {
        rect = textNode.getBoundingClientRect();
        let minTop = feasibleClusterSet.minTop;
        let maxTop = feasibleClusterSet.maxTop;
        let minHeight = feasibleClusterSet.minHeight;
        if (rect.top < minTop) minTop = rect.top;
        if (rect.top > maxTop) maxTop = rect.top;
        if (rect.height < minHeight) minHeight = rect.height;

        if (maxTop - minTop <= minHeight) return true;
        else return false;
    }

    if (!checkTopConditions(feasibleClusterSet, textNode))
        return false;

    feasibleClusterSet.innerTextNodes.push(textNode);
    feasibleClusterSet.ancestorNodes.push({node:textNode, cluster:-1});
    rect = textNode.getBoundingClientRect();
    if (rect.top < feasibleClusterSet.minTop) feasibleClusterSet.minTop = rect.top;
    if (rect.top > feasibleClusterSet.maxTop) feasibleClusterSet.maxTop = rect.top;
    if (rect.height < feasibleClusterSet.minHeight) feasibleClusterSet.minHeight = rect.height;
    if (rect.bottom > feasibleClusterSet.maxBottom) feasibleClusterSet.maxBottom = rect.bottom;
    //console.log("addCandidateToFeasibleClusterSet: textNode=", textNode);
    //console.log("addCandidateToFeasibleClusterSet: feasibleClusterSet.ancestorNodes=", feasibleClusterSet.ancestorNodes);
    textNode.style.border = "2px solid magenta";

    return true;
} 


function clusterizeHorizontally (root, feasibleClusterSet, bottomLimitForNextRowCluster) {
    function findMaximumTopNode(feasibleClusterSet) {
        let maxTopidx = -1;
        let maxTop = -65535; // a very low, imposible value
        feasibleClusterSet.ancestorNodes.forEach (function(ancestor, idx) {
            if ((ancestor.cluster != -2 /* ancestor is usable */) && 
                (ancestor.node.getBoundingClientRect().top > maxTop)) {
                    maxTop = ancestor.node.getBoundingClientRect().top;
                    maxTopidx = idx;
            }
        })
        return maxTopidx;
    };

    function getAncestorNodesFromCluster(feasibleClusterSet, clusterNo) {
        let indexes = [];
        for(let i=0; i<feasibleClusterSet.ancestorNodes.length; i++) {
            if (feasibleClusterSet.ancestorNodes[i].cluster == clusterNo) {
                indexes.push(i);
            }
        }
        return indexes;
    }

    function computeMaxNodesCount(feasibleClusterSet) {
        feasibleClusterSet.maxNodesCountInACluster = 0;
        for(let i=0; i<feasibleClusterSet.clusters.length; i++) {
            let clusterNodeCount = 0;
            for (let j=0; j<feasibleClusterSet.ancestorNodes.length; j++) {
                if (feasibleClusterSet.ancestorNodes[j].cluster == feasibleClusterSet.clusters[i])
                        clusterNodeCount++;
            }
            if (clusterNodeCount > feasibleClusterSet.maxNodesCountInACluster) {
                feasibleClusterSet.maxNodesCountInACluster = clusterNodeCount;
            }
        }
    };

    // we can't  build row clusters with one single text node
    if (feasibleClusterSet.innerTextNodes.length < 2) return null; 

    // first, sort text nodes based on their Left postion
    // of course, don't forget to sort also the corresponding values from ancestorNodes
    // TODO: I don't think this is needed anymore
    for (let i=0; i<feasibleClusterSet.innerTextNodes.length-1; i++)
        for(let j=i+1; j<feasibleClusterSet.innerTextNodes.length; j++) {
            if (feasibleClusterSet.innerTextNodes[i].getBoundingClientRect().left >
                feasibleClusterSet.innerTextNodes[j].getBoundingClientRect().left) {
                let aux = feasibleClusterSet.innerTextNodes[i];
                feasibleClusterSet.innerTextNodes[i] = feasibleClusterSet.innerTextNodes[j];
                feasibleClusterSet.innerTextNodes[j] = aux;

                aux = feasibleClusterSet.ancestorNodes[i];
                feasibleClusterSet.ancestorNodes[i] = feasibleClusterSet.ancestorNodes[j];
                feasibleClusterSet.ancestorNodes[j] = aux;
            }
        }
    
    let ClusterizationResults = []; // this will store a list of possible clusterizations
                                    // actually each item of this array will be a feasibleClusterSet
                                    // containing one or more row clusters

    // We try to extend the bounding box of ancestorNodes by nevigating to their parents
    // (up to "root") until we discover at least a row cluster with at least two components.  
    // Two or more innerTextNodes form a cluster if their ancestorNodes have the properties:
    //      - the ancestor nodes have the same Top
    //      - the ancestor nodes have the same Height
    initializeRowClusters(feasibleClusterSet);
    console.log("initializeRowClusters: " + feasibleClusterSet.clusters.length + " have been initialized.");
    computeMaxNodesCount(feasibleClusterSet); // update feasibleClusterSet.maxNodesCountInACluster
    // save a custom deep-copy of this feasibleClusterSet as a possible clusterization
    // it is actually a deep-copy of the object, except the DOM elements within which are shallow copied
    let copyFCS = copyFeasibleClusterSet(feasibleClusterSet);
    ClusterizationResults.push(copyFCS); 

    let iteration = -1;
    // try to increase the number of nodes in a cluster from the feasibleClusterSet
    while (true) { // TODO: there should be a safety exit condition here
        iteration++;
        console.log("clusterizeHorizontally: this is iteration "+iteration);
        // if all ancestorNodes from this feasibleClusterSet are unusable (cluster==-2), exit the loop
        let n = 0;
        for (i=0; i<feasibleClusterSet.ancestorNodes.length; i++) {
            if (feasibleClusterSet.ancestorNodes[i].cluster != -2) break;
            n++;
        }
        if (n == feasibleClusterSet.ancestorNodes.length) break; // The only EXIT from the while(true) loop
        console.log("clusterizeHorizontally: feasibleClusterSet.ancestorNodes: ", feasibleClusterSet.ancestorNodes);
        printArray(feasibleClusterSet.ancestorNodes);

        let maxTopidx = findMaximumTopNode(feasibleClusterSet);
        console.log("maxTopidx=", maxTopidx, " parentNode:", feasibleClusterSet.ancestorNodes[maxTopidx].node.parentNode);
        // if maxTopidx node is unusable, find another candidate ancestorNode to promote to its parent
        if (feasibleClusterSet.ancestorNodes[maxTopidx].cluster == -2) {
            continue; 
        }

        let previousClusterNo = feasibleClusterSet.ancestorNodes[maxTopidx].cluster;
        // promote maximum Top ancestor node to its parent
        feasibleClusterSet.ancestorNodes[maxTopidx].node = feasibleClusterSet.ancestorNodes[maxTopidx].node.parentNode;
        // if parent is root, stop using this ancestorNode
        if (root.isEqualNode(feasibleClusterSet.ancestorNodes[maxTopidx].node)) {
            feasibleClusterSet.ancestorNodes[maxTopidx].cluster = -2; // unusable node
        }
        // if parent now contains more than one innerText element and these innerText elements
        // are not already part of the current feasibleClusterSet, stop using this ancestorNode
        // because we may have crossed to the previous (i.e. smaller Top position) feasible cluster set
        let nodeSet = filterDetectedTextElements(getTextElements(
                            feasibleClusterSet.ancestorNodes[maxTopidx].node));
        if (nodeSet.length > 1) {
            for(let i=0; i<nodeSet.length; i++) {
                if (nodeSet[i].getBoundingClientRect().Top < feasibleClusterSet.minTop) {
                    feasibleClusterSet.ancestorNodes[maxTopidx].cluster = -2; // unusable node
                    break;
                }
            }
        }
        // if parent overlaps another ancestorNode in the Feasible cluster set, stop using this ancestorNode
        let overlap = false;
        for (i=0; i<feasibleClusterSet.ancestorNodes.length; i++) {
            if (i==maxTopidx) continue;
            if (feasibleClusterSet.ancestorNodes[i].cluster!=-2) {
                // if ancestorNodes[i] is usable, compare against it 
                if (overlappingBoundingBoxes(feasibleClusterSet.ancestorNodes[maxTopidx].node,
                                            feasibleClusterSet.ancestorNodes[i].node)) {
                    overlap = true;
                    break;
                }
            } else {
                // if ancestorNodes[i] is unusable, compare against its corresponding innerTextNode;
                // if we do not do this, for the case where all ancestorNodes have cluster -2, except
                // the maxTopidx one, the promotion of this node to its parent will continue many times, inneficiently
                if (overlappingBoundingBoxes(feasibleClusterSet.ancestorNodes[maxTopidx].node,
                                            feasibleClusterSet.innerTextNodes[i])) {
                    overlap = true;
                    break;
                }
            }    
        }
        if (overlap == true) {
            feasibleClusterSet.ancestorNodes[maxTopidx].cluster = -2; // unusable node
        }
        // if parent hits bottomLimitForNextRowCluster, stop using this ancestorNode
        let rect = feasibleClusterSet.ancestorNodes[maxTopidx].node.getBoundingClientRect();
        if (rect.bottom >= bottomLimitForNextRowCluster) {
            feasibleClusterSet.ancestorNodes[maxTopidx].cluster = -2; // unusable node
        } else if (feasibleClusterSet.maxBottom < rect.bottom) {
            feasibleClusterSet.maxBottom = rect.bottom;
        }

        // else update the previousClusterNo cluster
        if (feasibleClusterSet.ancestorNodes[maxTopidx].cluster != -2) {
            // remove maxTopidx ancestorNode from its previous cluster
            feasibleClusterSet.ancestorNodes[maxTopidx].cluster = -1; // cluster not set
        }
        // update previousClusterNo because maxTopidx ancestorNode exited it
        if (previousClusterNo > -1) {
            let ancestorNodesIdx = getAncestorNodesFromCluster(feasibleClusterSet, previousClusterNo);
            if (ancestorNodesIdx.length == 1) { // remove this cluster since there's only one node in it
                if (feasibleClusterSet.clusters.includes(previousClusterNo)) {
                    feasibleClusterSet.clusters.splice(feasibleClusterSet.clusters.indexOf(previousClusterNo), 1);
                }
                feasibleClusterSet.ancestorNodes[ancestorNodesIdx[0]].cluster = -1;
            }
        }
        // if maxTopidx ancestorNode is still usable, try to discover new clusters
        if (feasibleClusterSet.ancestorNodes[maxTopidx].cluster != -2) {
            let updatedAncestorNode = feasibleClusterSet.ancestorNodes[maxTopidx];
            for (i=0; i<feasibleClusterSet.ancestorNodes.length; i++) {
                if (!updatedAncestorNode.node.isEqualNode(feasibleClusterSet.ancestorNodes[i].node) &&
                    (feasibleClusterSet.ancestorNodes[i].cluster != -2)) {
                    if (check2NodesMiniCluster(updatedAncestorNode.node, feasibleClusterSet.ancestorNodes[i].node)) {
                        // they belong to the same row cluster
                        if (feasibleClusterSet.ancestorNodes[i].cluster > -1) {
                            updatedAncestorNode.cluster = feasibleClusterSet.ancestorNodes[i].cluster;
                            break; // because updatedAncestorNode belongs to existing cluster
                        } else if (updatedAncestorNode.cluster > -1) {
                            // this should not normally happer, but just in case
                            feasibleClusterSet.ancestorNodes[i].cluster = updatedAncestorNode.cluster;
                        } else {
                            // add new cluster
                            let clusterNo = (feasibleClusterSet.clusters.length == 0) ? 0 : 
                                            feasibleClusterSet.clusters[feasibleClusterSet.clusters.length - 1] + 1;
                            feasibleClusterSet.clusters.push(clusterNo);
                            feasibleClusterSet.ancestorNodes[i].cluster = clusterNo;
                            updatedAncestorNode.cluster = clusterNo;                        
                        }                     
                    }
                }
            }
        }
        computeMaxNodesCount(feasibleClusterSet); // update feasibleClusterSet.maxNodesCountInACluster
        // save a custom deep-copy of this feasibleClusterSet as a possible clusterization
        // it is actually a deep-copy of the object, except the DOM elements within which are shallow copied
        let copyFCS = copyFeasibleClusterSet(feasibleClusterSet);
        ClusterizationResults.push(copyFCS); 

        /*let randomColor = Math.floor(Math.random()*16777215).toString(16);
        feasibleClusterSet.ancestorNodes.forEach(function(item) {
            //item.node.style.background = "#" + randomColor;
            item.node.style.border = "2px solid magenta";
        });*/
    }

    /* Now, after computing all possible clusterizations (I'm not sure if we covered all cases),
     * it's time to pick the best one. The best clusterization is, according to our criterion,
     * the one that produced a cluster with the maximum number of ancestorNodes in it and if
     * there are more than one such clusterizations with this property, we choose the one with 
     * the maximum number of succesive parent walks applied on ancestorNodes.
     */
    let maxCount = 0;
    let maxCountIdx = -1;
    for(let i=0; i<ClusterizationResults.length; i++) {
        if (ClusterizationResults[i].maxNodesCountInACluster >= maxCount) {
            maxCount = ClusterizationResults[i].maxNodesCountInACluster;
            maxCountIdx = i;
        }
    }
    
    if (maxCountIdx > -1)
        return ClusterizationResults[maxCountIdx];
    else 
        return null;
}


function clusterizeHorizontally_ver1 (root, feasibleClusterSet, bottomLimitForNextRowCluster) {
    function computeMaxNodesCount(feasibleClusterSet) {
        feasibleClusterSet.maxNodesCountInACluster = 0;
        for(let i=0; i<feasibleClusterSet.clusters.length; i++) {
            let clusterNodeCount = 0;
            for (let j=0; j<feasibleClusterSet.ancestorNodes.length; j++) {
                if (feasibleClusterSet.ancestorNodes[j].cluster == feasibleClusterSet.clusters[i])
                        clusterNodeCount++;
            }
            if (clusterNodeCount > feasibleClusterSet.maxNodesCountInACluster) {
                feasibleClusterSet.maxNodesCountInACluster = clusterNodeCount;
            }
        }
    };


    // first, sort text nodes based on their Left postion
    // TODO: I don't think this is needed anymore
    for (let i=0; i<feasibleClusterSet.innerTextNodes.length-1; i++)
        for(let j=i+1; j<feasibleClusterSet.innerTextNodes.length; j++) {
            if (feasibleClusterSet.innerTextNodes[i].getBoundingClientRect().left >
                feasibleClusterSet.innerTextNodes[j].getBoundingClientRect().left) {
                let aux = feasibleClusterSet.innerTextNodes[i];
                feasibleClusterSet.innerTextNodes[i] = feasibleClusterSet.innerTextNodes[j];
                feasibleClusterSet.innerTextNodes[j] = aux;

                aux = feasibleClusterSet.ancestorNodes[i];
                feasibleClusterSet.ancestorNodes[i] = feasibleClusterSet.ancestorNodes[j];
                feasibleClusterSet.ancestorNodes[j] = aux;
            }
        }

    // Two or more innerTextNodes form a cluster if their ancestorNodes have the properties:
    //      - the ancestor nodes have the same Top
    //      - the ancestor nodes have the same Height
    //      - they have a common ancestor

    // update all ancestorNodes to their parents
    for(let i=0; i<feasibleClusterSet.ancestorNodes.length; i++) {
        feasibleClusterSet.ancestorNodes[i].node = feasibleClusterSet.ancestorNodes[i].node.parentNode;
    }

    initializeRowClusters(feasibleClusterSet);
    console.log("initializeRowClusters: " + feasibleClusterSet.clusters.length + " have been initialized.");

    let randomColor = Math.floor(Math.random()*16777215).toString(16);
    feasibleClusterSet.ancestorNodes.forEach(function(item) {
        item.node.style.background = "#" + randomColor;
    })

    computeMaxNodesCount(feasibleClusterSet); // update feasibleClusterSet.maxNodesCountInACluster
    return feasibleClusterSet;
}


function check2NodesMiniCluster(node1, node2) {
    // if their bounding boxes overlap, they are not a cluster
    if (overlappingBoundingBoxes(node1, node2)) return false;
    // Two nodes form a cluster if their ancestorNodes have the properties:
    //      - the ancestor nodes have the same Top
    //      - the ancestor nodes have the same Height
    // node1 and node2 are already ancestor nodes
    let rect1 = node1.getBoundingClientRect();
    let rect2 = node2.getBoundingClientRect();
    let threshold = rect1.height < rect2.height ? rect1.height*0.25 : rect2.height*0.25; // 25% threshold
    //if ((rect1.top == rect2.top) && (rect1.height == rect2.height))
    if ((((rect1.top >= rect2.top-threshold) && (rect1.top <= rect2.top+threshold)) || 
        ((rect2.top >= rect1.top-threshold) && (rect2.top <= rect1.top+threshold))) &&
        (((rect1.height >= rect2.height-threshold) && (rect1.height <= rect2.height+threshold)) ||
        ((rect2.height >= rect1.height-threshold) && (rect2.height <= rect1.height+threshold))))    
        return true; // TODO: probably, here I should add a small separator of 2px between tops and heights
}


function initializeRowClusters(feasibleClusterSet) {
    let i = 0;
    /*console.log("initializeRowClusters(): feasibleClusterSet.ancestorNodes.length="+
                feasibleClusterSet.ancestorNodes.length);
    console.log(feasibleClusterSet.ancestorNodes);*/
    for (i=0; i<feasibleClusterSet.ancestorNodes.length-1; i++) {
        if (feasibleClusterSet.ancestorNodes[i].cluster == -1) { 
            for (j=i+1; j<feasibleClusterSet.ancestorNodes.length; j++) {
                if (feasibleClusterSet.ancestorNodes[j].cluster == -1) { 
                    if (check2NodesMiniCluster(feasibleClusterSet.ancestorNodes[i].node,
                        feasibleClusterSet.ancestorNodes[j].node)) {
                            // the two nodes form a cluster
                            if (feasibleClusterSet.ancestorNodes[i].cluster > -1) {
                                // add to existing cluster
                                feasibleClusterSet.ancestorNodes[j].cluster = feasibleClusterSet.ancestorNodes[i].cluster;
                            } else {
                                // add new cluster
                                let clusterNo = (feasibleClusterSet.clusters.length == 0) ? 0 : 
                                                feasibleClusterSet.clusters[feasibleClusterSet.clusters.length - 1] + 1;
                                feasibleClusterSet.clusters.push(clusterNo);
                                feasibleClusterSet.ancestorNodes[i].cluster = clusterNo;
                                feasibleClusterSet.ancestorNodes[j].cluster = clusterNo;
                            }
                    }
                }
            }
        }
    }
    console.log("initializeRowClusters: ", feasibleClusterSet.ancestorNodes);
}

function clusterRowsVertically(root, rowClustersList) {
    function checkColumnAlignments(tablerow1, tablerow2) {
        const HORIZONTAL_TABLE_THRESHOLD = 10; // 10px 
        let noOfColumns = 0;
        let noOfMatches = 0;
        for(let i=0; i<tablerow2.ancestorNodes.length; i++) {
            if (tablerow2.ancestorNodes[i].cluster == tablerow2.clusters[tablerow2.rowclusterIndex]) {
                rect1 = tablerow2.innerTextNodes[i].getBoundingClientRect();
                noOfColumns++;
                for(let j=0; j<tablerow1.ancestorNodes.length; j++) {
                    if (tablerow1.ancestorNodes[j].cluster == tablerow1.clusters[tablerow1.rowclusterIndex]) {
                        rect2 = tablerow1.innerTextNodes[j].getBoundingClientRect();
                        if ((rect1.left > rect2.left - HORIZONTAL_TABLE_THRESHOLD) && 
                            (rect1.left < rect2.left + HORIZONTAL_TABLE_THRESHOLD)) {
                            noOfMatches++;
                            break;
                        }
                    }
                }
            }
        }
        return noOfMatches;        
    }

    function checkConsecutiveRowsInTable(firstrow, tablerow1, tablerow2) {
        if ((firstrow==null) || (tablerow1==null) || (tablerow2==null)) return false;
        let rowclusterRootTag1 = tablerow1.rowclusterRoot;
        let rowclusterRootTag2 = tablerow2.rowclusterRoot;
        if ((rowclusterRootTag1==null) || (rowclusterRootTag1==root)) return false;
        if ((rowclusterRootTag2==null) || (rowclusterRootTag2==root)) return false;
        /* two rowclusters, rowclusterRootTag1 and rowclusterRootTag2 belong to the same table 
         * if the following conditions are met: 
         *      - they have the same left and right position +/- HORIZONTAL_TABLE_THRESHOLD
         *      - they have the same width +/- HORIZONTAL_TABLE_THRESHOLD
         *      - the separation between them is maximum VERTICAL_TABLE_THRESHOLD
         */
        const HORIZONTAL_TABLE_THRESHOLD = 10; // 10px 
        let rect1 = rowclusterRootTag1.getBoundingClientRect();
        let rect2 = rowclusterRootTag2.getBoundingClientRect();
        let minHeight = rect1.height<rect2.height ? rect1.height : rect2.height;
        const VERTICAL_TABLE_THRESHOLD = minHeight * 2;

        if ((rect1.left < rect2.left - HORIZONTAL_TABLE_THRESHOLD) || 
            (rect2.left < rect1.left - HORIZONTAL_TABLE_THRESHOLD)) {
                console.log("checkConsecutiveRowsInTable() - false: ", rowclusterRootTag1, rowclusterRootTag2);
                return false;
        }
        if ((rect1.right < rect2.right - HORIZONTAL_TABLE_THRESHOLD) || 
            (rect2.right < rect1.right - HORIZONTAL_TABLE_THRESHOLD)) {
                console.log("checkConsecutiveRowsInTable() - false: ", rowclusterRootTag1, rowclusterRootTag2);
                return false;
        }
        if ((rect1.width > rect2.width + HORIZONTAL_TABLE_THRESHOLD) || 
            (rect2.width > rect1.width + HORIZONTAL_TABLE_THRESHOLD)) {
                console.log("checkConsecutiveRowsInTable() - false: ", rowclusterRootTag1, rowclusterRootTag2);
                return false;
        }
        if (rect2.top - rect1.bottom > VERTICAL_TABLE_THRESHOLD) {
                console.log("checkConsecutiveRowsInTable() - false: ", rowclusterRootTag1, rowclusterRootTag2);
                return false;
        }

        // check column alignments - we check Left position alignments
        /*let tablerow = { rowclusterRoot : rowCandidate2.rowclusterRoots[k],
                           rowclusterIndex : k,
                           innerTextNodes : rowCandidate2.innerTextNodes,
                           ancestorNodes : rowCandidate2.ancestorNodes,
                           clusters : rowCandidate2.clusters};
        */
        if (checkColumnAlignments(tablerow1, tablerow2)<2) {
            // we verify tablerow2 against firstrow
            if (checkColumnAlignments(firstrow, tablerow2)<2) {
                return false;
            }
        }

        console.log("checkConsecutiveRowsInTable() - TRUE: ", rowclusterRootTag1, rowclusterRootTag2);
        return true;
    }
    /* The structure of rowClustersList is the following:
     * rowClustersList = [ {innerTextNodes : feasibleClusterSetResult.innerTextNodes,
     *                 ancestorNodes : feasibleClusterSetResult.ancestorNodes //[{node: ..., cluster: ... }]//,
     *                 clusters : feasibleClusterSetResult.clusters,
     *                 rowclusterRoots : rowclusterRootTags} ];
     */
    // first, we add a new property for each rowcluster specifying wether, the row cluster
    // is available or it was already used for building a table.
    for (i=0; i<rowClustersList.length; i++) {
        rowClustersList[i].clusterAvailability = Array(rowClustersList[i].rowclusterRoots.length).fill(true);
    }

    let detectedTables = [];
    i = 0;
    while (i<rowClustersList.length-1) {
        // check if at table starts with row "i"; first, check if we can find consecutive rows
        // belonging to the same table in rowclusters from rowClustersList[i] and rowClustersList[i+1]
        let rowCandidate1 = rowClustersList[i];
        let rowCandidate2 = rowClustersList[i+1];
        // Theoretically, each rowCandidate can have multiple clusters, but in practice, there is actually 
        // only one cluster (i.e. rowCandidate1.clusters.length=1)
        for(let j=0; j<rowCandidate1.clusters.length; j++) {
            if (!rowCandidate1.clusterAvailability[j]) continue;
            let foundTable = null;
            let InitialTablerow = { rowclusterRoot : rowCandidate1.rowclusterRoots[j],
                                    rowclusterIndex : j,
                                    innerTextNodes : rowCandidate1.innerTextNodes,
                                    ancestorNodes : rowCandidate1.ancestorNodes,
                                    clusters : rowCandidate1.clusters};
            // discover a table which starts with row rowCandidate1.rowclusterRoots[j] 
            for(let k=0; k<rowCandidate2.clusters.length; k++) {
                let tablerow = { rowclusterRoot : rowCandidate2.rowclusterRoots[k],
                                 rowclusterIndex : k,
                                 innerTextNodes : rowCandidate2.innerTextNodes,
                                 ancestorNodes : rowCandidate2.ancestorNodes,
                                 clusters : rowCandidate2.clusters};
                if (rowCandidate2.clusterAvailability[k] && 
                    checkConsecutiveRowsInTable(InitialTablerow, InitialTablerow, tablerow)) {
                    foundTable = [];
                    foundTable.push(InitialTablerow);
                    foundTable.push(tablerow);
                    rowCandidate1.clusterAvailability[j] = false;
                    rowCandidate2.clusterAvailability[k] = false;
                    break;
                }
            }
            if (foundTable != null) {
                // here, we have found a table made from 2 rows; continue adding subsequent rows to the table if we can
                let m = i+2;
                let tableNotDone = true;
                while (tableNotDone && (m<rowClustersList.length)) {
                    tableNotDone = false;
                    let lastTableRow = foundTable[foundTable.length-1];
                    let lastRowClusterIndex = foundTable[foundTable.length-1].rowclusterIndex;
                    let rowCandidate = rowClustersList[m];
                    for (n=0; n<rowCandidate.clusters.length; n++) {
                        let tablerow = { rowclusterRoot : rowCandidate.rowclusterRoots[n],
                                         rowclusterIndex : n,
                                         innerTextNodes : rowCandidate.innerTextNodes,
                                         ancestorNodes : rowCandidate.ancestorNodes,
                                         clusters : rowCandidate.clusters};
                        if (rowCandidate.clusterAvailability[n] && checkConsecutiveRowsInTable(foundTable[0], lastTableRow, tablerow)) {
                            rowCandidate.clusterAvailability[n] = false;
                            foundTable.push(tablerow);
                            tableNotDone = true;
                            break;
                        }
                    }
                    m++;    
                }
                let tableRootTag = computeTableRootTag(root, foundTable);
                detectedTables.push({rows : foundTable, tableRootTag : tableRootTag});
            }
        }

        i++;
    }
    return detectedTables;
}


function highlightRowClusterNodes(feasibleClusterSetResult) {
    feasibleClusterSetResult.clusters.forEach(function(clusterNo) {
        let randomColor = Math.floor(Math.random()*16777215).toString(16);
        for(let i=0; i<feasibleClusterSetResult.ancestorNodes.length; i++) {
            if (feasibleClusterSetResult.ancestorNodes[i].cluster == clusterNo) {
                feasibleClusterSetResult.ancestorNodes[i].node.style.border = "1px solid #" + randomColor;
            }
        }
    })
}


function highlightRowClusters(rowclusterRootTags) {
    for(let i=0; i<rowclusterRootTags.length; i++) {
        if (rowclusterRootTags[i] != null) {
            let red = 180 + Math.floor(Math.random()*60);
            let green = 180 + Math.floor(Math.random()*60);
            let blue = 180 + Math.floor(Math.random()*60);
            let randomColor = Math.floor(red*65536+green*256+blue).toString(16);
            rowclusterRootTags[i].style.background = "#" + randomColor;
        }
    }
}

function UNDOhighlightRowClusters(rowclusterRootTags) {
    for(let i=0; i<rowclusterRootTags.length; i++) {
        if (rowclusterRootTags[i] != null) {
            rowclusterRootTags[i].style.background = "";
        }
    }
}

function computeRowClusterRootTags(root, feasibleClusterSetResult) {
    let rowclusterRoots = [];
    for (let i=0; i<feasibleClusterSetResult.clusters.length; i++) {
        let clusterNo = feasibleClusterSetResult.clusters[i];
        let clusterCommonAncestor = null;
        for(let j=0; j<feasibleClusterSetResult.ancestorNodes.length; j++) {
            if (feasibleClusterSetResult.ancestorNodes[j].cluster == clusterNo) {
                if (clusterCommonAncestor == null) {
                    clusterCommonAncestor = feasibleClusterSetResult.ancestorNodes[j].node;
                } else {
                    clusterCommonAncestor = getClosestCommonAncestor(root, clusterCommonAncestor, 
                                                feasibleClusterSetResult.ancestorNodes[j].node);
                    if ((clusterCommonAncestor==null) || (clusterCommonAncestor==root)) 
                        break;
                }
            }
        }
        if ((clusterCommonAncestor!=null) && (clusterCommonAncestor!=root)) {
            rowclusterRoots[i] = clusterCommonAncestor;  
        } else {
            rowclusterRoots[i] = null;
            console.log("highlightRowClusters: Can not highlight row cluster - clusterCommonAncestor=null|root !");
        }
    }
    return rowclusterRoots;
}

function computeTableRootTag(root, table) {
    let tableCommonAncestor = null;
    for (let i=0; i<table.length; i++) {
        if (tableCommonAncestor == null) {
            tableCommonAncestor = table[i].rowclusterRoot;
        } else {
            tableCommonAncestor = getClosestCommonAncestor(root, tableCommonAncestor, 
                                                table[i].rowclusterRoot);
            if ((tableCommonAncestor==null) || (tableCommonAncestor==root)) 
                break;
        }
    }    
    if ((tableCommonAncestor!=null) && (tableCommonAncestor!=root)) {
        return tableCommonAncestor;  
    } else {
        return null;
    }
}

function overlappingBoundingBoxes (node1, node2) {
    // returns true if either the bonding box of one node includes the bounding box of 
    // the other or they intersect.
    //console.log("overlappingBoundingBoxes: ", node1, node2);
    let rect1 = node1.getBoundingClientRect();
    let rect2 = node2.getBoundingClientRect();

    if ((rect1.left >= rect2.right) || (rect2.left >= rect1.right))
        return false;
    if ((rect1.top >= rect2.bottom) || (rect2.top >= rect1.bottom))
        return false;
        
    return true;
}

function copyFeasibleClusterSet(feasibleClusterSet) {
    // this copy return a deep-copy of feasibleClusterSet, except for DOM node objects which are shallow copied
    /* feasibleClusterSet = { minTop : 0, 
                              maxTop : 0,
                              maxBottom : 0,
                              minHeight : 0,
                              innerTextNodes : [{}], 
                              ancestorNodes : [{ node: null, cluster: -1 } ],
                              clusters : [],
                              maxNodesCountInACluster : 0 
                            };
    */
    let copy = { ...feasibleClusterSet};
    copy.innerTextNodes = [...feasibleClusterSet.innerTextNodes];
    copy.ancestorNodes = [];
    for(let i=0; i<feasibleClusterSet.ancestorNodes.length; i++) {
        copy.ancestorNodes[i] = { ...feasibleClusterSet.ancestorNodes[i] };
    }
    copy.clusters = [...feasibleClusterSet.clusters];
    return copy;
}

function printArray(a) {
    a.forEach(function(elem){
        console.log(elem);
    })
}
