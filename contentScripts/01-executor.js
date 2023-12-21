
//import {RecordedPrimaryBlocks} from './01-primaryBlocks.js';

let InsertAccount_PrimaryBlock = [ 
	{operation:"Click", target: "IMG#homeButtonImage/ SPAN.navTabButtonImageContainer/ A#HomeTabLink/ SPAN#TabHome/ DIV#navTabGroupDiv/ DIV#navBar/ DIV#crmMasthead/ ", targetText : ""}, 
	{concept: "", operation : "Generic DOM"}, 
	{operation: "Click", target : "IMG/ SPAN.navActionButtonIcon/ SPAN.navActionButtonIconContainer/ A#SFA/ LI.nav-group/ SPAN.nav-layout/ SPAN.nav-groupBody/ SPAN.nav-groupContainer/ LI.nav-subgroup/ UL.nav-tabBody/ DIV#actionGroupControl/ DIV#actionGroupControl_viewport/ DIV#actionGroupControl_scrollableContainer/ DIV.mainTab-nav-scrl/ DIV.navActionGroupContainer/ DIV#crmMasthead/ ", targetText : ""}, 
	{concept: "", operation : "Generic DOM"}, 
	{operation: "Click", target: "SPAN.nav-rowLabel/ A#nav_accts/ LI.nav-subgroup/ SPAN.nav-section/ SPAN.nav-layout/ SPAN.nav-groupBody/ SPAN.nav-groupContainer/ LI.nav-group/ UL.nav-tabBody/ DIV#detailActionGroupControl/ DIV#detailActionGroupControl_viewport/ DIV#detailActionGroupControl_scrollableContainer/ DIV.nav-scrl/ DIV.navActionListContainer/ DIV#crmMasthead/ ", targetText: "Accounts"}, 
	{concept : ['Account'], operation: "SELECTALL"}, 
	{operation: "Click", target: "SPAN.ms-crm-CommandBar-Menu/ A.ms-crm-Menu-Label/ SPAN.ms-crm-CommandBar-Button.ms-crm-Menu-Label/ LI#account|NoRelationship|HomePageGrid|Mscrm.HomepageGrid.account.NewRecord/ UL.ms-crm-CommandBar-Menu/ DIV#commandContainer1/ DIV#crmRibbonManager/ DIV#crmTopBar/ ", targetText: "NEW"}, 
	{concept: "Account", operation: "INSERT", parameters:{"Account Name":"UBBtest","Phone":"00000000000", 
						"Fax":"00000000000","Website":"www.ubbcluj.ro","Parent Account":"", "Ticker Symbol":"a", 
						"Address":"Str.M.Kogalniceanu,Cluj", "Description":"University", "Industry":"Academic","SICCode":"00000","Ownership":""}},
	//{operation:"Post-Operation", target: "SPAN.ms-crm-CommandBar-Menu/ A.ms-crm-Menu-Label/ SPAN.ms-crm-CommandBar-Button.ms-crm-Menu-Label/ LI#account|NoRelationship|Form|Mscrm.Form.account.Save/ UL.ms-crm-CommandBar-Menu/ DIV#commandContainer3/DIV#crmRibbonManager/ DIV#crmTopBar/" , targetText: "SAVE"}  
	//{operation:"Post-Operation", target: "A.ms-crm-Menu-Label/ SPAN.ms-crm-CommandBar-Button.ms-crm-Menu-Label/ LI#account|NoRelationship|Form|Mscrm.Form.account.Save/ UL.ms-crm-CommandBar-Menu/ DIV#commandContainer3/DIV#crmRibbonManager/ DIV#crmTopBar/" , targetText: "SAVE"}  
	{operation:"Post-Operation", target: "A.ms-crm-Menu-Label/ SPAN.ms-crm-CommandBar-Button.ms-crm-Menu-Label/ LI#account|NoRelationship|Form|Mscrm.Form.account.SaveAndClose/ UL.ms-crm-CommandBar-Menu/ DIV#commandContainer3/DIV#crmRibbonManager/ DIV#crmTopBar/" , targetText: "SAVE & CLOSE"}  
];

/*
var InsertAccount_PrimaryBlock = [ 
	{concept: "Account", operation: "INSERT", parameters:{"Account Name":"UBBtest","Phone":"00000000000", 
						"Fax":"00000000000","Website":"www.ubbcluj.ro","Parent Account":"", "Ticker Symbol":"a", 
						"Address":"Str.M.Kogalniceanu,Cluj", "Primary Contact":"VirginiaNiculescu", 
						"Description":"University", "Industry":"Academic","SICCode":"00000","Ownership":""}},
	//{operation:"Post-Operation", target: "SPAN.ms-crm-CommandBar-Menu/ A.ms-crm-Menu-Label/ SPAN.ms-crm-CommandBar-Button.ms-crm-Menu-Label/ LI#account|NoRelationship|Form|Mscrm.Form.account.Save/ UL.ms-crm-CommandBar-Menu/ DIV#commandContainer3/DIV#crmRibbonManager/ DIV#crmTopBar/" , targetText: "SAVE"}  
];*/
 

