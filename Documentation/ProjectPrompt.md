I am building a **Real Estate CRM and Property Matching Web Application**.

Tech stack:

* Node.js
* Express.js
* MongoDB (local)
* Mongoose
* EJS templates
* Bootstrap (mobile responsive)
* Leaflet.js or Google Maps later

Project root folder:
D:\\MyWorld

Goal of the application:
Create a mobile-friendly real estate platform that helps brokers manage properties, buyers, property matching, site visits, and sales executive productivity.

Core modules of the system:

1. Property Management

   * Add/Edit/Delete properties
   * Residential / Commercial / Office / Retail / Land
   * Store price, area, bedrooms, floor, furnishing, amenities, images, and geo-location.
2. Buyer Management

   * Capture buyer requirements
   * Budget range
   * Bedrooms
   * Area
   * Amenities
   * Preferred location (Google map pin + radius)
3. Property Matching Engine

   * Automatically return Top 5 properties based on score
   * Score factors:
Budget (30%)
Distance (25%)
Bedrooms (15%)
Area (10%)
Amenities (10%)
Floor preference (10%)
4. Map Based Property Search

   * Find properties within radius (1 km, 2 km, 5 km)
   * MongoDB geospatial queries
5. Property Visit Tracking

   * Buyer
   * Property
   * Sales Executive
   * Visit date
   * Status
   * Feedback
6. Sales Executive Dashboard

   * Leads assigned
   * Visits completed
   * Deals closed
   * Conversion rate

MongoDB collections planned:

* properties
* propertyLocation
* propertyPricing
* propertyFeatures
* propertyAmenities
* propertyMedia
* buyers
* buyerRequirements
* propertyVisits
* salesExecutives

Planned folder structure:

D:\\MyWorld

app.js
config/db.js

models
controllers
routes
services
views
public
middleware

Development plan:

Phase 1

* Node server
* MongoDB connection
* Property CRUD
* Buyer CRUD

Phase 2

* Property search
* Matching engine

Phase 3

* Visit tracking
* Executive dashboard

Phase 4

* Map-based search

I want to build this project **step-by-step starting from project setup** and continue developing each module properly.

Please continue guiding me step-by-step from where we left off.



\# MyWorld Project Prompt



\## Project Overview



MyWorld is a SaaS Real Estate CRM platform built using:



\* Node.js

\* Express.js

\* MongoDB (Mongoose)

\* EJS Templates

\* WhatsApp Web JS

\* PM2



The platform supports multiple tenants (real estate agencies) and a separate SaaS Admin layer.



\---



\# User Preference (Important)



Always provide:



\* One step at a time

\* Exact file name

\* Exact code location

\* Minimal explanation

\* No long theory

\* No stories

\* No large architectural discussions unless requested



Preferred response format:



File:

D:\\MyWorld\\path\\file.js



Find:



```javascript

existing code

```



Replace/Add:



```javascript

new code

```



Restart:



```cmd

pm2 restart myworld

```



\---



\# SaaS Architecture



\## SaaS Admin



Role:



```text

saasadmin

```



Dashboard:



```text

/saas/dashboard

```



Responsibilities:



\* Tenant management

\* Keyword management

\* Platform monitoring

\* Global configuration



\---



\## Agency Admin



Role:



```text

admin

```



Responsibilities:



\* Buyers

\* Properties

\* Visits

\* Executives

\* WhatsApp groups



\---



\## Executive



Role:



```text

executive

```



Responsibilities:



\* Assigned leads

\* Assigned locations

\* Follow-ups

\* Site visits



\---



\# Existing Modules



\## Tenant



Stores agency details.



\---



\## Executive



Important fields:



```javascript

{

&#x20;   tenantId,

&#x20;   name,

&#x20;   mobile,

&#x20;   email,

&#x20;   assignedLocations,

&#x20;   isActive

}

```



Location assignment must remain unique.



One location should not be assigned to multiple executives.



\---



\## Buyer



Supports:



\* Manual creation

\* Excel upload

\* Auto assignment

\* Geo location



Important fields:



```javascript

primaryLocation

preferredLocations

preferredPincodes

preferredDistricts

preferredDivisionNames

assignedExecutiveId

assignedExecutiveName

```



