
let InsertAccount_PrimaryBlock = [ 
	{operation:"Click", target: "IMG#homeButtonImage/ SPAN.navTabButtonImageContainer/ A#HomeTabLink/ SPAN#TabHome/ DIV#navTabGroupDiv/ DIV#navBar/ DIV#crmMasthead/ ", targetText : ""}, 
	{concept: "", operation : "Generic DOM"}, 
	{operation: "Click", target : "IMG/ SPAN.navActionButtonIcon/ SPAN.navActionButtonIconContainer/ A#SFA/ LI.nav-group/ SPAN.nav-layout/ SPAN.nav-groupBody/ SPAN.nav-groupContainer/ LI.nav-subgroup/ UL.nav-tabBody/ DIV#actionGroupControl/ DIV#actionGroupControl_viewport/ DIV#actionGroupControl_scrollableContainer/ DIV.mainTab-nav-scrl/ DIV.navActionGroupContainer/ DIV#crmMasthead/ ", targetText : ""}, 
	{concept: "", operation : "Generic DOM"}, 
	{operation: "Click", target: "SPAN.nav-rowLabel/ A#nav_accts/ LI.nav-subgroup/ SPAN.nav-section/ SPAN.nav-layout/ SPAN.nav-groupBody/ SPAN.nav-groupContainer/ LI.nav-group/ UL.nav-tabBody/ DIV#detailActionGroupControl/ DIV#detailActionGroupControl_viewport/ DIV#detailActionGroupControl_scrollableContainer/ DIV.nav-scrl/ DIV.navActionListContainer/ DIV#crmMasthead/ ", targetText: "Accounts"}, 
	{concept : ['Account'], operation: "SELECTALL"}, 
	{operation: "Click", target: "SPAN.ms-crm-CommandBar-Menu/ A.ms-crm-Menu-Label/ SPAN.ms-crm-CommandBar-Button.ms-crm-Menu-Label/ LI#account|NoRelationship|HomePageGrid|Mscrm.HomepageGrid.account.NewRecord/ UL.ms-crm-CommandBar-Menu/ DIV#commandContainer1/ DIV#crmRibbonManager/ DIV#crmTopBar/ ", targetText: "NEW"}, 
	/*{concept: "Account", operation: "INSERT", parameters:{"Account Name":"UBBtest","Phone":"00000000000", 
						"Fax":"00000000000","Website":"www.ubbcluj.ro","Parent Account":"", "Ticker Symbol":"a", 
						"Address":"Str.M.Kogalniceanu,Cluj", "Description":"University", "Industry":"Academic","SICCode":"00000","Ownership":""}},
	*/
	{concept: "Account", operation: "INSERT"},
	{operation:"Post-Operation", target: "A.ms-crm-Menu-Label/ SPAN.ms-crm-CommandBar-Button.ms-crm-Menu-Label/ LI#account|NoRelationship|Form|Mscrm.Form.account.SaveAndClose/ UL.ms-crm-CommandBar-Menu/ DIV#commandContainer3/DIV#crmRibbonManager/ DIV#crmTopBar/" , targetText: "SAVE & CLOSE"}  
];


