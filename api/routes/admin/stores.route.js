const express = require('express');
const { check, validationResult } = require('express-validator');
const Response = require('../../models/Response.model');
const Err = require('../../models/Error.model');
const { model: Store, onDisabled, onEnabled } = require('../../models/Store.model');
const { validateToken } = require('../../middlewares/jwt-auth.middleware');
const { isAdmin } = require('../../middlewares/auth.middleware');
const msg = require('../../utils/messages');

const app = express();

app.get('/admin/stores', [validateToken, isAdmin], async (req, res) => {
    try {
        const stores = await Store.find()
            .catch(err => { throw err; });

        if (!stores.length) return res.json(new Response(false, null, { message: msg.storesNotFound }));

        return res.json(new Response(true, stores, null));
    } catch (err) {
        return res.json(new Response(false, null, new Err(err)));
    }
});

app.get('/admin/stores/:id', [validateToken, isAdmin], async (req, res) => {
    const id = +req.params.id;

    try {
        const store = await Store.findById(id).populate().catch(err => { throw err; });

        if (!store) { return res.json(new Response(false, null, msg.storeNotFound)); }

        return res.json(new Response(true, store, null));
    } catch (err) {
        return res.json(new Response(false, null, new Err(err)));
    }
});

app.put('/admin/stores/:id', [
    validateToken,
    isAdmin,
    check('id').notEmpty().trim().isMongoId()
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.json(new Response(false, null, errors.array()));

    try {
        const updated = await Store.updateOne({ _id: req.params.id, active: true, enabled: false }, { enabled: true })
            .catch(err => { throw err; });

        if (!updated.nModified) return res.json(new Response(false, null, { message: msg.adminStoresAlreadyEnabled }));

        await onEnabled(req.params.id)
            .catch(err => { throw err; });

        const store = await Store.findOne({ _id: req.params.id, active: true, enabled: true })
            .catch(err => { throw err; });

        return res.json(new Response(true, store, null));
    } catch (err) {
        return res.json(new Response(false, null, new Err(err)));
    }
});

app.delete('/admin/stores/:id', [
    validateToken,
    isAdmin,
    check('id')
        .notEmpty().trim().isMongoId()
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.json(new Response(false, null, errors.array()));
    
    try {
        const updated = await Store.updateOne({ _id: req.params.id, active: true, enabled: true }, { enabled: false })
            .catch(err => { throw err; });

        if (!updated.nModified) return res.json(new Response(false, null, { message: msg.adminStoresAlreadyDisabled }));

        await onDisabled(req.params.id)
            .catch(err => { throw err; });

        const store = await Store.findOne({ _id: req.params.id, active: true, enabled: false })
            .catch(err => { throw err; });

        return res.json(new Response(true, store, null));
    } catch (err) {
        return res.json(new Response(false, null, new Err(err)));
    }
});

module.exports = app;