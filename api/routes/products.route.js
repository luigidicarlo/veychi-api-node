const express = require('express');
const conn = require('../config/database.config');
const _ = require('lodash');
const Response = require('../models/Response.model');
const { model: Product, fillable, updatable } = require('../models/Product.model');
const { validateToken } = require('../middlewares/jwt-auth.middleware');
const { storeExists } = require('../middlewares/stores.middleware');
const { check, validationResult } = require('express-validator');
const regex = require('../utils/regex');
const constants = require('../utils/constants');

const app = express();

app.get('/products', (req, res) => {
    Product.find({ active: true }, (err, products) => {
        if (err) return res.status(500).json(new Response(false, null, err));

        if (!products) return res.status(404).json(new Response(true, [], null));

        return res.json(new Response(true, products, null));
    });
});

app.get('/products/:id',
    check('id')
        .trim().notEmpty().isMongoId()
, (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    Product.findOne({ _id: req.params.id, active: true }, (err, product) => {
        if (err) return res.status(500).json(new Response(false, null, err));

        if (!product) return res.status(404).json(new Response(true, [], null));

        return res.json(new Response(true, product, null));
    });
});

app.post('/products', [
    validateToken,
    storeExists,
    check('name')
        .notEmpty()
        .trim().matches(regex.productNames),
    check('description')
        .if(check('description').notEmpty())
        .trim().isLength({ min: constants.descMinLength, max: constants.descMaxLength }),
    check('shortDescription')
        .if(check('shortDescription').notEmpty())
        .trim().isLength({ min: constants.shortDescMinLength, max: constants.shortDescMaxLength }),
    check('price')
        .notEmpty()
        .trim().isFloat({ min: constants.minPrice, max: constants.maxPrice }),
    check('discount')
        .if(check('discount').exists())
        .trim().isFloat({ min: constants.minDiscount, max: constants.maxDiscount }),
    check('images')
        .if(check('images').notEmpty())
        .isArray(),
    check('tags')
        .if(check('tags').notEmpty())
        .isArray(),
    check('category')
        .trim().notEmpty().isMongoId()
], (req, res) => {
    const errors = validationResult(req);

    if (!req.store) return res.status(401).json(new Response(false, null, { message: 'User does not possess a store.' }))
    
    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    if (!req.store.enabled) return res.status(401).json(new Response(false, null, { message: 'Store is not authorized to manage products.' }));

    const body = _.pick(req.body, fillable);
    body.store = req.store._id;

    const newProduct = new Product(body);

    newProduct.save((err, product) => {
        if (err) return res.status(500).json(new Response(false, null, err));

        return res.status(201).json(new Response(true, product, null));
    });
});

app.put('/products/:id', [
    validateToken,
    storeExists,
    check('id')
        .trim().notEmpty().isMongoId(),
    check('name')
        .if(check('name').notEmpty())
        .trim().matches(regex.productNames),
    check('description')
        .if(check('description').notEmpty())
        .trim().isLength({ min: constants.descMinLength, max: constants.descMaxLength }),
    check('shortDescription')
        .if(check('shortDescription').notEmpty())
        .trim().isLength({ min: constants.shortDescMinLength, max: constants.shortDescMaxLength }),
    check('price')
        .if(check('price').notEmpty())
        .trim().isFloat({ min: constants.minPrice, max: constants.maxPrice }),
    check('discount')
        .if(check('discount').exists())
        .trim().isFloat({ min: constants.minDiscount, max: constants.maxDiscount }),
    check('images')
        .if(check('images').notEmpty())
        .isArray(),
    check('tags')
        .if(check('tags').notEmpty())
        .isArray(),
    check('category')
        .if(check('category').notEmpty())
        .trim().isMongoId()
], (req, res) => {
    const errors = validationResult(req);

    if (!req.store) return res.status(401).json(new Response(false, null, { message: 'User does not possess a store.' }));
    
    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    if (!req.store.enabled) return res.status(401).json(new Response(false, null, { message: 'Store is not authorized to manage products.' }));

    const body = _.pick(req.body, updatable);

    Product.updateOne(
        { _id: req.params.id, store: req.store._id, active: true },
        body,
        (err, updated) => {
            if (err) return res.status(500).json(new Response(false, null, err));

            if (updated.nModified <= 0) return res.status(400).json(new Response(false, null, { message: 'Product not found or impossible to update.' }));

            return res.json(new Response(true, updated, null));
        }
    );
});

app.delete('/products/:id', [
    validateToken,
    storeExists,
    check('id')
        .trim().notEmpty().isMongoId()
], (req, res) => {
    if (!req.store) return res.status(401).json(new Response(false, null, { message: 'User does not possess a store.' }));

    if (!req.store.enabled) return res.status(401).json(new Response(false, null, { message: 'Store is not authorized to manage products.' }));

    Product.updateOne(
        { _id: req.params.id, store: req.store._id, active: true },
        { active: false },
        (err, deleted) => {
            if (err) return res.status(500).json(new Response(false, null, err));

            if (deleted.nModified <= 0) return res.status(400).json(new Response(false, null, { message: 'Product does not exist or impossible to disable it.' }));

            return res.json(new Response(true, deleted, null));
        }
    );
});

module.exports = app;