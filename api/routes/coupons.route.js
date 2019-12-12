const express = require('express');
const _ = require('lodash');
const Response = require('../models/Response.model');
const { validateToken } = require('../middlewares/jwt-auth.middleware');
const { storeExists } = require('../middlewares/stores.middleware');
const { model: Coupon, fillable, updatable } = require('../models/Coupon.model');
const { check, validationResult } = require('express-validator');
const constants = require('../utils/constants');
const regex = require('../utils/regex');

const app = express();

app.get('/coupons', [validateToken, storeExists], (req, res) => {
    if (!req.store) return res.status(401).json(new Response(false, null, { message: 'User does not possess a store.' }));

    Coupon.find({ active: true }, (err, coupons) => {
        if (err) return res.status(500).json(new Response(false, null, err));
        
        if (!coupons || coupons.length <= 0) return res.status(404).json(new Response(false, null, { message: 'Coupons not found.' }));

        return res.json(new Response(true, coupons, null));
    });
});

app.get('/coupons/:name', [
    check('name')
        .notEmpty().trim()
        .isLength({ min: constants.namesMinLength, max: constants.namesMaxLength })
        .matches(regex.couponNames)
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));
    
    Coupon.findOne({ name: req.params.name }, (err, coupon) => {
        if (err) return res.status(500).json(new Response(false, null, err));

        if (!coupon) return res.status(404).json(new Response(false, null, { message: 'Coupon not found.' }));

        return res.json(coupon);
    });
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
], (req, res) => {
    if (!req.store) return res.status(401).json(new Response(false, null, { message: 'User does not possess a store.' }));

    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    const body = _.pick(req.body, fillable);

    if (body.percentage && body.value > 100) body.value = 100;

    const newCoupon = new Coupon(body);

    newCoupon.save((err, coupon) => {
        if (err) return res.status(500).json(new Response(false, null, err));

        return res.status(201).json(new Response(true, coupon, null));
    });
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
], (req, res) => {
    if (!req.store) return res.status(401).json(new Response(false, null, { message: 'User does not possess a store.' }));

    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    const body = _.pick(req.body, updatable);

    if (body.percentage && body.value > 100) body.value = 100;

    Coupon.updateOne(
        { _id: req.params.id, active: true },
        body,
        (err, updated) => {
            if (err) return res.status(500).json(new Response(false, null, err));

            if (updated.nModified <= 0) return res.status(400).json(new Response(false, null, { message: 'Coupon not found or impossible to update.' }));

            return res.json(new Response(true, updated, null));
        }
    );
});

app.delete('/coupons/:id', [
    validateToken,
    storeExists,
    check('id')
        .notEmpty().trim().isMongoId()
], (req, res) => {
    if (!req.store) return res.status(401).json(new Response(false, null, { message: 'User does not possess a store.' }));

    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    Coupon.updateOne(
        { _id: req.params.id, active: true },
        { active: false },
        (err, deleted) => {
            if (err) return res.status(500).json(new Response(false, null, err));

            if (deleted.nModified <= 0) return res.status(400).json(new Response(false, null, { message: 'Coupon not found or already disabled.' }));

            return res.json(new Response(true, deleted, null));
        }
    );
});

module.exports = app;