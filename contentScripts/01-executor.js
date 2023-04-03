
let InsertAccount_PrimaryBlock = [ 
	{operation:"Click", target: "IMG#homeButtonImage| SPAN.navTabButtonImageContainer| A#HomeTabLink| SPAN#TabHome| DIV#navTabGroupDiv| DIV#navBar| DIV#crmMasthead| ", targetText : ""}, 
	{concept: "", operation : "Generic DOM"}, 
	{operation: "Click", target : "IMG| SPAN.navActionButtonIcon| SPAN.navActionButtonIconContainer| A#SFA| LI.nav-group| SPAN.nav-layout| SPAN.nav-groupBody| SPAN.nav-groupContainer| LI.nav-subgroup| UL.nav-tabBody| DIV#actionGroupControl| DIV#actionGroupControl_viewport| DIV#actionGroupControl_scrollableContainer| DIV.mainTab-nav-scrl| DIV.navActionGroupContainer| DIV#crmMasthead| ", targetText : ""}, 
	{concept: "", operation : "Generic DOM"}, 
	{operation: "Click", target: "SPAN.nav-rowLabel| A#nav_accts| LI.nav-subgroup| SPAN.nav-section| SPAN.nav-layout| SPAN.nav-groupBody| SPAN.nav-groupContainer| LI.nav-group| UL.nav-tabBody| DIV#detailActionGroupControl| DIV#detailActionGroupControl_viewport| DIV#detailActionGroupControl_scrollableContainer| DIV.nav-scrl| DIV.navActionListContainer| DIV#crmMasthead| ", targetText: "Accounts"}, 
	{concept : ['Account'], operation: "SELECTALL"}, 
	{operation: "Click", target: "SPAN.ms-crm-CommandBar-Menu| A.ms-crm-Menu-Label| SPAN.ms-crm-CommandBar-Button ms-crm-Menu-Label-Hovered| LI#account|NoRelationship|HomePageGrid|Mscrm.HomepageGrid.account.NewRecord| UL.ms-crm-CommandBar-Menu| DIV#commandContainer1| DIV#crmRibbonManager| DIV#crmTopBar| ", targetText: "NEW"}, 
	{concept: "Account", operation: "INSERT"} 
];

async function ExecutePrimaryBlock(PrimaryBlock) {
	for(let i=0; i<PrimaryBlock.length; i++) {
		let CurrentStep = PrimaryBlock[i];
		if ((CurrentStep.operation == "Click") && (CurrentStep.target != "")) {
			console.log("ExecutePrimaryBlock(): triggering step: ", CurrentStep);
			await clickTrigger(UNSerializeDOMPath(CurrentStep.target), 1000)
    		// wait for the click event to be handled
    		await pause();
		} else {
			console.log("ExecutePrimaryBlock(): current step: ", CurrentStep);	

		}
	}

}