/*
 * This file should be loaded after the core detection algorithms. This ensures that methods defined in the core file (page.js) are also accessible here, while providing a separation of detection concepts.
 */

chrome.runtime.onMessage.addListener(function(receivedMessage, sender, sendResponse) {
	if (receivedMessage.request == "message_popup_page_detectTables") //TODO Trebuie sa definim cumva alta metoda de procesare a mesajului aici, pentru ca nu corespunde cu structura impusa
	{
		 if (receivedMessage.parameters.algorithm == "alternative")
		 {
			 let tableDetection = executeDetectionProcedure();
			 highlightElements(tableDetection);
		 }
	}
});

function highlightElements(_tableDetection)
{
	console.log(_tableDetection);
}

/*
 * The main method of this file. Detection algorithm starts here.
 */
function executeDetectionProcedure()
{
	//let SUPPOSED_ROOT = window.frames[0].document.body;
	let SUPPOSED_ROOT = document.body;

	
	let detectedTextElements = filterDetectedTextElements(getTextElements(SUPPOSED_ROOT));
	let possibleTableHeaders = filterPossibleTableHeaders(detectedTextElements);
	let dataModelMatrix = detectLikelyDataModel(possibleTableHeaders);
	
	//TODO actually choose this more carefully. Right now we just assume the top-most is the one.
	let chosenDataModel = Object.keys(dataModelMatrix)[0];
	let chosenDataModelHeaderElements = dataModelMatrix[chosenDataModel];
	
	///////////////// NO-HEADER DETECTION /////////////////////
	let elementClusterStack = detectClusterParentStack(SUPPOSED_ROOT,detectedTextElements);
	/*
	 * Detect the top-level parent of the previously identified parents. This is used as a sorting base later on.
	 * We do not care if there are multiple, just the one that includes them all.
	 */
	let universalParentStack = SUPPOSED_ROOT;
	//let universalParentStack = detectClusterParent(SUPPOSED_ROOT,elementClusterStack);

	/*
	 * Sort the identified parents based on their distance to the absolute, universal parent. 
	 */
	elementClusterStack.sort(function (valueA,valueB)
	{
		return getDOMAncenstorDistance(universalParentStack,valueA[0]) - getDOMAncenstorDistance(universalParentStack,valueB[0]);
	});	
	
	let tableLiklinessArray = [];
	for (elem of elementClusterStack)
	{
		tableLiklinessArray.push([elem,isLikelyTable(elem)]);
	}
	
	tableLiklinessArray.sort(function (valueA,valueB)
	{
		return valueA[1] - valueB[1];
	});

	let TABLE_THRESHOLD = 0.6;
	if (tableLiklinessArray[tableLiklinessArray.length-1][1] == 1) //We definitely have a table. In this rudimentary implementaiton, this works for now.
	{
		TABLE_THRESHOLD = 1;
	}
	
	return buildAPIRepresentation(tableLiklinessArray,TABLE_THRESHOLD,SUPPOSED_ROOT);
	
//  TODO PENDING_DEPRECATION
// 	for (tableLikliness of tableLiklinessArray)
// 	{
// 		if (tableLikliness[1] >= TABLE_THRESHOLD)
// 		{
// 			console.log(tableLikliness);
// 			tableLikliness[0][0].style.outline = '#f00 solid 4px';
// 			tableLikliness[0][0].style.outlineOffset = "-4px";
// 
// 			let linesAndColumns = extractLinesAndColumns(tableLikliness[0][1]);
// 			for (lineSet of linesAndColumns[0])
// 			{
// 				let identifiedParent = detectClusterParent(SUPPOSED_ROOT,[...lineSet.values()]);
// 
// 				identifiedParent.style.outline = '#00ff00 solid 2px';
// 				identifiedParent.style.outlineOffset = "-6px";
// 			}
// 		}
// 	}
	///////////////////////////////////////////////////////////
	let headerParent = detectClusterParent(SUPPOSED_ROOT,chosenDataModelHeaderElements);
	let verticalClusters = clusterElementsByHeadersVertically(detectedTextElements,detectedTextElements);
	
	let horizontalClusters = clusterElementsHorizontally(verticalClusters);
	let horizontalParents = detectHorizontalParents(SUPPOSED_ROOT,horizontalClusters);
	
	let filteredHorizontalParents = filterHorizontalClusters(headerParent,horizontalParents);
	let horizontalMegacluster = detectClusterParent(SUPPOSED_ROOT,filteredHorizontalParents); 
	let tableMegacluster = detectClusterParent(SUPPOSED_ROOT,[horizontalMegacluster,headerParent]); 
}

