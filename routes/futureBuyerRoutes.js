const express = require("express");
const router = express.Router();

const Buyer = require("../models/Buyer");
const { isLoggedIn } = require("../middleware/auth");

router.get(
"/dashboard/future",
isLoggedIn,
async (req,res)=>{

const buyers = await Buyer.find({

    tenantId:req.session.tenantId,
    currentOwnerRole:"PreSales",
    status: "Future Prospects"

}).lean();

res.render("futurebuyers", {
    buyers,

    search: "",
    status: "",
    transactionType: "",

    executives: [],

    imported: 0,
    phoneCall: 0,
    qualified: 0,
    contacted: 0,
    followUp: 0,
    siteVisit: 0,
    negotiation: 0,
    transaction: 0,
    lost: 0,
    notResponding: 0
});

});

module.exports = router;