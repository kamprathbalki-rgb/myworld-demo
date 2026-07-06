const MatchConfig = require('../models/MatchConfig')

function getDistance(lat1, lon1, lat2, lon2) {

const R = 6371

const dLat = (lat2 - lat1) * Math.PI / 180
const dLon = (lon2 - lon1) * Math.PI / 180

const a =
Math.sin(dLat / 2) * Math.sin(dLat / 2) +
Math.cos(lat1 * Math.PI / 180) *
Math.cos(lat2 * Math.PI / 180) *
Math.sin(dLon / 2) * Math.sin(dLon / 2)

const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

return R * c

}

async function calculateScore(property, buyer) {

const config = await MatchConfig.findOne({
tenantId: buyer.tenantId
})

/*
Fallback default config
Used if MatchConfig record does not exist
*/

const defaultConfig = {
weights: {
price: 20,
bedrooms: 20,
area: 20,
distance: 15
},
extras: []
}

const finalConfig = config || defaultConfig

let score = 0

/*
Find matching flat configuration
based on buyer requiredFlatType
*/

let matchedConfig = null

if (property.propertyMode === 'SINGLE') {

    if (property.singleFlatType !== buyer.requiredFlatType) {
        return 0
    }

}
else {

    matchedConfig = property.configurations.find(c =>
        c.flatType === buyer.requiredFlatType
    )

    if (!matchedConfig) {
        return 0
    }

}

/*
PRICE MATCH
Use quotedPrice from configuration
*/

const propertyPrice =
property.propertyMode === 'SINGLE'
? property.singleQuotedPrice
: matchedConfig.quotedPrice

if (
propertyPrice >= buyer.minBudget &&
propertyPrice <= buyer.maxBudget
) {
score += finalConfig.weights.price
}

/*
FLAT TYPE MATCH
Replacement for old bedrooms logic
*/

const propertyFlatType =
property.propertyMode === 'SINGLE'
? property.singleFlatType
: matchedConfig.flatType

if (propertyFlatType === buyer.requiredFlatType) {
score += finalConfig.weights.bedrooms
}

/*
AREA MATCH
Use carpetArea from configuration
*/

const propertyArea =
property.propertyMode === 'SINGLE'
? property.singleCarpetArea
: matchedConfig.carpetArea

if (
propertyArea >= buyer.minArea &&
propertyArea <= buyer.maxArea
) {
score += finalConfig.weights.area
}


/*
POSSESSION MATCH
*/

if (
buyer.requiredPossession &&
buyer.requiredPossession.length > 0 &&
buyer.requiredPossession.includes(property.possessionStatus)
) {
score += 15
}


/*
LOCATION MASTER MATCHING
Very important
*/

/*
Exact officeName match
Highest priority
*/

if (
buyer.preferredLocations &&
buyer.preferredLocations.includes(property.propertyLocation)
) {
score += 20
}

/*
Pincode match
*/

if (
buyer.preferredPincodes &&
buyer.preferredPincodes.includes(property.pincode)
) {
score += 15
}

/*
Division match
*/

if (
buyer.preferredDivisionNames &&
buyer.preferredDivisionNames.includes(property.divisionName)
) {
score += 10
}

/*
District match
*/

if (
buyer.preferredDistricts &&
buyer.preferredDistricts.includes(property.district)
) {
score += 5
}

/*
Optional Geo Distance Match
Keep old geo logic also
*/

if (
property.location &&
buyer.preferredLocation &&
buyer.preferredLocation.coordinates &&
buyer.preferredLocation.coordinates.length === 2
) {

const pLat = property.location.coordinates[1]
const pLng = property.location.coordinates[0]

const bLat = buyer.preferredLocation.coordinates[1]
const bLng = buyer.preferredLocation.coordinates[0]

if (
pLat !== undefined &&
pLng !== undefined &&
bLat !== undefined &&
bLng !== undefined
) {

const dist = getDistance(pLat, pLng, bLat, bLng)

if (dist <= 1) {
score += finalConfig.weights.distance
}
else if (dist <= 3) {
score += finalConfig.weights.distance * 0.75
}
else if (dist <= 5) {
score += finalConfig.weights.distance * 0.5
}

}

}

/*
EXTRAS
Project level comparison
*/

finalConfig.extras.forEach(e => {

if (property[e.field] && buyer[e.field]) {

if (property[e.field] === buyer[e.field]) {
score += e.weight
}

}

})

return score

}

module.exports = calculateScore