\---



\## Property



Supports:



\* Single Property

\* Project Property



Standardization:



\* Carpet Area = Sq Ft

\* Price = Lakhs



\---



\## Visits



Tracks:



\* Scheduled Visits

\* Site Visits

\* Negotiation

\* Closed Deals



\---



\# WhatsApp Module



\## Current Status



Stable.



Uses:



```text

services/whatsapp.js

services/startWhatsapp.js

```



\---



\## Startup Flow



```text

app.js

&#x20;   ↓

startWhatsapp.js

&#x20;   ↓

whatsapp.js

```



Only one WhatsApp client instance must exist.



\---



\## Critical Rule



Never use:



```javascript

delete require.cache(

...

)

```



for WhatsApp modules.



This creates multiple client instances.



\---



\## PM2



Application Name:



```text

myworld

```



Start:



```cmd

pm2 start app.js --name myworld

```



Restart:



```cmd

pm2 restart myworld

```



Stop:



```cmd

pm2 stop myworld

```



Logs:



```cmd

pm2 logs myworld

```



Status:



```cmd

pm2 status

```



Flush Logs:



```cmd

pm2 flush

```



\---



\# WhatsApp Processing



Current Flow:



```text

Message

&#x20;   ↓

Classification

&#x20;   ↓

Inventory

Requirement

Other

```



Collections:



```text

WhatsappInventory

WhatsappRequirement

WhatsappBroadcast

WhatsappGroup

```



\---



\# Duplicate Prevention



Implemented using:



```text

messageId

```



Unique Index:



```javascript

{

&#x20;   messageId: 1

}

```



with:



```javascript

unique: true

```



\---



\# Keyword System



Master Collection:



```text

KeywordMaster

```



No additional keyword master collections should be created.



\---



\## Keyword Types



Inventory:



```text

available

for sale

lease

on rent

plot

office

warehouse

shop

preleased

bank auction

```



Requirement:



```text

required

requirement

wanted

need

looking for

client requirement

buyer requirement

```



\---



\## SaaS Admin Access



Only SaaS Admin can manage:



```text

/keyword/list

/keyword/add

/keyword/edit

```



\---



\# Completed Work



\## Keyword Module



Completed:



\* List

\* Add

\* Edit

\* Activate

\* Deactivate



\---



\## WhatsApp Module



Completed:



\* Startup isolation

\* PM2 execution

\* Group listing

\* Recovery processing

\* Classification

\* Broadcast storage



\---



\## Executive Module



Completed:



\* Location assignment

\* Duplicate location prevention



\---



\## Buyer Module



Completed:



\* Manual add

\* Edit

\* Excel upload

\* Auto assignment

\* Geo location



\---



\# Immediate Next Roadmap



\## Phase 1



Keyword Driven Classification



Replace hardcoded keyword matching with:



```text

KeywordMaster

```



Flow:



```text

Message

&#x20;   ↓

Load Active Keywords

&#x20;   ↓

Inventory Match

Requirement Match

Other

```



\---



\## Phase 2



Keyword Usage Analytics



Add:



```text

Usage Count

```



for every keyword.



Example:



```text

available      240

for sale       180

bank auction     5

required       120

```



\---



\## Phase 3



Other Message Learning



Analyse:



```text

WhatsappOtherMessages

```



Find recurring terms.



Suggest new keywords.



SaaS Admin approves.



KeywordMaster updates.



\---



\## Phase 4



Data Extraction



Inventory:



Extract:



\* Property Type

\* Location

\* Budget

\* Area

\* BHK



Requirement:



Extract:



\* Requirement Type

\* Budget

\* Location

\* Area



\---



\## Phase 5



Lead Creation



Convert WhatsApp messages into:



```text

Buyer Leads

Property Inventory

```



automatically.



\---



\# Non-Negotiable Rules



\* One WhatsApp client only.

\* One KeywordMaster only.

\* No duplicate location assignment.

\* No hardcoded business keywords once KeywordMaster is active.

\* PM2 must be used for production execution.

\* Always preserve tenant isolation.

\* SaaS logic must remain global.

\* Agency logic must remain tenant-specific.


