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
