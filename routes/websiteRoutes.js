const express = require('express');
const router = express.Router();
const Tenant = require('../models/Tenant')

router.get('/', (req, res) => {
    res.render('welcome');
});

router.get('/:tenant', async (req, res, next) => {

    const parts = req.params.tenant.split('.');

    // If the URL is not in the format company.TENANTCODE,
    // let Express continue to the next matching route.
    if (parts.length !== 2) {
        return next();
    }

    const companyName = parts[0];
    const tenantCode = parts[1];

    const tenant = await Tenant.findOne({
        tenantCode: tenantCode.toUpperCase()
    });

    if (!tenant) {
        return res.status(404).send('Company not found');
    }

    res.render('website/home', {
        tenant
    });

});

module.exports = router;