const express = require("express");
const router = express.Router();

const marketplaceMatchService = require("../services/marketplaceMatchService");

router.get("/buyer/:buyerId", async (req, res, next) => {

    try {

        const matches =
            await marketplaceMatchService.getMarketplaceMatches(
                req.params.buyerId,
                req.session.tenantId
            );

        res.render("marketplaceMatches", {
            matches
        });

    } catch (err) {
        next(err);
    }

});

module.exports = router;