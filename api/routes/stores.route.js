const express = require('express');
const _ = require('lodash');
const Response = require('../models/Response.model');
const Err = require('../models/Error.model');
const { check, validationResult } = require('express-validator');
const { validateToken } = require('../middlewares/jwt-auth.middleware');
const { storeExists } = require('../middlewares/stores.middleware');
const { model: Store, fillable, updatable, onDisabled } = require('../models/Store.model');
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
], async (req, res) => {
    const errors = validationResult(req);

    if (req.store) return res.status(400).json(new Response(false, null, { message: msg.storeUserAlreadyExists }));

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    try {
        const body = _.pick(req.body, fillable);
        body.user = req.user.id;

        const result = await Store.findOne({ $or: [{ name: body.name }, { rut: body.rut }] })
            .catch(err => { throw err; });

        if (result) return res.status(400).json(new Response(false, null, { message: msg.storeExists }));

        const newStore = new Store(body);

        const store = await newStore.save()
            .catch(err => { throw err; });

        return res.status(201).json(new Response(true, store, null));
    } catch (err) {
        return res.status(400).json(new Response(false, null, new Err(err)));
    }
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
], async (req, res) => {
    if (!req.store) return res.status(404).json(new Response(false, null, { message: msg.userLacksStore }));

    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    try {
        const body = _.pick(req.body, updatable);

        const result = await Store.findOne({ $or: [{ name: body.name }, { rut: body.rut }], active: true })
            .catch(err => { throw err; });

        if (result) return res.status(400).json(new Response(false, null, { message: storeExists }));

        const updated = await Store.updateOne({ _id: req.store._id, active: true }, body, { runValidators: true })
            .catch(err => { throw err; });

        if (!updated.nModified) return res.status(400).json(new Response(false, null, { message: msg.storeUpdateFailed }));

        const store = await Store.findOne({ _id: req.store._id, active: true })
            .catch(err => { throw err; });

        return res.json(new Response(true, store, null));
    } catch (err) {
        return res.status(400).json(new Response(false, null, new Err(err)));
    }
});

app.delete('/stores', [validateToken, storeExists], async (req, res) => {
    if (!req.store) return res.status(404).json(new Response(false, null, { message: msg.userLacksStore }));

    console.log(req.store._id);

    try {
        const store = await Store.findOne({ _id: req.store._id, active: true });

        if (!store) return res.status(404).json(new Response(false, null, { message: msg.storeNotFound }));

        const deleted = await Store.updateOne({ _id: req.store._id, active: true }, { active: false });

        if (!deleted.nModified) return res.status(400).json(new Response(false, null, { message: msg.storeAlreadyDisabled }));

        await onDisabled(store._id)
            .catch(err => { throw err; });

        store.active = false;

        return res.json(new Response(true, store, null));
    } catch (error) {
        return res.status(400).json(new Response(false, null, error));
    }
});

module.exports = app;