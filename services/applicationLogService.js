const ApplicationLog =
require("../models/ApplicationLog");

async function logActivity(data){

    try{

        await ApplicationLog.create(data);

    }catch(err){

        console.log(
            "APPLICATION LOG ERROR:",
            err.message
        );

    }

}

module.exports = logActivity;