Rental / Lease Module Completion Summary
Objective

Extend MyWorld Real Estate SaaS platform to support:

SALE Properties
RENT Properties
LEASE Properties

without impacting any existing functionality.

Property Module
Property Model

Added:

transactionType

monthlyRent

securityDeposit

maintenanceCharges

leaseDurationMonths

Supported values:

SALE
RENT
LEASE
Add Property

Updated:

/property/add-single

Added:

Transaction Type
Monthly Rent
Security Deposit
Maintenance Charges
Lease Duration
Edit Property

Updated:

/property/edit/:id

Added support to:

Change Transaction Type
Edit Rental Financial Details
Property Details Page

Updated:

/property/details/:id

Displays:

Transaction Type
Monthly Rent
Security Deposit
Maintenance Charges
Lease Duration

for RENT and LEASE properties.

Property Listing

Updated:

/property/page

Added columns:

Transaction Type
Monthly Rent
Security Deposit
Maintenance Charges

Added filtering by:

SALE
RENT
LEASE
Property Bulk Upload

Updated Excel import.

Added support for:

Transaction Type
Monthly Rent
Security Deposit
Maintenance Charges
Lease Duration
Property Duplicate Logic

Updated duplicate detection.

Duplicate criteria now include:

Owner Mobile
Property Location
Transaction Type

Allowed:

Same Property
SALE

and

Same Property
RENT

Blocked:

Same Property
Same Transaction Type
Buyer Module
Buyer Model

Added:

transactionType

Supported:

SALE
RENT
LEASE
Add Buyer

Updated:

/ buyer / add

Added:

Transaction Type
Edit Buyer

Updated:

/ buyer / edit / :id

Added:

Transaction Type
Buyer Listing

Updated:

/ buyer / page

Added:

Transaction Type

column.

Added filter:

All Transactions
SALE
RENT
LEASE
Buyer Bulk Upload

Updated Excel import.

Added:

TransactionType

validation.

Supported values:

SALE
RENT
LEASE

Invalid values rejected.

Match Engine
Transaction Type Protection

Added:

if (
property.transactionType !==
buyer.transactionType
) {
return 0
}

Prevents:

SALE Buyer ↔ RENT Property
SALE Buyer ↔ LEASE Property
RENT Buyer ↔ SALE Property
LEASE Buyer ↔ SALE Property
Property Fetch Protection

Updated:

/buyer/matches/:buyerId

Only fetches:

transactionType:
buyer.transactionType

matching inventory.

Smart Recommendations

Updated:

/buyer/smart-recommendations/:buyerId

Only fetches matching:

SALE
RENT
LEASE

inventory.

Rental Pricing Logic

Updated score calculation.

Before:

All matches used Quoted Price.

Now:

SALE
→ singleQuotedPrice / quotedPrice

RENT
→ monthlyRent

LEASE
→ monthlyRent

Budget matching now works correctly for rentals.

WhatsApp Module

Status:

Operational

Features working:

QR Authentication
Group Selection
Message Capture
Message Classification
Database Storage
Buyer Notifications
Executive Notifications

No Rental / Lease impact.

Backward Compatibility

Verified:

Existing SALE Inventory
Existing Buyers
Existing Match Engine
Existing Recommendations
Existing WhatsApp Features
Existing Executive Features
Existing Dashboard Features

continue to function.

No breaking changes introduced.

Module Status
Rental / Lease Module
COMPLETE

Version:

MyWorld v1
Rental / Lease Enabled

Ready for:

Data Entry
Bulk Upload
Matching
Recommendations
Production Testing

# MyWorld SaaS - WhatsApp Multi-Tenant Module Status (July 2026)

## Objective

Convert the existing WhatsApp integration from:

```text
One Global WhatsApp Account
        ↓
One Global Message Store
```

to:

```text
Tenant A WhatsApp
Tenant B WhatsApp
Tenant C WhatsApp

Each tenant isolated
```

so that MyWorld functions as a true SaaS platform.

---

# Completed

## 1. Tenant WhatsApp Authentication

Created:

```text
/tenant-whatsapp
/tenant-whatsapp/connect
/tenant-whatsapp/qr
```

