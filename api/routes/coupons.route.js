const express = require('express');
const _ = require('lodash');
const Response = require('../models/Response.model');
const Err = require('../models/Error.model');
const { validateToken } = require('../middlewares/jwt-auth.middleware');
const { storeExists } = require('../middlewares/stores.middleware');
const { model: Coupon, fillable, updatable } = require('../models/Coupon.model');
const { check, validationResult } = require('express-validator');
const constants = require('../utils/constants');
const regex = require('../utils/regex');
const msg = require('../utils/messages');

const app = express();

app.get('/coupons', [validateToken, storeExists], async (req, res) => {
    if (!req.store) return res.json(new Response(false, null, { message: msg.userLacksStore }));

    try {
        const coupons = await Coupon.find({ active: true, enabled: true })
            .populate('store')
            .catch(err => { throw err; });

        if (!coupons.length) return res.json(new Response(false, null, { message: msg.couponsNotFound }));

        return res.json(new Response(true, coupons, null));
    } catch (err) {
        return res.json(new Response(false, null, new Err(err)));
    }
});

app.get('/coupons/:name', [
    check('name')
        .notEmpty().trim()
        .isLength({ min: constants.namesMinLength, max: constants.namesMaxLength })
        .matches(regex.couponNames)
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.json(new Response(false, null, errors.array()));

    try {
        const coupon = await Coupon.findOne({ name: req.params.name, active: true, enabled: true })
            .populate('store')
            .catch(err => { throw err; });

        if (!coupon) return res.json(new Response(false, null, { message: msg.couponNotFound }));

        return res.json(new Response(true, coupon, null));
    } catch (err) {
        return res.json(new Response(false, null, new Err(err)));
    }
});

app.post('/coupons', [
    validateToken,
    storeExists,
    check('name')
        .notEmpty().trim()
        .isLength({ min: constants.namesMinLength, max: constants.namesMaxLength })
        .matches(regex.couponNames),
    check('expiration')
        .notEmpty().trim().isISO8601().toDate(),
    check('value')
        .notEmpty().trim().isFloat({ min: constants.minDiscount, max: constants.maxPrice }),
    check('percentage')
        .if(check('percentage').notEmpty())
        .isBoolean()
], async (req, res) => {
    if (!req.store) return res.json(new Response(false, null, { message: msg.userLacksStore }));

    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.json(new Response(false, null, errors.array()));

    try {
        const body = _.pick(req.body, fillable);
        body.store = req.store._id;

        if (body.percentage && body.value > 100) body.value = 100;

        const result = await Coupon.findOne({ name: body.name, store: req.store._id, enabled: true, active: true })
            .catch(err => { throw err; });

        if (result) return res.json(new Response(false, null, { message: msg.couponExists }));

        const newCoupon = new Coupon(body);

        const coupon = await newCoupon.save()
            .catch(err => { throw err; });

        return res.json(new Response(true, coupon, null));
    } catch (err) {
        return res.json(new Response(false, null, new Err(err)));
    }
});

app.put('/coupons/:id', [
    validateToken,
    storeExists,
    check('id')
        .notEmpty().trim().isMongoId(),
    check('name')
        .if(check('name').notEmpty())
        .trim().isLength({ min: constants.namesMinLength, max: constants.namesMaxLength })
        .matches(regex.couponNames),
    check('expiration')
        .if(check('expiration').notEmpty())
        .trim().isISO8601().toDate(),
    check('value')
        .if(check('expiration').notEmpty())
        .trim().isFloat({ min: constants.minDiscount, max: constants.maxPrice }),
    check('percentage')
        .if(check('percentage').notEmpty())
        .isBoolean()
], async (req, res) => {
    if (!req.store) return res.json(new Response(false, null, { message: msg.userLacksStore }));

    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.json(new Response(false, null, errors.array()));

    try {
        const body = _.pick(req.body, updatable);

        if (body.percentage && body.value > 100) body.value = 100;

        const result = await Coupon.findOne({ name: body.name, store: req.store._id, active: true, enabled: true })
            .catch(err => { throw err; });

        if (result) return res.json(new Response(false, null, { message: msg.couponExists }));

        body.updatedAt = new Date(Date.now());

        const updated = await Coupon.updateOne({ _id: req.params.id, store: req.store._id, active: true, enabled: true }, body, { runValidators: true })
            .catch(err => { throw err; });

        if (!updated.nModified) return res.json(new Response(false, null, { message: msg.couponUpdateFailed }));

        const coupon = await Coupon.findOne({ _id: req.params.id, store: req.store._id, active: true, enabled: true })
            .populate('store')
            .catch(err => { throw err; });

        return res.json(new Response(true, coupon, null));
    } catch (err) {
        return res.json(new Response(false, null, new Err(err)));
    }
});

app.delete('/coupons/:id', [
    validateToken,
    storeExists,
    check('id')
        .notEmpty().trim().isMongoId()
], async (req, res) => {
    if (!req.store) return res.json(new Response(false, null, { message: msg.userLacksStore }));

    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.json(new Response(false, null, errors.array()));

    try {
        const coupon = await Coupon.findOne({ _id: req.params.id, store: req.store._id, active: true, enabled: true })
            .populate('store')
            .catch(err => { throw err; });

        if (!coupon) return res.json(new Response(false, null, { message: msg.couponNotFound }));

        const deleted = await Coupon.updateOne({ _id: req.params.id, store: req.store._id, active: true, enabled: true }, { active: false })
            .catch(err => { throw err; });

        if (!deleted.nModified) return res.json(new Response(false, null, { message: msg.couponAlreadyDisabled }));

        coupon.active = false;

        return res.json(new Response(true, coupon, null));
    } catch (err) {
        return res.json(new Response(false, null, new Err(err)));
    }
});

module.exports = app;