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

app.get('/admin/stores/:enabled', [validateToken, isAdmin], [
    check('enabled')
        .notEmpty().trim().isBoolean()
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    const conditions = req.params.enabled !== '' && req.params.enabled !== null && req.params.enabled !== undefined
        ? { enabled: Boolean(req.params.enabled), active: true } 
        : { active: true };

    Store.find(conditions, (err, stores) => {
        if (err) return res.status(400).json(new Response(false, null, err));

        if (!stores.length) return res.status(404).json(new Response(false, null, { message: msg.storesNotFound }));

        return res.json(new Response(true, stores, null));
    });
});

app.put('/admin/stores/:id', [
    validateToken,
    isAdmin,
    check('id')
        .notEmpty().trim().isMongoId()
], (req, res) => {
    Store.updateOne(
        { _id: req.params.id, active: true, enabled: false },
        { enabled: true },
        (err, updated) => {
            if (err) return res.status(400).json(new Response(false, null, err));

            if (updated.nModified <= 0) return res.status(400).json(new Response(false, null, { message: msg.adminStoresAlreadyEnabled }));

            Store.findOne({ _id: req.params.id, active: true, enabled: true }, (err, store) => {
                if (err) return res.status(400).json(new Response(false, null, err));

                return res.json(new Response(true, store, null));
            });
        }
    );
});

app.delete('/admin/stores/:id', [
    validateToken,
    isAdmin,
    check('id')
        .notEmpty().trim().isMongoId()
], (req, res) => {
    Store.updateOne(
        { _id: req.params.id, active: true, enabled: true },
        { enabled: false },
        (err, updated) => {
            if (err) return res.status(400).json(new Response(false, null, err));

            if (updated.nModified <= 0) return res.status(400).json(new Response(false, null, { message: msg.adminStoresAlreadyDisabled }));

            Store.findOne({ _id: req.params.id, active: true, enabled: false }, (err, store) => {
                if (err) return res.status(400).json(new Response(false, null, err));

                return res.json(new Response(true, store, null));

                // Product.update(
                //     { store: store._id },
                //     { active: false },
                //     (err, updatedProducts) => {
                //         if (err) return res.status(400).json(new Response(false, null, err));

                //         Coupon.update(
                //             { store: store._id },
                //             { active: false },
                //             (err, updatedCoupons) => {
                //                 if (err) return res.status(400).json(new Response(false, null, err));

                                
                //             }
                //         );
                //     }
                // );
            });            
        }
    );
});

module.exports = app;