/*
 * Given the array of table likelyness, for the elements that fit a certain threshold, it returns an object of the form:
 * [{
 * 		tableRootTag: <element>,rows: [{rowRootTag: <element>,cells: [{cellRootTag: <element>,textValue: "string"}]}]
 * }]
 */
function buildAPIRepresentation(_tableLiklinessArray,_TABLE_THRESHOLD,_SUPPOSED_ROOT)
{
	let toReturn = [];
	
	for (tableLikliness of _tableLiklinessArray)
	{
		if (tableLikliness[1] >= _TABLE_THRESHOLD)
		{
			let pendingTableStructure = {};
			let pendingRowStructure = [];
			
			let tableInformation = tableLikliness[0];
			
			let tableRootTag = tableInformation[0];
			let tableComponentInformation = tableInformation[1];
			
			let linesAndColumns = extractLinesAndColumns(tableComponentInformation);
			for (lineSet of linesAndColumns[0])
			{
				let identifiedRowParent = detectClusterParent(_SUPPOSED_ROOT,[...lineSet.values()]);
				
				let pendingRowElement = {};
				pendingRowElement.rowRootTag = identifiedRowParent;
				
				let pendingCellStructure = [];
				
				for (cellElement of lineSet)
				{
					let pendingCellElement = {};
					
					pendingCellElement.cellRootTag = cellElement;
					pendingCellElement.textValue = cellElement.innerHTML;
					
					pendingCellStructure.push(pendingCellElement);
				}
				
				pendingRowElement.cells = pendingCellStructure;
				
				pendingRowStructure.push(pendingRowElement);
			}
			
			/////// BUILD THE TABLE API REPRESENTATION ///////
			pendingTableStructure.tableRootTag = tableRootTag;
			pendingTableStructure.rows = pendingRowStructure;
			toReturn.push(pendingTableStructure);
			//////////////////////////////////////////////////
		}
	}
	
	return toReturn;
}

/*
 * Given a pair of [parent,[elements]], return a percentage (0.0-1.0) corresponding to the likelyness of this element being a table. 
 * If all elements are in a line, it returns -1.
 */
function isLikelyTable(_genericClusterPair)
{
	let genericCluster = _genericClusterPair[1];
	
	let inclusionCountMatrix = [];
	inclusionCountMatrix[0] = 0;
	inclusionCountMatrix[1] = 0;
	inclusionCountMatrix[2] = 0;
	
	let tableArray = extractLinesAndColumns(genericCluster);
	
	if (tableArray == undefined)
	{
		return 0.0;
	}
	else
	{
		let lineSetArray = tableArray[0];
		let columnSetArray = tableArray[1];
		
		for (genericElement of genericCluster)
		{
			let elementInclusionCount = 0;
			for (lineSetEntry of lineSetArray)
			{
				if (lineSetEntry.has(genericElement))
				{
					elementInclusionCount++;
				}
			}
			
			for (columnSetEntry of columnSetArray)
			{
				if (columnSetEntry.has(genericElement))
				{
					elementInclusionCount++;
				}
			}
			
			if (elementInclusionCount > 2)
			{
				console.log("isLikelyTable identified an element that is assigned to more than 1 line or 1 column!");
			}
			inclusionCountMatrix[elementInclusionCount]++;
		}
		
		if (inclusionCountMatrix[0] > 0)
		{
			return 0.0;
		}
		else
		{
			if (inclusionCountMatrix[1] == 0 && inclusionCountMatrix[2] > 0) //If all elements are aligned in columns & lines
			{
				return 1.0;
			}
			else if (inclusionCountMatrix[2] == 0 && inclusionCountMatrix[1] > 0) //What happens if they're all in a line? Need some more checks here.
			{
				return -1; //TODO Hardcoded value. 
			}
			else if (inclusionCountMatrix[1] > 0 && inclusionCountMatrix[2] > 0)
			{
				return inclusionCountMatrix[2]/(inclusionCountMatrix[2] + inclusionCountMatrix[1]);
			}
		}
	}
}