Features:

* Tenant-specific QR generation
* Tenant-specific LocalAuth sessions
* Tenant-specific client IDs

Example:

```text
tenant_6a4dd420f864976be508d248
```

Authentication flow working.

Verified:

```text
WHATSAPP AUTHENTICATED
WHATSAPP READY
CLIENT INFO
```

Phone number successfully captured:

```text
919503728537
```

---

## 2. TenantWhatsapp Collection

Collection:

```text
tenantwhatsapps
```

Purpose:

* Store authentication state
* Store phone number
* Store connection details

Fields:

```javascript
tenantId
clientId
phoneNumber
isAuthenticated
lastConnectedAt
```

Status:

```text
WORKING
```

---

## 3. Tenant Group Selection

Collection:

```text
whatsappgroups
```

Confirmed structure:

```javascript
{
    tenantId,
    groupId,
    groupName,
    active
}
```

Tenant ownership already exists.

Status:

```text
WORKING
```

---

## 4. WhatsApp Group Listing

Screen:

```text
/buyer/whatsapp-groups
```

Able to:

* Connect tenant WhatsApp
* Read groups
* Display groups
* Select monitored groups

Status:

```text
WORKING
```

---

## 5. Tenant-Aware Data Model

Confirmed:

```text
WhatsappGroup
```

already stores:

```javascript
tenantId
```

Meaning SaaS foundation already exists.

No redesign required.

---

# Existing Global Collections

Current collections:

```text
whatsappmessages
whatsappinventories
whatsapprequirements
whatsappbroadcasts
```

Current documents contain:

```javascript
groupId
groupName
sender
message
```

Missing:

```javascript
tenantId
```

Therefore current message data is still global.

---

# Current Problem

After migration to tenant authentication:

```text
Tenant WhatsApp connects
Groups load
Messages no longer captured
```

Observed:

```text
No MESSAGE RECEIVED logs
No new WhatsAppMessage records
```

while:

```text
WHATSAPP READY
```

continues to work.

---

# Most Likely Root Cause

Tenant client creation is not automatically restored after server restart.

Current situation:

```text
MongoDB
    stores authenticated tenant

clientManager
    emptied on PM2 restart
```

Result:

```text
Tenant appears connected in DB

but

No active WhatsApp client exists in memory
```

Possible symptom:

```text
Groups page
→ WhatsApp not connected
```

after restart.

---

# Required Next Step

Implement:

```text
restoreSessions()
```

during application startup.

Goal:

```text
PM2 Restart
     ↓
Restore all authenticated tenant clients
     ↓
WHATSAPP READY
     ↓
Message listeners active
```

No manual reconnect.

No manual QR scan.

No manual intervention.

---

# Required Message Storage Upgrade

Add:

```javascript
tenantId
```

to:

```text
WhatsappMessage
WhatsappInventory
WhatsappRequirement
WhatsappBroadcast
```

Source:

```javascript
monitoredGroup.tenantId
```

Result:

```javascript
{
    tenantId,
    groupId,
    groupName,
    sender,
    message
}
```

---

# SaaS Status

## Completed

```text
Tenant Authentication      ✓
Tenant Sessions            ✓
Tenant Phone Numbers       ✓
Tenant Group Ownership     ✓
Tenant Group Selection     ✓
```

## Pending

```text
Session Auto-Restore       ✗
Tenant Message Capture     ✗
Tenant Message Ownership   ✗
Tenant Inventory Ownership ✗
Tenant Requirement Ownership ✗
```

---

# Definition of Done

Module is complete only when:

```text
PM2 Restart
    ↓
Tenant sessions restored
    ↓
Tenant WhatsApp ready
    ↓
Messages received
    ↓
Messages saved with tenantId
    ↓
Inventory saved with tenantId
    ↓
Requirements saved with tenantId
```

with zero manual steps.

# MyWorld – Project Status & Next Module (MSF)

## Project

MyWorld – Multi-Tenant Real Estate CRM & WhatsApp Intelligence Platform

## Current Phase Status: COMPLETED

### Module Completed

**Multi-Tenant WhatsApp Integration & Message Ingestion Engine**

### Objectives Achieved

