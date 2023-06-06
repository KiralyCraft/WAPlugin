/*
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

*/

console.log("Plugin injected");
console.log("Start of page.js.");
console.log("DataModel: ", DataModel);


var ContentScriptPluginState = {
    state : "Debug" /* "Debug", "Guided browsing", "Automatic browsing", "Automatic execution" */
};

var checkCustomTaskmateAttribute = true;

var diffDOM = [];
// The structure of diffDOM (i.e. the difference DOM) is :
// [ {"root" : root.body, "ancestor" : ancestor, "diffPanels": diffpanels }, {"root" : root.body, "ancestor" : ancestor, "diffPanels": diffpanels}, ... ]    
// The structure is just an array of domparts, one for each document root (i.e. main document root 
// and iframes). For each root of the current html document (i.e. a "root" is just the document.body or 
// window.frames[i].document.body for all frames included in the current html document), the 
// "diffPanels" property is a list of common ancestor tag (i.e. common within its corresponding root) 
// containing all updated tags within that specific root (i.e. tags without the taskmateID attribute); 
// "ancestor" is the common ancestor of all "diffPanels" from that diff object. 

var textElementsWithInputs = [];
// The structure of textElementsWithInputs is :
// [{"textNode" : textNode, "inputNode" : associatedInputNode, "inputNodeTag" : associatedInputNode.tagName,
//   "relativePosition" : "..." } ... ]
// The "relativePosition" attribute is the position of the inputNode relative to the textNode and it can be:
// null | right&!below | !right&below | right&below
var highlightedInputElements = [];
// The structure of highlightedInputElements is :
// [{"inputNode" : inputNode, "styleInputNode" : inputNode.style, "ancestor" : ancestor, "styleAncestor" : ancestor.style} ...]


var DOMState = { state: null, currentDOM: {operation: null, concept: null} };

window.addEventListener('DOMContentLoaded', function(event) {
    console.log("New document loaded in browser tab. Plugin is injected.");
});
document.addEventListener('load', function(event) {
    console.log("New document loaded in browser tab. Plugin is injected.");
});


/*if (window.frames[0]) {
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
}*/


// highlight all visible clickable elements
// TODO: Commented out for debugging; they need to be uncommented 
/*let clickableElements = getAllClickableElements();
console.log('clickableElements: ', clickableElements);*/


// TODO: Commented out for debugging; they need to be uncommented 
//monitorClickEventsOnAllDocuments();

function monitorClickEventsOnAllDocuments() {
    console.log ("There are ", window.frames.length, " frames in the current window.");

    document.addEventListener('click', function(event) {
        monitorClickEvent(document, 'DocumentRoot', event);
    }, true); // the last parameter, true, is very important because it allown the event to be
              // handled first by our function and only then it is handled by some inner handlers 
              // through event bubbleing

    let i = 0;
    while (i<window.frames.length) {
        if (window.frames[i] != null) {
            window.frames[i].document.addEventListener('click', 
                monitorClickEvent.bind(null, window.frames[i].frameElement, 
                                  window.frames[i].frameElement.getAttribute("id")),
                true);
        }
        i++;
    }
}

function monitorClickEvent(documentRoot, documentRootID, event) {
    if (event.type == "click") {
        console.log("ClickEvent detected, target=", event.target, "(" + event.target.innerText + ")", 
                    " elementID=", documentRootID, " documentRoot=", documentRoot, " event.path=", 
                    event.path);
        if ((documentRoot.tagName=="FRAME") || (documentRoot.tagName=="IFRAME")) {
            if (documentRoot.contentDocument != null) {
                documentRoot = documentRoot.contentDocument;
            } else if (documentRoot.contentWindow.document != null) {
                documentRoot = documentRoot.contentWindow.document;
            }
        }
        chrome.runtime.sendMessage({request: "message_page_popup_UIOperationStarted"});

        chrome.runtime.sendMessage({request: "message_page_background_clickEvent", 
                operation : "Click", target: SerializeDOMPath(documentRoot.body, getPathInDOM(documentRoot.body, event.target)),
                targetText : event.target.innerText});
        if ((DOMState.currentDOM.operation=="UPDATE") && (event.target.innerText.toUpperCase()=="DELETE")) {
            console.log("sending message_page_background_operationDetected to Background");
            chrome.runtime.sendMessage({request: "message_page_background_operationDetected", 
                    operation : "DELETE", 
                    concept : DOMState.currentDOM.concept});
        }
    }
}