/*
 * Given an array of elements, it returns an array of arrays of sets, corresponding to line and column groups, in this order.
 * In the event that two elements overlap (they align both horizontally and vertically) this function returns "undefined".
 */
function extractLinesAndColumns(_genericCluster)
{
	let lineSets = new Map();
	let columnSets = new Map();

	function _checkHorizontalAlignment(boundingEntry,boundingComparedEntry)
	{
		return Math.abs(boundingComparedEntry.left - boundingEntry.left) <= 10;
	}
	function _checkVerticalAlignment(boundingEntry,boundingComparedEntry)
	{
		return Math.abs(boundingComparedEntry.top - boundingEntry.top) <= 10;
	}
	
	function _executeComparisons(__theCheckedMap,__uniqueArrayOutput,__checkingFunction,__genericEntry,__genericComparedEntry)
	{
		/*
		* Check if either of the elements already aligns with any of the ones inside the column map. 
		* If it does, append them both to that set. Otherwise, create a new set.
		*/
		let foundAlingingSet;
		for (toCheckElement of [__genericEntry,__genericComparedEntry])
		{
			if (foundAlingingSet === undefined)
			{
				for (mapSetKey of __theCheckedMap.keys())
				{
					if (__checkingFunction(toCheckElement.getBoundingClientRect(),mapSetKey.getBoundingClientRect()))
					{
						foundAlingingSet = __theCheckedMap.get(mapSetKey);
						break;
					}
				}
			}
			else
			{
				break;
			}
		}
		
		let theAligningSet;
		if (foundAlingingSet !== undefined)
		{
			theAligningSet = foundAlingingSet;
			
			if (!foundAlingingSet.has(__genericEntry))
			{
				foundAlingingSet.add(__genericEntry);
			}
			if (!foundAlingingSet.has(__genericComparedEntry))
			{
				foundAlingingSet.add(__genericComparedEntry);
			}
		}
		else
		{
			let newElementSet = new Set();
			
			theAligningSet = newElementSet;
			newElementSet.add(__genericEntry);
			newElementSet.add(__genericComparedEntry);
			
			__theCheckedMap.set(__genericEntry,newElementSet);
			__theCheckedMap.set(__genericComparedEntry,newElementSet);
			
			__uniqueArrayOutput.push(newElementSet);
		}
		__theCheckedMap.set(__genericEntry,theAligningSet);
		__theCheckedMap.set(__genericComparedEntry,theAligningSet);
	}
	
	let uniqueLineArray = [];
	let uniqueColumnArray = [];
	
	let clusterElementCount = _genericCluster.length;
	
	for (genericEntryIndex in _genericCluster)
	{
		let genericEntry = _genericCluster[genericEntryIndex];

		let boundingEntry = genericEntry.getBoundingClientRect();
		for (genericComparedEntryIndex in _genericCluster)
		{
			if (genericComparedEntryIndex > genericEntryIndex) //Forward-only comparison
			{
				let genericComparedEntry = _genericCluster[genericComparedEntryIndex];
				
				let boundingComparedEntry = genericComparedEntry.getBoundingClientRect();
				
				let alignHorizontally = false;
				let alignVertically = false;
				if (_checkVerticalAlignment(boundingEntry,boundingComparedEntry))
				{
					alignVertically = true;
				}
				if (_checkHorizontalAlignment(boundingEntry,boundingComparedEntry))
				{
					alignHorizontally = true;
				}
				
				if (alignHorizontally && alignVertically)
				{
					console.log("Elements align both vertically and horizontally, they may be overlapping! This is not a table for sure.");
					return undefined;
				}
				else 
				{
					if (alignVertically)
					{
						_executeComparisons(lineSets,uniqueLineArray,_checkVerticalAlignment,genericEntry,genericComparedEntry);
					}
					else if (alignHorizontally)
					{
						_executeComparisons(columnSets,uniqueColumnArray,_checkHorizontalAlignment,genericEntry,genericComparedEntry);
					}
				}
			}
		}
	}
	
	return [uniqueLineArray,uniqueColumnArray];
}

