var CONCEPT_LABEL_DETECTION_THRESHOLD = 0.75; 


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
            /*if (node.getAttribute("id")=="Dialog_parentcustomerid1_IMenu") {
                console.log("updateVisibleDOM: visibility of #Dialog_parentcustomerid1_IMenu:", visibility);
            }*/
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


function getAssociatedInputElements(root, textElements) {
    // Assumption: we consider that an input node has as associated label the closest 
    // text node situated in the North-Vest quadrant (i.e. an input will always be placed on
    // the right or on the bottom or on the right-bottom of its associated label).
    let textAndInputNodes = [];
    let selector = "";
    if (checkCustomTaskmateAttribute == true) {
        selector = "input[type='text']:not([taskmateID]),select:not([taskmateID]),textarea:not([taskmateID])";
    } else {
        selector = "input[type='text'],select,textarea";
    }
    textElements.forEach(function(textNode) {
        let textNodePosition = computeScrollIndependentBoundingBox(textNode);
        let assocInputNode = null;
        let minimumDistance = 1000; // a large enough value
        let relativePosition = null;
        let allInputs = root.querySelectorAll(selector); // TODO: se va comenta, nu mai e nevoie !!!!
        root.querySelectorAll(selector).forEach(function(inputNode) {
            let inputNodePosition = computeScrollIndependentBoundingBox(inputNode);        
            let distance = 1000; // a large enough value
            let pos = null;
            if (((textNodePosition.right <= inputNodePosition.left) &&
                 (textNodePosition.top <= inputNodePosition.top) && 
                 (textNodePosition.bottom > inputNodePosition.top)) ||
                /* The next condition is for the case when inputNode is on the right of the 
                 * textNode, but the textNode is vertically positioned between the top
                 * and bottom of the inputNode - e.g. Jira */
                ((textNodePosition.right <= inputNodePosition.left) &&
                 (textNodePosition.top <= inputNodePosition.top + (0.25*textNodePosition.height)) && 
                 (textNodePosition.bottom > inputNodePosition.top))) {
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
                    assocInputNode = inputNode;
                    minimumDistance = distance;
                    relativePosition = pos;
            } 

        });

        if (assocInputNode != null) {
            console.log("getAssociatedInputElements(): textNode=", textNode, " assocInputNode=",
                        assocInputNode, " position=", relativePosition);
            textAndInputNodes.push({"textNode" : textNode, "inputNode" : assocInputNode, 
                    "inputNodeTag" : assocInputNode.tagName, "relativePosition" : relativePosition});
        } else {
            textAndInputNodes.push({"textNode" : textNode, "inputNode" : null,
                    "inputNodeTag" : null, "relativePosition" : null});
        } 
    });

    return textAndInputNodes;
}


function detectConcept(textElements) {
    /* this function detects a concept among a set of text labels */
    let detectedConcept = null;
    let textLabels = [];
    
    for (concept in DataModel) {
        if ((concept=="ForeignKeys") || (concept=="PrimaryKeys")) continue; 

        console.log(concept, DataModel[concept]);
        let attributeOccurences = 0;
        for (property of DataModel[concept]) {
            let i = 0;
            while (i<textElements.length) {
                if (trimNonAlphanumeric(textElements[i].innerText.toLowerCase()) == property.toLowerCase()) {
                    textLabels.push(textElements[i]);                    
                    attributeOccurences++;
                    break;
                }
                i++;
            }
            console.log("detectConcept(): ", property, attributeOccurences);
        };
        console.log("detectConcept(): attributeOccurences=", attributeOccurences, " noOfProperties=", DataModel[concept].length);
        // The text labels should match at least 75% of the attributes of a concept from the DataModel 
        // in order to conclude that a concept was found.
        if (attributeOccurences >= DataModel[concept].length * CONCEPT_LABEL_DETECTION_THRESHOLD) {
            detectedConcept = concept;          
            break;
        } else {
            textLabels = [];
        }
    }

    return {detectedConcept, textLabels};
};

