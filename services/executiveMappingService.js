const Buyer = require("../models/Buyer");
const Executive = require("../models/Executive");

const {
    allocatePreSalesExecutive,
    allocateSalesExecutive
} = require("./executiveAllocationService");

async function mapBuyerExecutives(
    tenantId,
    primaryLocation
) {

const preSalesExecutive =
    await allocatePreSalesExecutive(
        tenantId,
        primaryLocation
    );

const salesExecutive =
    await allocateSalesExecutive(
        tenantId,
        primaryLocation
    );

    return {

        preSalesExecutiveId:
            preSalesExecutive?._id || null,

        preSalesExecutiveName:
            preSalesExecutive?.name || "",

        salesExecutiveId:
            salesExecutive?._id || null,

        salesExecutiveName:
            salesExecutive?.name || ""

    };

}


async function remapExecutiveTerritory(
    tenantId,
    executiveType,
    locations
) {

    const buyers =
        await Buyer.find({

            tenantId,

            primaryLocation: {
                $in: locations
            }

        });

    for (const buyer of buyers) {

        const mapping =
            await mapBuyerExecutives(

                tenantId,
                buyer.primaryLocation

            );

        buyer.preSalesExecutiveId =
            mapping.preSalesExecutiveId;

        buyer.preSalesExecutiveName =
            mapping.preSalesExecutiveName;

        buyer.salesExecutiveId =
            mapping.salesExecutiveId;

        buyer.salesExecutiveName =
            mapping.salesExecutiveName;

        await buyer.save();

    }

}


module.exports = {

    mapBuyerExecutives,
    remapExecutiveTerritory

};