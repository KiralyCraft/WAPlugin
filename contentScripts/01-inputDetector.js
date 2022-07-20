/*
 * This variable defines fields and attributes to look after
 */
const staticSearchFields = 
{
	"input":{},
	"form":
	{
		"method":"post"
	}
	
}

var detectedFields = [];

for (var searchedType in staticSearchFields) 
{
	//Skip la cheia asta daca nu e definita de obiectul in sine
	if (!staticSearchFields.hasOwnProperty(searchedType)) continue;
	
	var searchedTypeAttributes = staticSearchFields[searchedType];
	
	var searchedTypeAttrLength = Object.keys(searchedTypeAttributes).length; //May not be implemented in all browesrs
	
	//... = merge arrays
	if (searchedTypeAttrLength > 0)
	{
		for (var searchedAttribute in searchedTypeAttributes) 
		{
			var searchedAttributeValue = searchedTypeAttributes[searchedAttribute];
			console.log("//"+searchedType+'[@'+searchedAttribute+'="'+searchedAttributeValue+'"]');
			detectedFields.push(...getElementByXpath("//"+searchedType+'[@'+searchedAttribute+'="'+searchedAttributeValue+'"]')); 
		}
	}
	else
	{
		detectedFields.push(...getElementByXpath("//"+searchedType)); 
	}
}

console.log(detectedFields);



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
