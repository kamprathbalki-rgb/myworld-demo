const logActivity =
require("../services/applicationLogService");

module.exports = async function(req,res,next){

    if(req.session.executiveId){

        return next();

    }

    await logActivity({

        tenantId: req.session?.tenantId || null,

        userType: "Executive",

        userId: null,

        userName: req.session?.executiveName || "",

        action: "SESSION_EXPIRED",

        sessionId: req.sessionID,

        remarks: "Session missing"

    });

    return res.redirect("/executive/login");

};