#### Tenant WhatsApp Architecture

* Migrated from single WhatsApp client architecture to tenant-based architecture.
* Created isolated WhatsApp sessions per tenant.
* Implemented TenantWhatsapp collection.
* Stored tenant-specific WhatsApp session information.
* Enabled automatic session restoration after server restart.

#### WhatsApp Authentication

* QR generation working.
* Authentication persistence working.
* Phone number capture and storage working.
* Session recovery after PM2 restart working.

#### Client Management

* Dynamic tenant client creation implemented.
* Client manager implemented.
* Automatic client restoration on application startup implemented.
* Tenant isolation verified.

#### Group Management

* User can load all WhatsApp groups.
* User can select groups from UI.
* Selected groups stored in WhatsappGroup collection.
* Monitored groups restored after restart.
* Unselected groups ignored.

#### Message Ingestion

* Live WhatsApp message listener operational.
* Recovery processing operational.
* Historical message loading operational.
* Group filtering operational.
* Broadcast handling operational.

#### Multi-Tenant Data Isolation

Implemented tenant isolation across:

* WhatsappMessages
* WhatsappInventories
* WhatsappRequirements
* WhatsappBroadcasts
* WhatsappGroups

All records now store:

* tenantId
* groupId
* groupName
* message metadata

#### Classification Engine

Automatic classification implemented:

* INVENTORY
* REQUIREMENT
* OTHER

Messages automatically routed to:

* whatsappmessages
* whatsappinventories
* whatsapprequirements

#### Validation Completed

Verified using live production messages.

Current tenant statistics:

* Messages: 277+
* Inventories: 169+
* Requirements: 8+

Verified:

* Session restoration
* Live message processing
* Recovery processing
* Tenant filtering
* Group filtering
* Database persistence
* Inventory classification
* Requirement classification

---

## Technical Debt / Future Cleanup

### Low Priority

* Investigate repeated "GROUP COUNT: 60" logs.
* Review node-cron missed execution warning.
* Optimize recovery processing for large message volumes.
* Add recovery batching and throttling.

---

# NEXT MODULE

## WhatsApp AI Extraction Engine

### Goal

Convert unstructured WhatsApp group messages into structured real estate data automatically.

---

## Input

Raw WhatsApp messages such as:

"2 BHK required in Kharadi. Budget 80L. Contact 9876543210."

"Commercial office available in Baner. 2500 sqft. Rent 2L."

---

## Output

Automatically extract:

### Requirements

* Property Type
* Buy / Rent
* Location
* Budget
* Area
* Bedrooms
* Contact Number
* Source Group
* Tenant

Store in:

* whatsapprequirements

---

### Inventory

* Property Type
* Buy / Rent
* Location
* Price
* Area
* Bedrooms
* Contact Number
* Source Group
* Tenant

Store in:

* whatsappinventories

---

## Implementation Plan

### Step 1

Create AI Extraction Service

File:

services/whatsappExtractor.js

Responsibilities:

* Parse message
* Identify property type
* Extract location
* Extract budget
* Extract area
* Extract phone numbers
* Return structured JSON

---

### Step 2

Create Inventory Normalization

Convert variations:

* 2 BHK
* 2BHK
* Two BHK

Into standard format.

---

### Step 3

Create Requirement Normalization

Convert:

* Need
* Looking
* Requirement
* Wanted

Into requirement intent.

---

### Step 4

Create Structured Collections

Enhance:

* WhatsappInventory
* WhatsappRequirement

with normalized fields.

---

### Step 5

Create Matching Engine

Automatically match:

Requirements ↔ Inventory

Based on:

* Location
* Budget
* Property Type
* Area

Store results in:

matchconfigs
recommendations

---

### Step 6

Executive Dashboard

Display:

* New Inventory
* New Requirements
* Auto Matches
* Match Score
* Lead Opportunities

---

## Business Outcome

MyWorld becomes a Real Estate Intelligence Platform instead of merely a CRM.

Flow:

WhatsApp Groups
→ Message Capture
→ AI Extraction
→ Structured Inventory
→ Structured Requirement
→ Auto Matching
→ Executive Notification
→ Revenue Opportunity




