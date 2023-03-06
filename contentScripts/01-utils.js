
function computeScrollIndependentBoundingBox(node) {
	let boundingBox = {};
	let rect = node.getBoundingClientRect(); 
	boundingBox.top = rect.top + window.scrollY;
	boundingBox.left = rect.left + window.scrollX;
	boundingBox.bottom = rect.bottom + window.scrollY;
	boundingBox.right = rect.right + window.scrollX;
	boundingBox.height = rect.height;
	boundingBox.width = rect.width;

	return boundingBox;
}

function isElementVisible(item) {
    // This function returns true if item is visible in the browser window.
    // It checks style properties: display, visibility, opacity, overflow and
    // top, left to see that the element is rendered in the view part of the 
    // browser window. It should also probably check its z-index in case of
    // other element overlapping it.

    if (item==null) return false;
    let style = window.getComputedStyle(item);
    let boundingBox = computeScrollIndependentBoundingBox(item);
    if ((style.visibility=="hidden") || (style.display=="none") || (style.opacity=="0") ||
        (style.top<0) || (style.bottom<0) || (style.left<0) || (style.right<0) ||
        (boundingBox.top<0) || (boundingBox.bottom<0) || (boundingBox.left<0) || (boundingBox.right<0)) {
            return false;
    }
    return true;
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

function getPathInDOM(root, node) {
    let path = [];
    path.push(node);
    if (node == root) return path;
    let parent = node;
    while (parent = parent.parentNode) {
        path.push(parent);
        if (parent.isEqualNode(root)) {
            path.push(root);
            break;
        }
    }
    return path;
}

function SerializeDOMPath(root, path) {
    let str = "";
    for(let i=0; i<path.length; i++) {
        if (path[i].isEqualNode(root)) break;
        //console.log("SerializeDOMPath current node:", path[i]);
        str += path[i].tagName;
        if (path[i].getAttribute("id") && path[i].getAttribute("id") != "") 
            str += "#" + path[i].getAttribute("id");
        else if (path[i].getAttribute("class") && path[i].getAttribute("class") != "") 
            str += "." + path[i].getAttribute("class");
        str += "| ";
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

