const express = require('express');
const { check, validationResult } = require('express-validator');
const Response = require('../../models/Response.model');
const { model: Store } = require('../../models/Store.model');
const { model: Product } = require('../../models/Product.model');
const { model: Coupon } = require('../../models/Coupon.model');
const { validateToken } = require('../../middlewares/jwt-auth.middleware');
const { isAdmin } = require('../../middlewares/auth.middleware');
const msg = require('../../utils/messages');

const app = express();

app.get('/admin/stores', [validateToken, isAdmin], async (req, res) => {
    try {
        const stores = await Store.find();

        if (!stores.length) {
            return res.status(404).json(new Response(false, null, { message: msg.storesNotFound }));
        }

        return res.json(stores);
    } catch (err) {
        return res.status(400).json(new Response(false, null, err));
    }
});

app.put('/admin/stores/:id', [
    validateToken,
    isAdmin,
    check('id')
        .notEmpty().trim().isMongoId()
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    try {
        const updated = await Store.updateOne({ _id: req.params.id, active: true, enabled: false }, { enabled: true });

        if (!updated.nModified) {
            return res.status(400).json(new Response(false, null, { message: msg.adminStoresAlreadyEnabled }));
        }

        const store = await Store.findOne({ _id: req.params.id, active: true, enabled: true });

        return res.json(new Response(true, store, null));
    } catch (err) {
        return res.status(400).json(new Response(false, null, err));
    }
});

app.delete('/admin/stores/:id', [
    validateToken,
    isAdmin,
    check('id')
        .notEmpty().trim().isMongoId()
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));
    
    try {
        const updated = await Store.updateOne({ _id: req.params.id, active: true, enabled: true }, { enabled: false });

        if (!updated.nModified) {
            return res.status(400).json(new Response(false, null, { message: msg.adminStoresAlreadyDisabled }));
        }

        const store = await Store.findOne({ _id: req.params.id, active: true, enabled: false });

        const updatedProducts = await Product.updateMany({ store: store._id }, { active: false });

        const updatedCoupons = await Coupon.updateMany({ store: store._id }, { active: false });

        return res.json(new Response(true, store, null));
    } catch (err) {
        return res.status(400).json(new Response(false, null, err));
    }
});

module.exports = app;