const express = require('express');
const _ = require('lodash');
const Response = require('../models/Response.model');
const { check, validationResult } = require('express-validator');
const { validateToken } = require('../middlewares/jwt-auth.middleware');
const { storeExists } = require('../middlewares/stores.middleware');
const { model: Store, fillable, updatable } = require('../models/Store.model');
const regex = require('../utils/regex');
const constants = require('../utils/constants');

const app = express();

app.get('/stores', [validateToken, storeExists], (req, res) => {
    if (!req.store) return res.status(404).json(new Response(true, null, null));

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

    if (req.store) return res.status(400).json(new Response(false, null, { message: 'The user already has a store associated.' }));
    
    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    const body = _.pick(req.body, fillable);
    body.user = req.user.id;

    const newStore = new Store(body);

    newStore.save((err, result) => {
        if (err) return res.status(500).json(new Response(false, null, err));

        return res.status(201).json(new Response(true, result, null));
    });
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
    if (!req.store) return res.status(404).json(new Response(false, null, { message: 'User does not possess a store.' }));

    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array));

    const body = _.pick(req.body, updatable);

    Store.updateOne(
        { _id: req.store._id, active: true },
        body,
        { new: true, runValidators: true },
        (err, updated) => {
            if (err) return res.status(500).json(new Response(false, null, err));

            if (!updated) return res.status(400).json(new Response(false, null, { message: 'Store not found or user does not possess a store.' }));
    
            return res.json(new Response(true, updated, null));
        }
    );
});

app.delete('/stores', [validateToken, storeExists], (req, res) => {
    if (!req.store) return res.status(404).json(new Response(false, null, { message: 'User does not possess a store.' }));

    Store.updateOne(
        { _id: req.store._id, active: true },
        { active: false },
        { new: true },
        (err, deleted) => {
            if (err) return res.status(500).json(new Response(false, null, err));

            if (!deleted) return res.status(400).json(new Response(false, null, { message: 'Store not found or already disabled.' }));

            return res.json(new Response(true, deleted, null));
        }
    );
});

module.exports = app;