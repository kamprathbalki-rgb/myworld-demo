const LeadWorkflow = {
    name: "Unqualified Lead Workflow",

    stages: [

        {
            name: "Imported",
            order: 1,
            description: "Lead imported from Excel or external source."
        },

        {
            name: "Phone Call",
            order: 2,
            options: [
                "Answered",
                "Not Reachable",
                "Disconnected",
                "Switched Off",
                "Invalid Number",
                "Not Answering"
            ]
        },

        {
            name: "Qualified",
            order: 3,

            mandatory: [
                "Phone Answered",
                "Name Verified",
                "Phone Verified",
                "Interested"
            ],

            recommended: [
                "Email Verified",
                "WhatsApp Verified",
                "Customer Details Updated"
            ]
        },

        {
            name: "WhatsApp Verification",
            order: 4,
            options: [
                "Phone Number = WhatsApp Number",
                "Different WhatsApp Number",
                "No WhatsApp"
            ]
        },

        {
    name: "Contacted",
    order: 5,

    options: [

        {
            name: "Interested",

            fields: [

                {
                    name: "Preferred Locations",
                    key: "preferredLocations",
                    type: "multi-select",
                    required: true,
                    minSelections: 1,
                    maxSelections: 5
                },

                {
                    name: "Budget",
                    key: "budget",
                    type: "budget",
                    required: true
                },

                {
                    name: "Property Type",
                    key: "propertyType",
                    type: "multi-select",
                    required: true,
                    options: [
                        "Apartment",
                        "Villa",
                        "House",
                        "Plot",
                        "Commercial",
                        "Office",
                        "Retail",
                        "Warehouse",
                        "Industrial"
                    ]
                },

                {
                    name: "Possession Timeline",
                    key: "possessionTimeline",
                    type: "select",
                    required: true,
                    options: [
                        "Immediate",
                        "1 Month",
                        "3 Months",
                        "6 Months",
                        "6+ Months"
                    ]
                }

            ]
        },

        {
            name: "Not Interested"
        },

        {
            name: "Already Bought",

            fields: [

                {
                    name: "Location",
                    key: "boughtLocation",
                    type: "text",
                    required: true
                },

                {
                    name: "Project",
                    key: "boughtProject",
                    type: "text",
                    required: true
                },

                {
                    name: "Purchase Value",
                    key: "purchaseValue",
                    type: "currency",
                    required: true
                }

            ]
        },

        {
            name: "Postponed",

            fields: [

                {
                    name: "Recontact After",
                    key: "postponedPeriod",
                    type: "select",
                    required: true,
                    options: [
                        "1 Month",
                        "3 Months",
                        "6 Months",
                        "6+ Months"
                    ]
                }

            ]
        }

    ]
},

        {
            name: "Follow-Up",
            order: 6,

            options: [
                "Scheduled",
                "Completed",
                "Missed"
            ]
        },

        {
            name: "Site Visit",
            order: 7,

            options: [
                "Scheduled",
                "Completed",
                "No Show"
            ]
        },

        {
            name: "Negotiation",
            order: 8,

            options: [
                "Budget Discussion",
                "Final Negotiation",
                "Documentation"
            ]
        },

        {
            name: "Transaction",
            order: 9,

            options: [
                "Booking Completed",
                "Sale Completed",
                "Dropped"
            ]
        },

        {
            name: "Lost",
            order: 10,

            options: [
                "To Competitor",
                "Budget",
                "Location",
                "Other"
            ]
        },

        {
            name: "Not Responding",
            order: 11,

            options: [
                "3 Attempts",
                "5 Attempts",
                "Long Pending"
            ]
        }
    ],

    customerClassification: {
        name: "Customer",

        options: [
            "Single Agency",
            "Multiple Agency"
        ]
    }
};

module.exports = LeadWorkflow;