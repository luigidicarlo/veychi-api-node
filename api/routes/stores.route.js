const express = require('express');
const _ = require('lodash');
const Store = require('../models/Store.model');
const { body, validationResult } = require('express-validator');
const { validateToken } = require('../middlewares/jwt-auth.middleware');
const { storeExists } = require('../middlewares/stores.middleware');
const { fillable, updatable } = require('../models/Store.model');
const regex = require('../utils/regex');

const app = express();

app.get('/stores', [validateToken, storeExists], (req, res) => {
    if (!req.store) return res.status(404).json('No store found.');

    return res.json(req.store);
});

app.post('/stores', [
    validateToken,
    storeExists,
    body('name')
        .notEmpty()
        .trim().matches(regex.storeNames),
    body('imageUrl')
        .if(body('imageUrl').notEmpty())
        .trim().isURL(),
    body('rut')
        .notEmpty()
        .trim().matches(regex.rut),
    body('activity')
        .notEmpty()
        .trim().isAlpha()
], (req, res) => {
    if (req.store) return res.status(403).json('The user already has a store associated.');

    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(errors.array());

    const body = _.pick(req.body, fillable);
    body.user = req.user.id;

    const newStore = new Store(body);

    newStore.save((err, result) => {
        if (err) return res.status(500).json(err);

        return res.status(201).json(result);
    });
});

app.put('/stores', [
    validateToken,
    storeExists,
    body('name')
        .if(body('name').notEmpty())
        .matches(regex.storeNames),
    body('imageUrl')
        .if(body('imageUrl').notEmpty())
        .isURL(),
    body('activity')
        .if(body('activity').notEmpty())
        .isAlpha(),
    body('rut')
        .if(body('rut').notEmpty())
        .matches(regex.rut)
], (req, res) => {
    if (!req.store) return res.status(404).json('No store found.');

    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(422).json(errors.array);

    const body = _.pick(req.body, updatable);

    Store.findByIdAndUpdate(req.store._id, body, { new: true }, (err, updated) => {
        if (err) return res.status(500).json(err);

        return res.json(updated);
    });
});

app.delete('/stores', [validateToken, storeExists], (req, res) => {
    if (!req.store) return res.status(404).json('No store found.');

    Store.findByIdAndDelete(req.store._id, (err, deleted) => {
        if (err) return res.status(500).json(err);

        return res.json(deleted);
    });
});

module.exports = app;