chrome.runtime.onMessage.addListener(function(receivedMessage, sender, sendResponse) {
    /* We use the following format for messages background <-> page :
     * sendMessage({ request : "message_[fisier sursa]_[fisier destinatie]_[actiune/metoda]", parameters: ... } )
     * sendMessage({ response : "message_[fisier sursa]_[fisier destinatie]_[actiune/metoda]", parameters: ... } )
     */

    /* 4est: after I reload the plugin, I must refresh the tab http://172.30.3.49:5555/CRMEndava/
     * because otherwise the page.js is not loaded in the context of this tab
     */
    console.log("Message received by content script:", receivedMessage);

    if (receivedMessage.request == "message_popup_page_StateChanged") {
        console.log("Content script's state is now: ", receivedMessage.state);
        ContentScriptPluginState.state = receivedMessage.state;

        // Start the automatic execution of the process
        if (receivedMessage.state == "Automatic execution") {
            console.log("Automatic execution started...");
            ExecutePrimaryBlock(InsertAccount_PrimaryBlock);
        }

    } else if (receivedMessage.request == "message_background_page_mapUIOperation") {
        (async () => {
            console.log("Msg. message_background_page_mapUIOperation received from background.");
            // wait for the UI operation to complete  
            await pause(10000);

            mapUIOperation();
        })();

    } else if (receivedMessage.request == "message_background_page_updatePhantomDOM") {
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

        // TODO: remove this - este doar de test si decomentam linia 
        // detectedConceptOperation = processDOMDifference() de mai jos !!!!
        mapUIOperation();
        let detectedConceptOperation = null;

        //let detectedConceptOperation = processDOMDifference();
        var node = null;
/*        chrome.storage.local.get(["ClickedElementID"], function(item) {
            console.log("Data saved in chrome.storage.local:",item);
            node = item;
            console.log("node:", node);
            // TODO: a se muta in afara acestui block cu async
            //sendResponse({response: "message_page_popup_primaryNavigationBlockDetected",
            //        preLeafNode: node, concept : detectedConceptOperation.concept, 
            //        operation: detectedConceptOperation.operation});
        });*/
        console.log("****node:", node);
        console.log("detectedConceptOperation: ", detectedConceptOperation);
        console.log("Sending response message to popup: message_page_popup_primaryNavigationBlockDetected:",
            {response: "message_page_popup_primaryNavigationBlockDetected",
            preLeafNode: node, concept : detectedConceptOperation?.concept, 
            operation: detectedConceptOperation?.operation});
        sendResponse({response: "message_page_popup_primaryNavigationBlockDetected",
            preLeafNode: node, concept : detectedConceptOperation?.concept, 
            operation: detectedConceptOperation?.operation});
    } else if (receivedMessage.request == "message_popup_page_detectTables") {
        if (receivedMessage.parameters.algorithm == "standard")
        {
            detectTables();
        }
    } else if (receivedMessage.request == "message_popup_page_undoHighlightInputs") {
        undoHighlightInputElements();
    } else if (receivedMessage.request == "message_popup_page_undoHighlightTextInputElemAssociations") {
        undoHighlightTextInputElemAssociations(); 
    } else if (receivedMessage.request == "message_popup_page_debug") {
        debug();
    } else if (receivedMessage.action == "action_popup_visible") {
        //Do not handle
    } else if (receivedMessage.action == "action_popup_visible_inputdetect") {
        //Do not handle
    } else if (receivedMessage.action == "action_popup_injectors_probe_reply") {
        //Avoid replying to this, because the hotProbeResponder will.
    }


});