function detectOperation(textElementsWithInputs, detectedConcept) {
    /* this function detects an operation from a set of textNode<->inputNode association; the concept is already detected.
     * this function is almost identical with detectConceptAndOperation(), except for the fact that,
     * here, the concept is already known.
     */
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
    let operation = null;
    if ((detectedConcept==null) || (detectedConcept=="")) return null;
    
    let attributeOccurences = 0;
    let inputNodesCount = 0;
    let nonemptyInputNodesCount = 0;
    for (property of DataModel[detectedConcept]) {
        let i = 0;
        while (i<textElementsWithInputs.length) {
            if (textElementsWithInputs[i].textNode && 
                (trimNonAlphanumeric(textElementsWithInputs[i].textNode.innerText.toLowerCase()) == property.toLowerCase())) {
                
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
        console.log("detectOperation(): ", property, attributeOccurences);
    };
    console.log("detectOperation(): attributeOccurences=", attributeOccurences, " noOfProperties=", 
                DataModel[detectedConcept].length);
    
    // The text labels should match at least 0.75% of the attributes of a concept from the DataModel 
    // in order to conclude that a concept was found.
    if (attributeOccurences >= DataModel[detectedConcept].length * CONCEPT_LABEL_DETECTION_THRESHOLD) {
        if (inputNodesCount==0) {
            operation = "SELECT";
        } else if (nonemptyInputNodesCount > 1) { // it can also be ">0"
            operation = "UPDATE";
        } else {
            operation = "INSERT";
        }          
    }

    return operation;
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
        if ((concept=="ForeignKeys") || (concept=="PrimaryKeys")) continue; 

        console.log(concept, DataModel[concept]);
        let attributeOccurences = 0;
        let inputNodesCount = 0;
        let nonemptyInputNodesCount = 0;
        for (property of DataModel[concept]) {
            let i = 0;
            while (i<textElementsWithInputs.length) {
                if (textElementsWithInputs[i].textNode && 
                    (trimNonAlphanumeric(textElementsWithInputs[i].textNode.innerText.toLowerCase()) == property.toLowerCase())) {
                    
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
        if (entry.ForeignConcept==concept) {
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
    //console.log("Label positions: ", 
    //            computeScrollIndependentBoundingBox(FKarray[0].TextElem).top,
    //            " ", computeScrollIndependentBoundingBox(FKarray[0].TextElem).left);

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

        let selector = "";
        if (checkCustomTaskmateAttribute == true) {
            selector = ":not([taskmateID],.taskmate-canvas)";
        } else {
            selector = ":not(.taskmate-canvas)";
        }
        root.querySelectorAll(selector).forEach(function(node) {
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

            let nodePosition = computeScrollIndependentBoundingBox(node);
            let relativePosition = null;
            let textNodePosition = computeScrollIndependentBoundingBox(FKarray[i].TextElem);
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



async function TriggerUISearchListShow(root, inputNode) {
    let visibleNodes = [];
    let invisibleNodes = [];
    let newVisibleNodes = [];
    let newInvisibleNodes = [];
    updateVisibleDOM(root.body, visibleNodes, invisibleNodes, newVisibleNodes, newInvisibleNodes);    
    /*  The code below handles 2 click events in a synchronous sequence. It is written using the
     *  old Promise.then() syntax. We rewrote the code using async/await constructs. */ 
    /*clickTrigger(FKFields[0].AssocInputNode, 1000)
    .then(function() {
        console.log('1st Click triggered on '+FKFields[0].AssocInputNode);
    })
    // wait for the click event to be handled
    .then(pause)        // if pause() had an argument, this should be coded like:
                        //          .then(x => pause(x))
                        // or like this:
                        //          .then(function() {return pause(x);})
    .then(function() {  
        newVisibleNodes = [];
        newInvisibleNodes = [];
        updateVisibleDOM(root.body, visibleNodes, invisibleNodes, newVisibleNodes, newInvisibleNodes); 
        console.log(visibleNodes.length, invisibleNodes.length, newVisibleNodes.length, newInvisibleNodes.length);
    
        return clickTrigger(root.querySelector("#parentcustomerid1_i"), 1000);
    })    
    .then(function() {
        console.log('2nd Click triggered on ' + root.querySelector("#parentcustomerid1_i"));
        // wait for the click event to be handled
        return pause();
    })
    .then(function() {  
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
                newVisibleNodes[i].style.border = "1px solid blue";
                commonAncestor = getClosestCommonAncestor(root.body, commonAncestor, newVisibleNodes[i]);
            }
        }
        console.log("processDOMDifference(): commonAncestor is:", commonAncestor);
        if (commonAncestor!=null) {
            commonAncestor.style.border = "2px solid red";
        }
    });*/     // END of commented code - this code is kept for reference purposes only; the code is correct and works
    
    /* The same code as above (handling 2 click events in synchronous sequence), but written using async/await syntax.
     * This code is part of the executor, not part of map discovery.
     */
    console.log('1st Click triggered on ' + inputNode);
    await clickTrigger(inputNode, 1000)
    // wait for the click event to be handled
    await pause();
    newVisibleNodes = [];
    newInvisibleNodes = [];
    updateVisibleDOM(root.body, visibleNodes, invisibleNodes, newVisibleNodes, newInvisibleNodes); 
    console.log(visibleNodes.length, invisibleNodes.length, newVisibleNodes.length, newInvisibleNodes.length);

    console.log('2nd Click triggered on ' + root.querySelector("#parentcustomerid1_i"));
    await clickTrigger(root.querySelector("#parentcustomerid1_i"), 1000);
    // wait for the click event to be handled
    await pause();

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
            newVisibleNodes[i].style.border = "1px solid blue";
            commonAncestor = getClosestCommonAncestor(root.body, commonAncestor, newVisibleNodes[i]);
        }
    }
    console.log("processDOMDifference(): commonAncestor is:", commonAncestor);
    if (commonAncestor!=null) {
        commonAncestor.style.border = "2px solid red";
    }
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