/*
 * Assuming the provided child is a certain descendant of the given parent, it returns the DOM distance (as in, layers of hierarchy) between them.
 * If the child is not a descendant, the behaviour of this function is undefined. 
 */
function getDOMAncenstorDistance(_parentElement,_childToCheck)
{
	let currentDistance = 0;
	let currentElement = _childToCheck;
	while (currentElement = currentElement.parentNode) 
	{
		if (currentElement.isEqualNode(_parentElement))
		{
			return currentDistance;
		}
		else
		{
			currentDistance++;
		}
	}
}

/*
 * Filter detected text elements that are either hidden, or not visible (or useful to the user). These also include empty innerHTML elements.
 * 
 * TODO: Move this to the core file, since it's applicability is general.
 */
function filterDetectedTextElements(_detectedTextElements)
{
	let filteredTextElements = [];
	for (detectedElementIndex in _detectedTextElements)
	{
		let toProcessElement = _detectedTextElements[detectedElementIndex];
		let shouldBeKept = true;
		
		/*
		 * Simple checks
		 */
		if (toProcessElement.innerHTML === "")
		{
			shouldBeKept = false;
		}
		else if (window.getComputedStyle(toProcessElement).visibility === "hidden")
		{
			shouldBeKept = false;
		}
		else if (toProcessElement.className.toLowerCase().includes("hidden"))
		{
			shouldBeKept = false;
		}
		else if (!isElementVisible(toProcessElement)) //From page.js, had more advanced checks.
		{
			shouldBeKept = false;
		}
		
		/*
		 * Advanced checks
		 */
		let elementPositionArray = [toProcessElement.getBoundingClientRect().top, toProcessElement.getBoundingClientRect().left, toProcessElement.getBoundingClientRect().right, toProcessElement.getBoundingClientRect().bottom];
		
		//All-zero check
		if (elementPositionArray.every(function(value, index) { return value === 0}))
		{
			shouldBeKept = false;
		}
		
		//Dimensional check - 1x1
		if (Math.abs(elementPositionArray[0] - elementPositionArray[3]) == 1 && Math.abs(elementPositionArray[1] - elementPositionArray[2]) == 1)
		{
			shouldBeKept = false;
		}
		
		if (shouldBeKept)
		{
			filteredTextElements.push(toProcessElement);
		}
	}
	return filteredTextElements;
}

/*
 * Filter possible table headers from the detected text elements, taking into account the defined datamodels.
 */
function filterPossibleTableHeaders(_detectedTextElements)
{
	let conceptMatrix = [];
	for (knownDataModelIndex in DataModel) 
	{
		if ((knownDataModelIndex !== "ForeignKeys") && ((knownDataModelIndex !== "PrimaryKeys")))
		{
			let studiedDataModel = DataModel[knownDataModelIndex];
			for (detectedElementIndex in _detectedTextElements)
			{
				let detectedElement = _detectedTextElements[detectedElementIndex];
				
				for (studiedDataModelIndex in studiedDataModel)
				{
					let studiedDataModelEntry = studiedDataModel[studiedDataModelIndex];
					let studiedDataModelEntryLowerCase = studiedDataModelEntry.toLowerCase().trim();
					let detectedElementTextLowerCase = detectedElement.innerHTML.toLowerCase().trim();
					
					let foundMatch = false;
					
					//If the texts match exactly
					if (studiedDataModelEntryLowerCase === detectedElementTextLowerCase)
					{
						foundMatch = true;
					}
					else if (detectedElementTextLowerCase.includes(studiedDataModelEntryLowerCase))
					{
						foundMatch = true;
					}
					
					if (foundMatch)
					{
						let conceptDetectionArray = conceptMatrix[studiedDataModel];
						if (conceptDetectionArray === undefined)
						{
							conceptDetectionArray = conceptMatrix[studiedDataModel] = [];
						}
						conceptDetectionArray.push(detectedElement);
					}
				}
			}
		}
	}
	return conceptMatrix;
}