async function mapUIOperation() {
    // associate new tags with the attribute "taskmateID" and compute the diffDOM
    diffDOM = computeDifferenceDOM();
    // BUG !!! Doublecheck everything because for Jira, some tags remain without taskmateID attribute
    console.log("mapUIOperation(): tags that still don't have the Taskmate custom attribute: ");
    document.querySelectorAll("body :not([taskmateID], .taskmate-canvas)").forEach(function(elem) {
        //element.setAttribute("taskmateID", -1);
        console.log(elem);
    })
    console.log("mapUIOperation(): mapping UI operation, diffDOM = ", diffDOM);

    let detectedConceptualOperations = processDOMDifference();
    // For now, we only detect one conceptual operation
    let conceptualOperation = null;
    for (let i=0; i<detectedConceptualOperations.length; i++) {
        if ((detectedConceptualOperations[i].concept!=null) || (detectedConceptualOperations[i].operation!=null)) {
            conceptualOperation = detectedConceptualOperations[i];
            break;
        }
    }
    if (conceptualOperation != null) {
        // sending message to popup.js
        chrome.runtime.sendMessage({request: "message_page_popup_operationDetected", 
                operation : conceptualOperation.operation, 
                concept : conceptualOperation.concept});
        // sending message to background.js
        console.log("sending message_page_background_operationDetected to Background");
        chrome.runtime.sendMessage({request: "message_page_background_operationDetected", 
                operation : conceptualOperation.operation, 
                concept : conceptualOperation.concept});
        DOMState.currentDOM.operation = conceptualOperation.operation;
        DOMState.currentDOM.concept = conceptualOperation.concept;
        await pause(5000);
//        undoHighlightTextInputElemAssociations();
//        undoHighlightInputElements();
    } else {
        let tables = detectTables();
        // TODO: aici trebuie sa ma uit daca prima proprietate a doua concepte diferite este aceeasi
        // (e.g. "No.") si o gasesc in prima celula din headerul tabelului, trebuie sa continui sa
        // caut proprietatea a 2-a si apoi a 3-a si tot asa pana ramane un singur concept detectat
        // in tabel; De asemenea, trebuie sa declar proprietatile pentru tabelul respectiv in DataModel
        // in ordinea in care apar ele in capul de tabel din paginile web ale aplicatiei
        let tableConcepts = detectConceptInTables(tables);
        if ((tables != null) && (tables.length>0)) {
            // sending message to popup.js
            chrome.runtime.sendMessage({request: "message_page_popup_operationDetected", 
                    operation : "SELECTALL", 
                    concept : tableConcepts});
            // sending message to background.js
            console.log("sending message_page_background_operationDetected to Background");
            chrome.runtime.sendMessage({request: "message_page_background_operationDetected", 
                    operation : "SELECTALL", 
                    concept : tableConcepts});
            DOMState.currentDOM.operation = "SELECTALL";
            DOMState.currentDOM.concept = tableConcepts;
            await pause(5000);
            undoHighlightTables(tables);
            // undo table row highlight
            for(let i=0; i<tables.length; i++) {
                let rowclusterRoots = [];
                for(let j=0; j<tables[i].rows.length; j++) {
                    rowclusterRoots.push(tables[i].rows[j].rowclusterRoot);                
                }
                undoHighlightRowClusters(rowclusterRoots);
            }
        } else {
            // sending message to popup.js
            chrome.runtime.sendMessage({request: "message_page_popup_operationDetected", 
                    operation : "Generic DOM", 
                    concept : ""});
            // sending message to background.js
            console.log("sending message_page_background_operationDetected to Background");
            chrome.runtime.sendMessage({request: "message_page_background_operationDetected", 
                    operation : "Generic DOM", 
                    concept : ""});
            DOMState.currentDOM.operation = "Generic DOM";
            DOMState.currentDOM.concept = "";
        }
    }
    // announce popup.js that the UI operation was completed
    chrome.runtime.sendMessage({request: "message_page_popup_UIOperationCompleted"});

    // add custom taskmate attribute to new tags
    getFramesRoots().forEach(function(root) {
            addTaskmateAttribute(root);
    });

    // highlight all visible clickable elements
    //TODO: Uncomment this, it is commented out only for debug
    /*let clickableElements = getAllClickableElements();
    console.log('clickableElements: ', clickableElements);*/

}

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
      
      // give each tag element TaskMate custom attributes; we don't care here about diffDOM
      computeDiffDOMwithinRoot(document.body);
}

