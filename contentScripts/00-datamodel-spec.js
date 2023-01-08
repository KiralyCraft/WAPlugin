// We consider the firt property of a concept to be a primary key

var DataModel = {
		"Account" : ["Account Name", "Phone", "Fax", "Website", "Parent Account", "Ticker Symbol",
					 "Address", "Primary Contact", "Description", "Industry", "SIC Code", "Ownership"],
		"Contact" : ["Full Name", "Job Title", "Account Name", "Email", "Business Phone", "Mobile Phone",
					"Fax", "Preferred Method of Contact", "Address", "Gender", "Marital Status",
					"Spouse/Partner Name", "Birthday", "Anniversary", "Personal Notes", "Company",
					"Originating Lead", "Last Campaign Date", "Marketing Materials", "Contact Method",
					"Email", "Bulk Email", "Phone", "Fax", "Mail"],
		"ForeignKeys" : [ { ForeignKey : "Company", ForeignTable : "Contact", PrimaryKey : "Account Name", PrimaryTable : "Account" } 
						]
};

