require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const csv = require("csv-parse/sync");

const TENANT_ID = new mongoose.Types.ObjectId(
    "6a5f19d85afaa1d9e6edca52"
);

function clean(v) {
    if (!v) return undefined;
    return String(v).trim();
}

function splitGroups(v) {
    if (!v) return [];
    return String(v)
        .split("//")
        .map(x => x.trim())
        .filter(Boolean);
}

function parseNumbers(v) {
    if (!v) return [];

    return String(v)
        .split(",")
        .map(x => parseFloat(x.replace(/[^\d.]/g, "")))
        .filter(x => !isNaN(x));
}

function buildConfigurations(flatTypes, carpets, prices, parking) {

    const configs = [];

    const typeGroups = splitGroups(flatTypes);
    const carpetGroups = splitGroups(carpets);
    const priceGroups = splitGroups(prices);

    typeGroups.forEach((type, i) => {

        const areas = parseNumbers(carpetGroups[i]);
        const vals = parseNumbers(priceGroups[i]);

        areas.forEach((area, j) => {

            const cfg = {
                flatType: type.includes("BHK") ? type : type + " BHK",
                carpetArea: area,
                availableUnits: 0
            };

            if (vals[j] != null)
                cfg.quotedPrice = vals[j];

            if (parking && /CP/i.test(parking))
                cfg.parkingType = ["Covered"];

            configs.push(cfg);

        });

    });

    return configs;

}

(async () => {

    await mongoose.connect(process.env.DB_URI);

    const csvFile = fs.readFileSync("Book1.csv","utf8");

    const rows = csv.parse(csvFile,{
        columns:true,
        skip_empty_lines:true
    });

    const output=[];

    for(const row of rows){

        output.push({

            tenantId:TENANT_ID,

            projectName:clean(row["PROJECT NAME"]),

            builderName:clean(row["BUILDER / DEVELOPERS FIRM NAME"]),

            transactionType:"SALE",

            propertyStatus:"Available",

            propertyMode:"PROJECT",

            city:"Pune",

            stateName:"Maharashtra",

            propertyLocation:"Bhugaon B.O",

            projectType:["Residential"],

            propertyType:["Apartment"],

            locationLandmark:clean(row["LANDMARK"]),

            amenities: clean(row["AMENITIES"])
                ? [clean(row["AMENITIES"])]
                : [],

            configurations:buildConfigurations(
                row["FLAT TYPE"],
                row["CARPET IN SQ FT"],
                row["QUOTING PRICE"],
                row["PARKING"]
            )

        });

    }

    const text =
`db.properties.insertMany(
${JSON.stringify(output,null,4)}
);`;

    fs.writeFileSync("importProjects.js",text);

    console.log("Done.");

    await mongoose.disconnect();

})();