/*
 * Expected to receive a two-dimensional matrix. The first index defines the concepts, and the second one represents the elements that seem to belong to that concept. 
 * It returns a sorted array of concepts, with the most likely one being top (lowest index).
 * DEPRECATED
 */
function detectLikelyDataModel(_conceptMatrix)
{
	_conceptMatrix.sort(function sortFunction(valueA,valueB)
	{
		//TODO trebuie sa mai definim un concept ca sa vedem exact cum facem sort aici.
		return 0;
	});
	
	return _conceptMatrix;
}

/*
 * Clusters elements in a matrix, defined by the header elements. It is very probable that the overall detected text elements also contain the headers, so this must be checked. 
 * DEPRECATED
 */
function clusterElementsByHeadersVertically(_chosenDataModelHeaderElements,_detectedTextElements)
{
	/*
	 * The maximum horizontal displacement of the computed style used when determining whether or not an element is part of a column. 
	 */
	let HORIZONTAL_THRESHOLD = 10;
	
	let tableMatrix = new Map();
	for (headerElementIndex in _chosenDataModelHeaderElements)
	{
		let headerElement = _chosenDataModelHeaderElements[headerElementIndex];
		
		tableMatrix.set(headerElement,[]); //Init the table matrix
		let headerElementPosition = [headerElement.getBoundingClientRect().top, headerElement.getBoundingClientRect().left, headerElement.getBoundingClientRect().right, headerElement.getBoundingClientRect().bottom];
		
		for (detectedElementIndex in _detectedTextElements)
		{
			let detectedElement = _detectedTextElements[detectedElementIndex];
			if (detectedElement !== headerElement)
			{
				let detectedElementPosition = [detectedElement.getBoundingClientRect().top, detectedElement.getBoundingClientRect().left, detectedElement.getBoundingClientRect().right, detectedElement.getBoundingClientRect().bottom];
				
				let columnMemberConfirmations = 0;
				
				//Horizontal alignment check. Do not bother if the checked elementis below us.
				if (headerElementPosition[0] <= detectedElementPosition[0])
				{
					//Left alignment check
					if (Math.abs(headerElementPosition[1] - detectedElementPosition[1]) <= HORIZONTAL_THRESHOLD)
					{
						columnMemberConfirmations++;
					}
					
					//Central alignment check. It should not be possible for the header to be wider than the element it contains, at least when rendered visually. 
					if (headerElementPosition[1] <= detectedElementPosition[1] &&
						headerElementPosition[2] >= detectedElementPosition[2])
					{
						columnMemberConfirmations++;
					}
					
					if (columnMemberConfirmations >= 1)
					{
						tableMatrix.get(headerElement).push(detectedElement);
					}
				}
			}
		}
	}
	
	return tableMatrix;
}

/*
 * Clusters the given elements in lines, based on their top and bottom positions.
 * Takes the vertical cluster map as an argument, and returns an array of arrays, each containing elements that share the same line.
 * TODO: What if the element is alone? Do a final check for elements that have not been covered by any line, and add them to their own line.
 * DEPRECATED
 */
