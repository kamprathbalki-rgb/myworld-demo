const Property = require('../models/Property')

async function getSimilarProperties(property){

/*
Use first configuration as reference
for similarity comparison
*/

if(
!property.configurations ||
property.configurations.length === 0
){
return []
}

const baseConfig = property.configurations[0]

const minPrice = baseConfig.quotedPrice * 0.8
const maxPrice = baseConfig.quotedPrice * 1.2

const minArea = baseConfig.carpetArea * 0.8
const maxArea = baseConfig.carpetArea * 1.2

const properties = await Property.find({

_id: { $ne: property._id },

city: property.city,

configurations: {
$elemMatch: {

flatType: baseConfig.flatType,

quotedPrice: {
$gte: minPrice,
$lte: maxPrice
},

carpetArea: {
$gte: minArea,
$lte: maxArea
}

}
}

})

return properties

}

module.exports = getSimilarProperties