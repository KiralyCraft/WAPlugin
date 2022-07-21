/*
 * This variable defines fields and attributes to look after
 */
const STATIC_SEARCH_FIELDS = 
{
	"a":{},
	"button":{},
	"input":{},
	"form":
	{
		"method":"post"
	}
	
}

chrome.runtime.onMessage.addListener(function(receivedMessage, sender, sendResponse) 
{
	switch(receivedMessage.action)
	{
		case "action_popup_visible_inputdetect":
			sendResponse(handlePopupVisible(sendResponse));
			break;
		case "action_inputdetect_show":
			handleElementShow(receivedMessage.data);
			break;
	}
})

///////// GLOBAL VARS //////////
var lastDetectionIteration;
////////////////////////////////
/*
 * Runs the static detection algorithm. It looks for the items specified in STATIC_SEARCH_FIELDS
 */
function runStaticDetection()
{
	var detectedFields = [];

	for (var searchedType in STATIC_SEARCH_FIELDS) 
	{
		//Skip la cheia asta daca nu e definita de obiectul in sine
		if (!STATIC_SEARCH_FIELDS.hasOwnProperty(searchedType)) continue;
		
		var searchedTypeAttributes = STATIC_SEARCH_FIELDS[searchedType];
		
		var searchedTypeAttrLength = Object.keys(searchedTypeAttributes).length; //May not be implemented in all browesrs
		
		//... = merge arrays
		if (searchedTypeAttrLength > 0)
		{
			for (var searchedAttribute in searchedTypeAttributes) 
			{
				var searchedAttributeValue = searchedTypeAttributes[searchedAttribute];
				detectedFields.push(...getElementByXpath("//"+searchedType+'[@'+searchedAttribute+'="'+searchedAttributeValue+'"]')); 
			}
		}
		else
		{
			detectedFields.push(...getElementByXpath("//"+searchedType)); 
		}
	}
	return detectedFields;
}

/*
 * Handles the event when the popup is visible and has established communication with this script. 
 * Sending a response here will reach the popup script directly
 */
function handlePopupVisible()
{
	lastDetectionIteration = runStaticDetection();
	var intermediaryArray = [];
	
	for (var intermediaryArrayIterator in lastDetectionIteration)
	{
		intermediaryArray.push(lastDetectionIteration[intermediaryArrayIterator].nodeName);
	}
	
	return [{action:'action_inputdetect_preview',data:intermediaryArray}];
}

/*
 * Handles the actual highlighting of the element indicated by the index provided as argument.
 */
function handleElementShow(theData)
{
	var theActualElement = lastDetectionIteration[theData];
	
	theActualElement.style.outline = '#f00 solid 4px';
	
	theActualElement.scrollIntoView();
}

////////////////////HELPERS///////////////////////////
/*
 * Helper function, following W3 standards of searching by XPath
 */
function getElementByXpath(xpathToExecute) 
{
	var toReturn = [];
	var nodesSnapshot = document.evaluate(xpathToExecute, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );
	for ( var i=0 ; i < nodesSnapshot.snapshotLength; i++ )
	{
		toReturn.push( nodesSnapshot.snapshotItem(i) );
	}
	return toReturn;
}