function clusterElementsHorizontally(_verticalClusters)
{
	let horizontalClusterMap = new Map();
	let uniqueLineArray = [];
	
	//let verticalClusterValues = [..._verticalClusters.values()];
	
	for (checkedClusterValues of verticalClusterValues)
	{
		for (checkedClusterElementIndex in checkedClusterValues)
		{
			let checkedClusterElement = checkedClusterValues[checkedClusterElementIndex];
			
			for (checkedAgainstClusterValues of verticalClusterValues)
			{
				//Do not check the same cluster with itself
				if (checkedAgainstClusterValues !== checkedClusterValues)
				{
					for (checkedAgainstClusterElementIndex in checkedAgainstClusterValues)
					{
						let checkedAgainstClusterElement = checkedAgainstClusterValues[checkedAgainstClusterElementIndex];
						
						let boundingA = checkedClusterElement.getBoundingClientRect();
						let boundingB = checkedAgainstClusterElement.getBoundingClientRect();
						
						if (Math.abs(boundingA.top - boundingB.top) <= (boundingA.height+boundingB.height)/2/2)
						{
							if (horizontalClusterMap.has(checkedClusterElement))
							{
								let identifiedLineSet = horizontalClusterMap.get(checkedClusterElement);
								if (!identifiedLineSet.has(checkedAgainstClusterElement))
								{
									identifiedLineSet.add(checkedAgainstClusterElement);
								}
							}
							else if (horizontalClusterMap.has(checkedAgainstClusterElement))
							{
								let identifiedLineSet = horizontalClusterMap.get(checkedAgainstClusterElement);
								if (!identifiedLineSet.has(checkedClusterElement))
								{
									identifiedLineSet.add(checkedClusterElement);
								}
							}
							else
							{
								let newElementSet = new Set();
								newElementSet.add(checkedClusterElement);
								newElementSet.add(checkedAgainstClusterElement);
								
								horizontalClusterMap.set(checkedClusterElement,newElementSet);
								horizontalClusterMap.set(checkedAgainstClusterElement,newElementSet);
								
								uniqueLineArray.push(newElementSet);
							}
						}
					}
				}
			}
		}
	}
	return uniqueLineArray;
}
/*
 * Filter horizontal parents based on their relative distance.
 * DEPRECATED
 */
function filterHorizontalClusters(headerElement,_horizontalClusters)
{
	//TODO Optimize this, remove from the existing list instead of creating a new one.
	let filteredClusters = [];
	
	//Sort the elements of this column based on their distance to the header entry
	let sortedClusterArray = _horizontalClusters.sort(function sortingFunction(valueA,valueB)
	{
		return computeEntityDistance(headerElement,valueA) - computeEntityDistance(headerElement,valueB); 
	})
	
	let incrementalAverage = 0;
	for (horizontalClusterIndex in sortedClusterArray)
	{
		if (horizontalClusterIndex == 0)
		{
			filteredClusters.push(sortedClusterArray[horizontalClusterIndex]);
			continue; //Redundant dar ajuta la undertanding
		}
		else
		{
			let boundingPrevious = sortedClusterArray[horizontalClusterIndex-1].getBoundingClientRect();
			let boundingCurrent = sortedClusterArray[horizontalClusterIndex].getBoundingClientRect();
			
			let boundingDifference = boundingCurrent.top - boundingPrevious.bottom;
			if (horizontalClusterIndex > 1)
			{
				incrementalAverage = incrementalAverage + (boundingDifference - incrementalAverage)/(horizontalClusterIndex);
				if (boundingDifference > 1.5*incrementalAverage)
				{
					break;
				}
			}
			else
			{
				incrementalAverage = boundingDifference;
			}
			filteredClusters.push(sortedClusterArray[horizontalClusterIndex]);
		}
	}
	
	return filteredClusters;
}
/*
 * Given the cluster of horizontal elements, returns a cluster of parents for each set of "lines".
 * TODO: What happens if an element is alone on the line? For example, in a table with 3 columns, only one of them has an actual element. How do we figure what the line is? When do we know we reached a parent?
 * DEPRECATED
 */
function detectHorizontalParents(domVerticalLimit,_horizontalClusters)
{
	let arrayOfParents = [];
	for (clusterIndex in _horizontalClusters)
	{
		let clusterEntry = [..._horizontalClusters[clusterIndex]];
		arrayOfParents.push(detectClusterParent(domVerticalLimit,clusterEntry));
	}
	return arrayOfParents;
}

