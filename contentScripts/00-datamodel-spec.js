// We consider the firt property of a concept to be a primary key

var DataModel = {
/*		"Account" : ["Account Name", "Phone", "Fax", "Website", "Parent Account", "Ticker Symbol",
					 "Address", "Primary Contact", "Description", "Industry", "SIC Code", "Ownership"],
		"Contact" : ["Full Name", "Job Title", "Account Name", "Email", "Business Phone", "Mobile Phone",
					"Fax", "Preferred Method of Contact", "Address", "Gender", "Marital Status",
					"Spouse/Partner Name", "Birthday", "Anniversary", "Personal Notes", "Company",
					"Originating Lead", "Last Campaign Date", "Marketing Materials", "Contact Method",
					"Email", "Bulk Email", "Phone", "Fax", "Mail"],
		"Lead" : ["Topic", "Name", "Job Title", "Business Phone", "Mobile Phone", "Email", "Stakeholders",
				 "Company", "Website", "Address", "Competitors", "Description", "Industry", "Annual Revenue",
				 "No. of Employees", "SIC Code", "Currency", "Source Campaign", "Preferred", "Email", 
				 "Bulk Email", "Phone", "Mail"],
		"Opportunity" : ["Topic", "Contact", "Account", "Purchase Timeframe", "Currency", "Budget Amount",
				 "Purchase Process", "Description", "Stakeholders", "Current situation", "Customer need",
				 "Proposed solution", "Sales Team", "Competitors", "Price List", "Revenue", "Detail Amount",
				 "(-) Discount (%)", "(-) Discount", "Pre-Freight Amount", "(+) Freight Amount", "(+) Total Tax",
				 "Total amount", "Quotes"],
*/

		/* For Ms Dynamics 365 CRM 2019 */
		"Customer" : ["No.", "Name", "IC Partner Code", "Balance ($)", "Balance Due ($)", "Credit Limit ($)", 
					  "Blocked", "Privacy Blocked", "Salesperson Code", "Responsability center", "Service zone code",
					  "Document sending profile", "Total Sales", "Costs ($)", "Profit ($)", "Profit %", 
					  "Last Date Modified", "Disable search by name", "Address", "Address 2", "Country/Region Code", "City",
					  "Email", "Home Page", "Contact Name", "Tax Registration No.", "Copy Sell-to Addr. to Qte From",
					  "Payment Terms Code", "Payment Method Code", "Ship-to Code", "Location Code"],
		"Sales order" : ["Customer No.", "Customer Name", "Contact", "Posting date", "Order date", "Due date", "Requested delivery date",
					"External Document No.", "Status", "Address", "Address 2", "City", "Country/Region Code", 
					"contact No.", "Phone No.", "Currency Code", "VAT Bus. Posting Group", "Payment Service",
					"Ship-to", "Contact", "Bill-to", "Location code", "Shipment Date"],
		"Vendor" : ["No.", "Name", "Blocked", "Privacy Blocked", "Last Date Modified", "Balance ($)", 
					"Balance Due ($)", "Document sending profile", "Search name", "IC Partner code",
					"Purchaser code", "Responsability Center", "Disable search by name", "Address", "Address 2", 
					"Country/Region Code", "City", "Email", "Home Page", "Contact", "Tax Registration No.", 
					"Payment Terms Code", "Payment Method Code", "Location Code"],
		


		/* For Atlassian Jira */
/*		"Issue" : ["Project", "Issue Type", "Summary", "Acceptance Criteria", "Description", "Component/s",
					"Fix Version/s", "Priority", "Labels", "Linked Issues", "Issue", "Assignee", "Epic Link",
					"Sprint", "Attachment", "Attachment Links", "Parent Link", "Resolution", "Comment"],
		// An alias of Jira Issue 
		"Issue1" : ["R&D project", "Type", "Priority", "Affects Version/s", "Component/s", "Labels", "Epic Link",
					"Resolution", "Fix Version/s", "Description", "Attachments", "Activity", "Comment", 
					"Assignee", "Reporter", "Votes", "Watchers", "Created", "Updated"],
		"Sprint" : ["Sprint Name", "Goal", "Duration", "Start Date", "End Date"],
		"Log" : ["Time Spent", "Date Started", "Remaining Estimate", "Work Description"],
*/
		"PrimaryKeys" : [ {Concept : "Account", PrimaryKey : "Account Name"}], 
		"ForeignKeys" : [ { ForeignKey : "Company", ForeignConcept : "Contact", PrimaryKey : "Account Name", PrimaryConcept : "Account" } 
						]
};




