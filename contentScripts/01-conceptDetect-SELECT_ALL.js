/*
 * This file should be loaded after the core detection algorithms. This ensures that methods defined in the core file (page.js) are also accessible here, while providing a separation of detection concepts.
 */

chrome.runtime.onMessage.addListener(function(receivedMessage, sender, sendResponse) {
	 if (receivedMessage.request == "message_popup_page_processDOMDifference_TMP") //TODO Trebuie sa definim cumva alta metoda de procesare a mesajului aici, pentru ca nu corespunde cu structura impusa
	 {
		executeDetectionProcedure();
	 }
});

/*
 * The main method of this file. Detection algorithm starts here.
 */
function executeDetectionProcedure()
{
	let SUPPOSED_ROOT = window.frames[0].document.body;
	
	let detectedTextElements = filterDetectedTextElements(getTextElements(SUPPOSED_ROOT));
	let possibleTableHeaders = filterPossibleTableHeaders(detectedTextElements);
	let dataModelMatrix = detectLikelyDataModel(possibleTableHeaders);
	
	//TODO actually choose this more carefully. Right now we just assume the top-most is the one.
	let chosenDataModel = Object.keys(dataModelMatrix)[0];
	let chosenDataModelHeaderElements = dataModelMatrix[chosenDataModel];
	
	let verticalClusters = clusterElementsByHeadersVertically(chosenDataModelHeaderElements,detectedTextElements);
	
	let horizontalClusters = clusterElementsHorizontally(verticalClusters);
	//TODO Also include the header line in the parent detection algorithm.
	let horizontalParents = detectHorizontalParents(SUPPOSED_ROOT,horizontalClusters);
	//TODO Sort the identified elements according to their horizontal order
	//TODO Build an actual parent of the header elements, right now we just assume one of the elements as the whole line. This is just for the initial sort of the filter
	let filteredHorizontalParents = filterHorizontalClusters(chosenDataModelHeaderElements[0],horizontalParents);
	console.log(filteredHorizontalParents);
	//TODO pot gasi un dreptunghi care sa includa doar ce am gasit si nimic altceva?
	//TODO cat de mic trebuie sa fie dreptunghiul astfel incat sa includa doar chestii ce le-am gasit, dar nimic altceva?
	//TODO spatiul intre doua linii sa fie mai mic.
	/*
	 * Un mega-cluster este de fapt un tabel si contine linii pentru
		care intre doua linii succesive avem: Linia1.getBoundingClientRect().bottom =
		Linia2.getBoundingClientRect().top + offset, unde offset este un numar intre 0px
		si (height of a line)/2 pixels.*/
	
	//TODO de vazut mai mnulte tabele in aceeasi pagina, rulam de mai multe ori si excludem alea prin care am trecut deja
	
	//TODO de vazut pentru fiecare element, care e top si bottom. pe baza astora, identificam liniile. unele coloane pot fi goale, dar pentru fiecare coloana zicem care sunt coloanele (pe baza top & bottom). apoi facem interclasare si reorientare 
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
	return conceptMatrix;
}

/*
 * Expected to receive a two-dimensional matrix. The first index defines the concepts, and the second one represents the elements that seem to belong to that concept. 
 * It returns a sorted array of concepts, with the most likely one being top (lowest index).
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
	
	return tableMatrix;
}

/*
 * Clusters the given elements in lines, based on their top and bottom positions.
 * Takes the vertical cluster map as an argument, and returns an array of sets, each containing elements that share the same line.
 * TODO: What if the element is alone? Do a final check for elements that have not been covered by any line, and add them to their own line.
 */
function clusterElementsHorizontally(_verticalClusters)
{
	//let visitedElementsSet = new Set();
	let horizontalClusterMap = new Map();
	let uniqueLineArray = [];
	
	let verticalClusterValues = [..._verticalClusters.values()];
	
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
						
						//if (!visitedElementsSet.has(checkedAgainstClusterElement) && !visitedElementsSet.has(checkedClusterElement))
						//{
							let boundingA = checkedClusterElement.getBoundingClientRect();
							let boundingB = checkedAgainstClusterElement.getBoundingClientRect();
							
							if (Math.abs(boundingA.top - boundingB.top) <= (boundingA.height+boundingB.height)/2/2)
							{
								//visitedElementsSet.add(checkedAgainstClusterElement);
								
								//console.log(checkedClusterValues[checkedClusterElementIndex]);
								//console.log(checkedAgainstClusterValues[checkedAgainstClusterElementIndex]);
								//console.log();
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
						//}
					}
				}
			}
			//visitedElementsSet.add(checkedClusterElement);
		}
	}
	return uniqueLineArray;
}
/*
 * Filter horizontal parents based on their relative distance.
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
 * TODO: What happens if two elements do not share the same parent with a third? The algorithm should go back and re-compute the parent, or re-check that previous elements are also found in the second parent.
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

function detectClusterParent(domVerticalLimit,_genericCluster)
{
	let commonParent;
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
				if (commonParent === undefined)
				{
					commonParent = foundParent;
				}
				else if (foundParent !== commonParent)
				{
					console.log("Found elements that are in a line but do not share the same parent with the others! Behaviour in this scenario is yet undefined.");
				}
			}
		}
	}
	return commonParent;
}
/*
 * Computes the distance between any two rectangles dictated by the parameter.
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