/*
 * Given an array of DOM elements, this method detects their common parent. 
 */
function detectClusterParent(domVerticalLimit,_genericCluster)
{
	return detectClusterParentStack(domVerticalLimit,_genericCluster)[0][0];
}
/*
 * Find the common parent for all the provided elements, up to the provided limit.
 * Returns an array of [parent,[children]],sorted descending based on their reciprocical inclusion hierarchy.
 * TODO: What happens if two elements do not share the same parent with a third? The algorithm should go back and re-compute the parent, or re-check that previous elements are also found in the second parent.
 */
function detectClusterParentStack(domVerticalLimit,_genericCluster)
{
	let parentStackPair = [];
	
	for (clusterEntryElementIndex in _genericCluster)
	{
		for (clusterEntryComparedIndex in _genericCluster)
		{
			//Only compare forward, do not re-check what's already been checked. Do not compare elements with themselves.
			if (clusterEntryComparedIndex > clusterEntryElementIndex) 
			{
				let clusterElement = _genericCluster[clusterEntryElementIndex];
				let clusterComparedElement = _genericCluster[clusterEntryComparedIndex];
				let foundParent = getClosestCommonAncestor(domVerticalLimit,clusterElement,clusterComparedElement);
				
				let foundMatchingPair = false;
				for (checkedParentPairIndex in parentStackPair)
				{
					let checkedParentPair = parentStackPair[checkedParentPairIndex];
					if (checkedParentPair[0] === foundParent)
					{
						foundMatchingPair = true;
						
						let childrenArray = checkedParentPair[1];
						if (!childrenArray.includes(clusterElement))
						{
							childrenArray.push(clusterElement);
						}
						
						if (!childrenArray.includes(clusterComparedElement))
						{
							childrenArray.push(clusterComparedElement);
						}
					}
				}
				
				if (!foundMatchingPair)
				{
					let childrenArray = [foundParent,[clusterElement,clusterComparedElement]];
					parentStackPair.push(childrenArray);
				}
			}
		}
	}
	
	/*
	 * Sort the elements based on their inclusion order. 
	 * Return the parent that fits all children, but also return the others as downstream entries, for further processing.
	 */
	parentStackPair.sort(function (valueA,valueB)
	{
		return valueA[0].contains(valueB[0]) * -1; //Descending; Negative boolean parsed as integer
	});
	
	return parentStackPair;
}

/*
 * Given an array of parents and elements, return Map of arrays of children that belong to it, in no particular order.
 * DEPRECATED
 */
function findParentStackFamilies(parentStack,_genericCluster)
{
	let parentStackMap = new Map();
	
	for (parentStackIndex in parentStack)
	{
		let parentFamilyArray = [];
		let parentStackEntry = parentStack[parentStackIndex];
		for (genericClusterEntryIndex in _genericCluster)
		{
			let genericClusterEntry = _genericCluster[genericClusterEntryIndex];
			if (parentStackEntry.contains(genericClusterEntry))
			{
				parentFamilyArray.push(genericClusterEntry);
			}
		}
		parentStackMap.set(parentStackEntry,parentFamilyArray);
	}
	
	return parentStackMap;
}
/*
 * Computes the distance between any two rectangles dictated by the parameter.
 * DEPRECATED
 */
function computeEntityDistance(entityA,entityB)
{
	//x1,y1,x2,y2,w1,w2,h1,h2
	let boundingA = entityA.getBoundingClientRect();
	let boundingB = entityB.getBoundingClientRect();
	
	let x1 = boundingA.x;
	let y1 = boundingA.y;
	let w1 = boundingA.width;
	let h1 = boundingA.height;
	
	let x2 = boundingB.x;
	let y2 = boundingB.y;
	let w2 = boundingB.width;
	let h2 = boundingB.height;
	
	return Math.max(Math.abs(x1-x2) - (w1+w2)/2,Math.abs(y1-y2)-(h1+h2)/2);
}
