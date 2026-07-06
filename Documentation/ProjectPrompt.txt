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
D:\MyWorld

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

D:\MyWorld

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
