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
	let detectedTextElements = filterDetectedTextElements(getTextElements(window.frames[0].document.body));
	let possibleTableHeaders = filterPossibleTableHeaders(detectedTextElements);
	let dataModelMatrix = detectLikelyDataModel(possibleTableHeaders);
	
	//TODO actually choose this more carefully. Right now we just assume the top-most is the one.
	let chosenDataModel = Object.keys(dataModelMatrix)[0];
	let chosenDataModelHeaderElements = dataModelMatrix[chosenDataModel];
	
	let verticalClusters = clusterElementsByHeadersVertically(chosenDataModelHeaderElements,detectedTextElements);
	console.log(verticalClusters);
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