// este doar de test, nu l-am inregistrat corect
let UpdateAccount_PrimaryBlock = [ 
	{operation:"Click", target: "IMG#homeButtonImage/ SPAN.navTabButtonImageContainer/ A#HomeTabLink/ SPAN#TabHome/ DIV#navTabGroupDiv/ DIV#navBar/ DIV#crmMasthead/ ", targetText : ""}, 
	{concept: "", operation : "Generic DOM"}, 
	{operation: "Click", target : "IMG/ SPAN.navActionButtonIcon/ SPAN.navActionButtonIconContainer/ A#SFA/ LI.nav-group/ SPAN.nav-layout/ SPAN.nav-groupBody/ SPAN.nav-groupContainer/ LI.nav-subgroup/ UL.nav-tabBody/ DIV#actionGroupControl/ DIV#actionGroupControl_viewport/ DIV#actionGroupControl_scrollableContainer/ DIV.mainTab-nav-scrl/ DIV.navActionGroupContainer/ DIV#crmMasthead/ ", targetText : ""}, 
	{concept: "", operation : "Generic DOM"}, 
	{operation: "Click", target: "SPAN.nav-rowLabel/ A#nav_accts/ LI.nav-subgroup/ SPAN.nav-section/ SPAN.nav-layout/ SPAN.nav-groupBody/ SPAN.nav-groupContainer/ LI.nav-group/ UL.nav-tabBody/ DIV#detailActionGroupControl/ DIV#detailActionGroupControl_viewport/ DIV#detailActionGroupControl_scrollableContainer/ DIV.nav-scrl/ DIV.navActionListContainer/ DIV#crmMasthead/ ", targetText: "Accounts"}, 
	{concept : ['Account'], operation: "SELECTALL"}, 
	{operation: "Click", target: "", targetText: "", targetType: "generic" }, 
	/*{concept: "Account", operation: "UPDATE", parameters:{"Account Name":"UBBtest","Phone":"00000000000", 
						"Fax":"00000000000","Website":"www.ubbcluj.ro","Parent Account":"", "Ticker Symbol":"a", 
						"Address":"Str.M.Kogalniceanu,Cluj", "Description":"University", "Industry":"Academic","SICCode":"00000","Ownership":""}},
	*/
	{concept: "Account", operation: "UPDATE"},
	{operation:"Post-Operation", target: "A.ms-crm-Menu-Label/ SPAN.ms-crm-CommandBar-Button.ms-crm-Menu-Label/ LI#account|NoRelationship|Form|Mscrm.Form.account.SaveAndClose/ UL.ms-crm-CommandBar-Menu/ DIV#commandContainer3/DIV#crmRibbonManager/ DIV#crmTopBar/" , targetText: "SAVE & CLOSE"}  
];

let SelectAllAccount_PrimaryBlock = [ 
	{operation:"Click", target: "IMG#homeButtonImage/ SPAN.navTabButtonImageContainer/ A#HomeTabLink/ SPAN#TabHome/ DIV#navTabGroupDiv/ DIV#navBar/ DIV#crmMasthead/ ", targetText : ""}, 
	{concept: "", operation : "Generic DOM"}, 
	{operation: "Click", target : "IMG/ SPAN.navActionButtonIcon/ SPAN.navActionButtonIconContainer/ A#SFA/ LI.nav-group/ SPAN.nav-layout/ SPAN.nav-groupBody/ SPAN.nav-groupContainer/ LI.nav-subgroup/ UL.nav-tabBody/ DIV#actionGroupControl/ DIV#actionGroupControl_viewport/ DIV#actionGroupControl_scrollableContainer/ DIV.mainTab-nav-scrl/ DIV.navActionGroupContainer/ DIV#crmMasthead/ ", targetText : ""}, 
	{concept: "", operation : "Generic DOM"}, 
	{operation: "Click", target: "SPAN.nav-rowLabel/ A#nav_accts/ LI.nav-subgroup/ SPAN.nav-section/ SPAN.nav-layout/ SPAN.nav-groupBody/ SPAN.nav-groupContainer/ LI.nav-group/ UL.nav-tabBody/ DIV#detailActionGroupControl/ DIV#detailActionGroupControl_viewport/ DIV#detailActionGroupControl_scrollableContainer/ DIV.nav-scrl/ DIV.navActionListContainer/ DIV#crmMasthead/ ", targetText: "Accounts"}, 
	{concept : ['Account'], operation: "SELECTALL"}, 
];


var RecordedPrimaryBlocks = {
	"INSERT Account" : InsertAccount_PrimaryBlock,
	"UPDATE Account" : UpdateAccount_PrimaryBlock,
	"SELECTALL Account" : SelectAllAccount_PrimaryBlock
};

export {RecordedPrimaryBlocks};
