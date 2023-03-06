
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
    console.log("Table Rowclusters detected: ", rowClustersList);
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
    return detectedTables;
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
        //undoHighlightRowClusters(rowclusterRootTags);   // for debugging purposes
        /*if (feasibleClusterSet)
            feasibleClusterSet.innerTextNodes.forEach(function(item) { // for debugging purposes - undo highlight
                item.style.border = "";
            });*/        
        textElements[0].style.border = "2px solid magenta"; // for debugging

        let savedLength = textElements.length;
        // take the first node and initialize the cluster
        feasibleClusterSet = { minTop : computeScrollIndependentBoundingBox(textElements[0]).top, 
                               maxTop : computeScrollIndependentBoundingBox(textElements[0]).top,
                               maxBottom : computeScrollIndependentBoundingBox(textElements[0]).bottom,
                               minHeight : computeScrollIndependentBoundingBox(textElements[0]).height,
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
            bottomLimitForNextRowCluster = computeScrollIndependentBoundingBox(textElements[0]).top * 1.10; // + 10 percents
        } else {
            bottomLimitForNextRowCluster = computeScrollIndependentBoundingBox(root).bottom;
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
        rect = computeScrollIndependentBoundingBox(textNode);
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
    rect = computeScrollIndependentBoundingBox(textNode);
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
            let ancestorTop = computeScrollIndependentBoundingBox(ancestor.node).top;
            if ((ancestor.cluster != -2 /* ancestor is usable */) && (ancestorTop > maxTop)) {
                    maxTop = ancestorTop;
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
            if (computeScrollIndependentBoundingBox(feasibleClusterSet.innerTextNodes[i]).left >
                computeScrollIndependentBoundingBox(feasibleClusterSet.innerTextNodes[j]).left) {
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
                if (computeScrollIndependentBoundingBox(nodeSet[i]).top < feasibleClusterSet.minTop) {
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
        let rect = computeScrollIndependentBoundingBox(feasibleClusterSet.ancestorNodes[maxTopidx].node);
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
            if (computeScrollIndependentBoundingBox(feasibleClusterSet.innerTextNodes[i]).left >
                computeScrollIndependentBoundingBox(feasibleClusterSet.innerTextNodes[j]).left) {
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
    let rect1 = computeScrollIndependentBoundingBox(node1);
    let rect2 = computeScrollIndependentBoundingBox(node2);
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
                rect1 = computeScrollIndependentBoundingBox(tablerow2.innerTextNodes[i]);
                noOfColumns++;
                for(let j=0; j<tablerow1.ancestorNodes.length; j++) {
                    if (tablerow1.ancestorNodes[j].cluster == tablerow1.clusters[tablerow1.rowclusterIndex]) {
                        rect2 = computeScrollIndependentBoundingBox(tablerow1.innerTextNodes[j]);
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
        let rect1 = computeScrollIndependentBoundingBox(rowclusterRootTag1);
        let rect2 = computeScrollIndependentBoundingBox(rowclusterRootTag2);
        let minHeight = rect1.height<rect2.height ? rect1.height : rect2.height;
        const VERTICAL_TABLE_THRESHOLD = minHeight * 2;

        if ((rect1.left < rect2.left - HORIZONTAL_TABLE_THRESHOLD) || 
            (rect2.left < rect1.left - HORIZONTAL_TABLE_THRESHOLD)) {
                console.log("checkConsecutiveRowsInTable() - false (case 1): ", 
                    rowclusterRootTag1, rowclusterRootTag2);
                return false;
        }
        if ((rect1.right < rect2.right - HORIZONTAL_TABLE_THRESHOLD) || 
            (rect2.right < rect1.right - HORIZONTAL_TABLE_THRESHOLD)) {
                console.log("checkConsecutiveRowsInTable() - false (case 2): ", 
                    rowclusterRootTag1, rowclusterRootTag2);
                return false;
        }
        if ((rect1.width > rect2.width + HORIZONTAL_TABLE_THRESHOLD) || 
            (rect2.width > rect1.width + HORIZONTAL_TABLE_THRESHOLD)) {
                console.log("checkConsecutiveRowsInTable() - false (case 3): ", 
                    rowclusterRootTag1, rowclusterRootTag2);
                return false;
        }
        if (rect2.top - rect1.bottom > VERTICAL_TABLE_THRESHOLD) {
                console.log("checkConsecutiveRowsInTable() - false (case 4): ", 
                    rowclusterRootTag1, rowclusterRootTag2);
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
                // one final filter: if the Top position of tableRootTag is far away from the
                // Top position of the first row in the table (i.e. foundTable[0].rowclusterRoot),
                // then we drop it and we don't consider it a table
                let rectTable = computeScrollIndependentBoundingBox(tableRootTag);
                let rectFirstRow = computeScrollIndependentBoundingBox(foundTable[0].rowclusterRoot);
                let verticalSeparation = rectFirstRow.top - rectTable.top;
                if (verticalSeparation<0) verticalSeparation = - verticalSeparation;
                
                if (verticalSeparation < 2*rectFirstRow.height) { // This is a table! 
                    detectedTables.push({rows : foundTable, tableRootTag : tableRootTag});
                }
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

function undoHighlightRowClusters(rowclusterRootTags) {
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
    let rect1 = computeScrollIndependentBoundingBox(node1);
    let rect2 = computeScrollIndependentBoundingBox(node2);

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


function detectConceptInTables(tables) {
    let tableConcepts = Array(tables.length).fill("");
    for (let i=0; i<tables.length; i++) {
        let firstTableRow = tables[i].rows[0];
        let firstHeaderField = "";
        for (let j=0; j<firstTableRow.innerTextNodes.length; j++) {
            if ((firstTableRow.ancestorNodes[j].cluster == firstTableRow.clusters[firstTableRow.rowclusterIndex]) 
                && (firstTableRow.innerTextNodes[j].innerText != "")) {
                firstHeaderField = firstTableRow.innerTextNodes[j].innerText;
                break;
            }
        }
        if (firstHeaderField == "") continue;
        
        for (concept in DataModel) {
            if (concept=="ForeignKeys") continue;
            if (firstHeaderField.toLowerCase().includes(DataModel[concept][0].toLowerCase())) {
                tableConcepts[i] = concept;
            }

        }
    }
    console.log("detectConceptInTables(): tableConcepts=", tableConcepts);
    return tableConcepts;
}


function printArray(a) {
    a.forEach(function(elem){
        console.log(elem);
    })
}

