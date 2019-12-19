const express = require('express');
const _ = require('lodash');
const Response = require('../models/Response.model');
const { check, validationResult } = require('express-validator');
const { validateToken } = require('../middlewares/jwt-auth.middleware');
const { storeExists } = require('../middlewares/stores.middleware');
const { model: Store, fillable, updatable } = require('../models/Store.model');
const { model: Coupon } = require('../models/Coupon.model')
const { model: Product } = require('../models/Product.model')
const regex = require('../utils/regex');
const constants = require('../utils/constants');
const msg = require('../utils/messages');

const app = express();

app.get('/stores', [validateToken, storeExists], (req, res) => {
    if (!req.store) return res.status(404).json(new Response(false, null, { message: msg.userLacksStore }));

    return res.json(new Response(true, req.store, null));
});

app.post('/stores', [
    validateToken,
    storeExists,
    check('name')
        .notEmpty()
        .trim().isLength({ min: constants.namesMinLength, max: constants.namesMaxLength })
        .matches(regex.storeNames),
    check('description')
        .if(check('description').notEmpty())
        .trim().isLength({ min: constants.namesMinLength, max: constants.namesMaxLength }),
    check('imageUrl')
        .if(check('imageUrl').notEmpty())
        .trim().isURL(),
    check('rut')
        .notEmpty()
        .trim().matches(regex.rut),
    check('activity')
        .notEmpty()
        .trim().isLength({ min: constants.namesMinLength, max: constants.namesMaxLength })
], (req, res) => {
    const errors = validationResult(req);

    if (req.store) return res.status(400).json(new Response(false, null, { message: msg.storeUserAlreadyExists }));

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    const body = _.pick(req.body, fillable);
    body.user = req.user.id;

    Store.findOne(
        {
            $or: [
                { name: body.name },
                { rut: body.rut }
            ],
            active: true
        },
        (err, result) => {
            if (err) return res.status(400).json(new Response(false, null, err));

            if (result) return res.status(400).json(new Response(false, null, { message: msg.storeExists }));

            const newStore = new Store(body);

            newStore.save((err, result) => {
                if (err) return res.status(400).json(new Response(false, null, err));

                return res.status(201).json(new Response(true, result, null));
            });
        }
    );
});

app.put('/stores', [
    validateToken,
    storeExists,
    check('name')
        .if(check('name').notEmpty())
        .trim().isLength({ min: constants.namesMinLength, max: constants.namesMaxLength })
        .matches(regex.storeNames),
    check('description')
        .if(check('description').notEmpty())
        .trim().isLength({ min: constants.namesMinLength, max: constants.namesMaxLength }),
    check('imageUrl')
        .if(check('imageUrl').notEmpty())
        .trim().isURL(),
    check('rut')
        .if(check('rut').notEmpty())
        .trim().matches(regex.rut),
    check('activity')
        .if(check('activity').notEmpty())
        .trim().isLength({ min: constants.namesMinLength, max: constants.namesMaxLength })
], (req, res) => {
    if (!req.store) return res.status(404).json(new Response(false, null, { message: msg.userLacksStore }));

    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    const body = _.pick(req.body, updatable);

    Store.findOne(
        {
            $or: [
                { name: body.name },
                { rut: body.rut }
            ],
            active: true
        },
        (err, result) => {
            if (err) return res.status(400).json(new Response(false, null, err));

            if (result) return res.status(400).json(new Response(false, null, { message: storeExists }));

            Store.updateOne(
                { _id: req.store._id, active: true },
                body,
                { runValidators: true },
                (err, updated) => {
                    if (err) return res.status(400).json(new Response(false, null, err));

                    if (!updated) return res.status(400).json(new Response(false, null, { message: msg.storeUpdateFailed }));

                    Store.findOne({ _id: req.store._id, active: true }, (err, store) => {
                        if (err) return res.status(400).json(new Response(false, null, err));

                        return res.json(new Response(true, store, null));
                    });
                }
            );
        }
    );
});

app.delete('/stores', [validateToken, storeExists], async (req, res) => {
    if (!req.store) return res.status(404).json(new Response(false, null, { message: 'User does not possess a store.' }));

    try {
        const deleted = await Store.updateOne({ _id: req.store._id, active: true }, { active: false });

        if (!deleted.nModified) {
            return res.status(400).json(new Response(false, null, { message: msg.storeAlreadyDisabled }));
        }

        const updatedProducts = await Product.updateMany({ store: req.store._id }, { active: false });
        const updatedCoupons = await Coupon.updateMany({ store: req.store._id }, { active: false });
        const store = await Store.findOne({ _id: req.store._id, active: false });

        return res.json(new Response(true, store, null));
    } catch (error) {
        return res.status(400).json(new Response(false, null, error));
    }
});

module.exports = app;