/* Example of a complex process made from several primary blocks that is given to execute by the
 * user in the "Automatic execution" tab of the Popup.
 */
let ComplexProcessExample = [
	// an InsertAccount_PrimaryBlock
	{concept: "Account", operation: "INSERT", parameters:{"Account Name":"UBBtest","Phone":"00000000000", 
   			  "Fax":"00000000000","Website":"www.ubbcluj.ro","Parent Account":"", "Ticker Symbol":"a", 
			  "Address":"Str.M.Kogalniceanu,Cluj", "Description":"University", "Industry":"Academic","SICCode":"00000","Ownership":""}},
	// an UpdateAccount_PrimaryBlock of the Account Name "UBBtest" ("Account Name" is the key of the entity)
	{concept: "Account", operation: "UPDATE", parameters:{"Account Name":"UBBtest","Phone":"00000000000", 
   			  "Fax":"00000000000","Website":"www.ubbcluj.ro","Parent Account":"", "Ticker Symbol":"a", 
			  "Address":"Str.M.Kogalniceanu,Cluj", "Description":"University", "Industry":"Academic","SICCode":"00000","Ownership":""}},
	// an SelectAllAccount_PrimaryBlock
	{concept: "Account", operation: "SELECTALL"}
];


async function ExecutePrimaryBlock(PrimaryBlock) {
	for(let i=0; i<PrimaryBlock.length; i++) {
		let CurrentStep = PrimaryBlock[i];
		if ((CurrentStep.operation == "Click") && (CurrentStep.target != "")) {
			console.log("ExecutePrimaryBlock(): executing step: ", CurrentStep);
			let target = UNSerializeDOMPath(CurrentStep.target);
			console.log("ExecutePrimaryBlock(): target element is: ", target);
			await clickTrigger(target, 1000);
    		// wait for the click event to be handled
    		await pause(5000); // for fast runs we can set a pause of only 1 seconds
		} else if (CurrentStep.operation != "Post-Operation") {
			console.log("ExecutePrimaryBlock(): current step: ", CurrentStep);
			// map the currently loaded DOM to a conceptual operation in the Database
			await mapUIOperation();

			if ((CurrentStep.concept!="") && ((CurrentStep.operation=="INSERT") || 
				(CurrentStep.operation=="UPDATE") || (CurrentStep.operation=="DELETE"))) {
					console.log("ExecutePrimaryBlock(): DOMState = ", DOMState);
					if ((DOMState.currentDOM.concept==CurrentStep.concept) && (DOMState.currentDOM.operation==CurrentStep.operation)) {
						await ExecuteCRUDOperation(CurrentStep); // pot comenta await
					} 
			}
		} else {
			// this is the post-operation
			console.log("ExecutePrimaryBlock(): Post-operation: ", CurrentStep);
			let target = UNSerializeDOMPath(CurrentStep.target);
			console.log("ExecutePrimaryBlock(): target element is: ", target);
			target.style.border = "1px solid red";
			await clickTrigger(target, 1000);
    		// wait for the click event to be handled
    		//await pause();
		}
	}
	//await clickTrigger(document.body);
	console.log("ExecutePrimaryBlock(): Execution of primary block is completed!");
	return "SUCCESS";
}


async function ExecuteCRUDOperation(CRUDoperation) {
	if ((CRUDoperation.concept=="") || (CRUDoperation.operation=="") || (CRUDoperation.parameters==null)) {
		console.log("ExecuteCRUDOperation(): Error! Bad format of crud operation: ", CRUDoperation);
		return;
	}

	console.log("ExecuteCRUDOperation(): textElementsWithInputs=", textElementsWithInputs);

	for(let p in CRUDoperation.parameters) { 
		// console.log(p)
		let inputNode = findInputNodeForProperty(p);
		if (inputNode!=null) {
			console.log("ExecuteCRUDOperation(): Found input node for " + p + ".");
			await clickTrigger(inputNode);
			inputNode.value = CRUDoperation.parameters[p];
			//inputNode.innerHTML = CRUDoperation.parameters[p];
			//await pause(1000);
			await blurTrigger(inputNode);
		} else {
			console.log("ExecuteCRUDOperation(): input node not found for " + p + "!");
		}
	}
}


function findInputNodeForProperty(property) {
	for(let i=0; i<textElementsWithInputs.length; i++) {
		let association = textElementsWithInputs[i];
		if (association.textNode.innerText.trim()==property) {
			return association.inputNode;
		}
	}

	return null;
}
