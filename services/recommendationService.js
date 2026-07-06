const Buyer = require('../models/Buyer')
const Recommendation = require('../models/Recommendation')
const calculateScore = require('./matchService')

async function generateRecommendations(property) {

    const buyers = await Buyer.find({
        tenantId: property.tenantId
    })

    for (const buyer of buyers) {

        const score = await calculateScore(property, buyer)

        if (score >= 50) {

            await Recommendation.create({
                buyerId: buyer._id,
                propertyId: property._id,
                tenantId: property.tenantId,
                score: score
            })

        }
    }
}

module.exports = generateRecommendations