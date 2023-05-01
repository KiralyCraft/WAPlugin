// We consider the firt property of a concept to be a primary key

var DataModel = {
/*		"Account" : ["Account Name", "Phone", "Fax", "Website", "Parent Account", "Ticker Symbol",
					 "Address", "Primary Contact", "Description", "Industry", "SIC Code", "Ownership"],
		"Contact" : ["Full Name", "Job Title", "Account Name", "Email", "Business Phone", "Mobile Phone",
					"Fax", "Preferred Method of Contact", "Address", "Gender", "Marital Status",
					"Spouse/Partner Name", "Birthday", "Anniversary", "Personal Notes", "Company",
					"Originating Lead", "Last Campaign Date", "Marketing Materials", "Contact Method",
					"Email", "Bulk Email", "Phone", "Fax", "Mail"],
*/
		/* For Ms Dynamics 365 CRM 2019 */
/*		"Customer" : ["No.", "Name", "Balance ($)", "Balance Due ($)", "Credit Limit ($)", "Blocked", 
					  "Total Sales", "Costs ($)", "Address", "Address 2", "Country/Region Code", "City",
					  "Email", "Home Page", "Contact Name", "Tax Registration No.", "Copy Sell-to Addr. to Qte From"],
*/
		/* For Atlassian Jira */
		"Issue" : ["Project", "Issue Type", "Summary", "Acceptance Criteria", "Description", "Component/s",
					"Fix Version/s", "Priority", "Labels", "Linked Issues", "Issue", "Assignee", "Epic Link",
					"Sprint", "Attachment", "Attachment Links", "Parent Link", "Resolution"],

		"PrimaryKeys" : [ {Concept : "Account", PrimaryKey : "Account Name"}], 
		"ForeignKeys" : [ { ForeignKey : "Company", ForeignConcept : "Contact", PrimaryKey : "Account Name", PrimaryConcept : "Account" } 
						]
};




