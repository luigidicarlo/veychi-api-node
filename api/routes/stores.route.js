const express = require('express');
const _ = require('lodash');
const { body, validationResult } = require('express-validator');
const conn = require('../config/database.config');
const { validateToken } = require('../middlewares/jwt-auth.middleware');
const { storeExists } = require('../middlewares/stores.middleware');

const app = express();

app.get('/stores', [validateToken, storeExists], (req, res) => {
    if (!req.store) {
        return res.status(404).json('No store found.');
    }

    return res.json(req.store);
});

app.post('/stores', [
    validateToken,
    storeExists,
    body('name')
        .not()
        .isEmpty()
        .matches('^[$0-9a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\' ]+$'),
    body('image_id')
        .if(body('image_id').not().isEmpty())
        .isInt({ min: 1 }),
    body('rut')
        .not()
        .isEmpty()
        .matches(/^[0-9]+[-|‐]{1}[0-9kK]{1}$/),
    body('activity')
        .not()
        .isEmpty()
        .isAlpha(),
    body('owner')
        .not()
        .isEmpty()
        .matches('^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\' ]+$')
], (req, res) => {
    if (req.store) {
        return res.status(403).json('The user already has a store associated.');
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json(errors.array());
    }

    const body = _.pick(req.body, ['name', 'description', 'image_id', 'rut', 'activity', 'owner']);
    body.user_id = req.user.id;
    body.created_at = new Date(Date.now());
    body.updated_at = new Date(Date.now());

    conn('stores')
        .insert(body)
        .then(inserted => {
            if (inserted.length > 0) {
                const newStore = body;
                newStore.id = inserted[0];
                return res.status(201).json(newStore);
            } else {
                return res.status(422).json('Could not create store.');
            }
        });
});

app.put('/stores', [
    validateToken,
    storeExists,
    body('name')
        .if(body('name').not().isEmpty())
        .not()
        .isEmpty()
        .matches('^[$0-9a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\' ]+$'),
    body('image_id')
        .if(body('image_id').not().isEmpty())
        .isInt({ min: 1 }),
    body('activity')
        .if(body('activity').not().isEmpty())
        .not()
        .isEmpty()
        .isAlpha(),
    body('rut')
        .if(body('rut').not().isEmpty())
        .matches(/^[0-9]+[-|‐]{1}[0-9kK]{1}$/),
    body('owner')
        .if(body('owner').not().isEmpty())
        .not()
        .isEmpty()
        .matches('^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\' ]+$')
], (req, res) => {
    if (!req.store) {
        return res.status(404).json('No store found.');
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json(errors.array);
    }

    const body = _.pick(req.body, ['name', 'description', 'image_id']);
    body.updated_at = new Date(Date.now());

    conn('stores')
        .where('id', req.user.id)
        .update(body)
        .then(updated => {
            if (updated > 0) {
                return res.json(body);
            } else {
                return res.status(422).json('Could not update store.')
            }
        });
});

app.delete('/stores', [validateToken, storeExists], (req, res) => {
    if (!req.store) {
        return res.status(404).json('No store found.');
    }

    conn('stores')
        .where('user_id', req.user.id)
        .del()
        .then(deleted => {
            if (deleted > 0) {
                return res.json(deleted);
            } else {
                return res.status(422).json('Could not delete store.');
            }
        });
});

module.exports = app;