function processDOMDifference() {
    // TODO: cred ca trebuie sa sterg codul de mai jos, nu mai e folosit
    /*let fullDOM = "";
    let innerText = "";
    if (window.frames.length > 0) {
        fullDOM = window.frames[0].document.body.innerHTML;
        innerText = window.frames[0].document.body.innerText;
    } else {
        fullDOM = document.body.innerHTML;
        innerText = document.body.innerText;
    }*/
    // TODO: Asa faceam pt. Dynamics CRM 2016; am modificat pt Jira, sa verific ca mai merge pt. Dynamics 2016
    // Pentru Dynamics 2016:
    //let root = getDocumentRoot();
    //let textElements = getTextElements(root.body, true /*only visible elements*/);
    // Pentru Jira:
    /*let i = 0;
    let diffAncestor = root.body;
    while (i<diffDOM.length) {
        if (diffDOM[i].ancestor != null) {
            diffAncestor = diffDOM[i].ancestor;
            break;
        }
        i++;
    }
    root = diffAncestor;*/
    console.log("processDOMDifference(): diffDOM = ", diffDOM);
    
    let detectedConceptualOperations = [];
    textElementsWithInputs = [];
    diffDOM.forEach(function(dompart) {
        let root = dompart.ancestor;
        if (root==null) return;

        let allTextElements = getTextElements(root, true /*only visible elements*/);

        console.log("textElements are:");
        allTextElements.forEach(function(node) {
            console.log(node.innerText, node);
        })
        highlightElements(allTextElements, "green");

        highlightInputElements(root);

        // first detect the concept from the set of text labels
        let {detectedConcept, textLabels} = detectConcept(allTextElements);
        highlightElements(textLabels, "red");

        // associate input nodes to text labels
        let labelsAndInputs = getAssociatedInputElements(root, textLabels);
        textElementsWithInputs = textElementsWithInputs.concat(labelsAndInputs);

        // detect the conceptual operation
        let detectedOperation = detectOperation(labelsAndInputs, detectedConcept);
        let conceptualOperation = {"concept": detectedConcept, "operation": detectedOperation};
        console.log("Concept detected: ", conceptualOperation);

        //we do the highlight at the end
        //highlightTextInputElemAssociations(root /*window.frames[0].document*/);

        // detectam atribute Foreign Keys
        let FKFields = detectForeignKeyFields(conceptualOperation.concept, allTextElements, root);
        // The structure of FKFields is:
        //  [ {ForeignKey: entry.ForeignKey, TextElem : txtElem, AssocInputNode: null}, ... ] 

        // Deocamdata codul de executor e comentat
        /*if (FKFields.length > 0) {
            // trigger a seach on a list - just as an example of a simple executor
            TriggerUISearchListShow(root, FKFields[0].AssocInputNode);
        }*/

        if ((conceptualOperation.concept != null) && (conceptualOperation.operation != null)) {
            detectedConceptualOperations.push(conceptualOperation);            
        }

    });

    highlightTextInputElemAssociations(document.body);

    return detectedConceptualOperations;
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
    let selector = "";
    if (checkCustomTaskmateAttribute == true) {
        selector = ":not([taskmateID],.taskmate-canvas)";
    } else {
        selector = "*";
    }
    root.querySelectorAll(selector).forEach(function(item) {
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


function highlightElements(nodes, color) {
    nodes.forEach(function(node) {
        if (node) {
            node.style.border = "1px solid " + color;
        }
    })
}

function highlightInputElements(root) {
    highlightedInputElements = [];

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

        highlightedInputElements.push(elem);
    });
}

function undoHighlightInputElements() {
    highlightedInputElements.forEach(function(elem) {
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
            let inputNodePosition = computeScrollIndependentBoundingBox(item['inputNode']);
            let textNodePosition = computeScrollIndependentBoundingBox(item['textNode']);
            console.log("inputNodePosition: ", inputNodePosition, " textNodePosition: ", textNodePosition);
            let canvas = document.createElement("canvas");
            canvas.setAttribute("class", "taskmate-canvas");
            canvas.setAttribute("id", item['textNode'].innerText+"|"+item['inputNode'].outerHTML);
            canvas.style.position = "absolute";
            canvas.style.zIndex = "9999";
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
            /* Here we add the canvas tag to DOM. The canvas object contains a green line that
             * links the item['textNode'] tag with the item['inputNode'] tag. It's very important
             * where we add the canvas object in the DOM structure, because the canvas should be
             * positioned absolutely. The most obvious choice is the document.body, but the problem
             * with this is that if item['textNode'] and item['inputNode'] are on a dialog window
             * and this dialog window has a vertical scroll, if we scroll the dialog window, the
             * canvas will remain fixed (because it is positioned relatively to document.body).
             * So we find instead the closest common ancestor of item['textNode'] and item['inputNode'],
             * and then we traverse the hierarchical DOM structure until we find the first ancestor
             * with a vertical scroll and we add our canvas object as a child of this ancestor. We
             * also set "position: relative" for this ancestor if its original position is 'static'
             * (so that the absolute positioning of our canvas object is relative to this ancestor).
             */
            let ancestor = getClosestCommonAncestor(root, item['textNode'], item['inputNode']);
            ancestor = getClosestAncestorWithVerticalScroll(root, ancestor);
            if (ancestor != null) {
                //ancestor.style.border = "2px solid purple";
                let style = getComputedStyle(ancestor);
                if ((style.position!=="absolute") && (style.position!=="relative") && (style.position!=="fixed")) {
                    ancestor.style.position = "relative";
                    console.log("highlightTextInputElemAssociations(): textNode=", item['textNode'],
                        " ClosestCommonAncestor=", ancestor, " (root=", root, ")");
                }
                // TODO: Setarile de top si left de mai jos sunt stupide (daca nu pun +'px' in aceeasi linie nu e nici un efect)
                let ancestorRect = computeScrollIndependentBoundingBox(ancestor);
                canvas.style.top = parseFloat(canvas.style.top) - ancestorRect.top + 'px';
                canvas.style.left = parseFloat(canvas.style.left) - ancestorRect.left + 'px';
                ancestor.appendChild(canvas);
                console.log("ClosestAncestorWithVerticalScroll", ancestor);
            } else 
                root.appendChild(canvas);
                 
            //console.log("canvas bounding box: ", canvas.getBoundingClientRect());

        }
    });
}

function undoHighlightTextInputElemAssociations() {
    getFramesRoots().forEach(function(root) {
        root.querySelectorAll(".taskmate-canvas").forEach(function(node) {node.remove()})
    })
}


function undoHighlightTables(tables) {
    // undo highlight tables
    if (tables != null) {
        tables.forEach(function(table) {
            if (table.tableRootTag!=null) {
                table.tableRootTag.style.border = "";
            }
        })
    }
}


// Force Page.js to detect an UI operation on a newly loaded document/URL/tab
// This should be the last code in page.js
//mapUIOperation();



