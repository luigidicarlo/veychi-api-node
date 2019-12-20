const express = require('express');
const _ = require('lodash');
const Response = require('../models/Response.model');
const Err = require('../models/Error.model');
const { model: Product, fillable, updatable } = require('../models/Product.model');
const { validateToken } = require('../middlewares/jwt-auth.middleware');
const { storeExists } = require('../middlewares/stores.middleware');
const { check, validationResult } = require('express-validator');
const regex = require('../utils/regex');
const constants = require('../utils/constants');
const msg = require('../utils/messages');

const app = express();

app.get('/products', async (req, res) => {
    try {
        const products = await Product.find({ active: true, enabled: true })
            .populate(['store', 'category'])
            .catch(err => { throw err; });

        if (!products.length) return res.status(404).json(new Response(false, null, { message: msg.productsNotFound }));

        return res.json(new Response(true, products, null));
    } catch (err) {
        return res.status(400).json(new Response(false, null, new Err(err)));
    }
});

app.get('/products/:id', [
    check('id').trim().notEmpty().isMongoId()
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    try {
        const product = await Product.findOne({ _id: req.params.id, active: true, enabled: true })
            .populate(['store', 'category'])
            .catch(err => { throw err; });

        if (!product) return res.status(404).json(new Response(false, null, { message: msg.productNotFound }));

        return res.json(new Response(true, product, null));
    } catch (err) {
        return res.status(400).json(new Response(false, null, new Err(err)));
    }
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
    check('images.*')
        .if(check('images').notEmpty())
        .trim().isURL(),
    check('tags')
        .if(check('tags').notEmpty())
        .isArray(),
    check('tags.*')
        .if(check('tags').notEmpty())
        .trim(),
    check('category')
        .trim().notEmpty().isMongoId()
], async (req, res) => {
    const errors = validationResult(req);

    if (!req.store) return res.status(401).json(new Response(false, null, { message: msg.userLacksStore }))

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    if (!req.store.enabled) return res.status(401).json(new Response(false, null, { message: msg.storeUnauthorized }));

    try {
        const body = _.pick(req.body, fillable);
        body.store = req.store._id;

        const result = await Product.findOne({ name: body.name, store: req.store._id, active: true, enabled: true })
            .populate(['store', 'category'])
            .catch(err => { throw err; });

        if (result) return res.status(400).json(new Response(false, null, { message: msg.productExists }));

        const newProduct = new Product(body);

        const product = await newProduct.save()
            .catch(err => { throw err; });

        return res.status(201).json(new Response(true, product, null));
    } catch (err) {
        return res.status(400).json(new Response(false, null, new Err(err)));
    }
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
    check('images.*')
        .if(check('images').notEmpty())
        .trim().isURL(),
    check('tags')
        .if(check('tags').notEmpty())
        .isArray(),
    check('tags.*')
        .if(check('tags').notEmpty())
        .trim(),
    check('category')
        .if(check('category').notEmpty())
        .trim().isMongoId()
], async (req, res) => {
    const errors = validationResult(req);

    if (!req.store) return res.status(401).json(new Response(false, null, { message: msg.userLacksStore }));

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    if (!req.store.enabled) return res.status(401).json(new Response(false, null, { message: msg.storeUnauthorized }));

    try {
        const body = _.pick(req.body, updatable);

        const result = await Product.findOne({ name: body.name, store: req.store._id, active: true, enabled: true })
            .populate(['store', 'category'])
            .catch(err => { throw err; });

        if (result) return res.status(400).json(new Response(false, null, { message: msg.productExists }));

        const updated = await Product.updateOne({ _id: req.params.id, store: req.store._id, active: true, enabled: true }, body, { runValidators: true })
            .catch(err => { throw err; });

        if (!updated.nModified) return res.status(400).json(new Response(false, null, { message: msg.productUpdateFailed }));

        const product = await Product.findOne({ _id: req.params.id, store: req.store._id, active: true, enabled: true })
            .populate(['store', 'category'])
            .catch(err => { throw err; });

        return res.json(new Response(true, product, null));
    } catch (err) {
        return res.status(400).json(new Response(false, null, new Err(err)));
    }
});

app.delete('/products/:id', [
    validateToken,
    storeExists,
    check('id')
        .trim().notEmpty().isMongoId()
], async (req, res) => {
    if (!req.store) return res.status(401).json(new Response(false, null, { message: msg.userLacksStore }));

    if (!req.store.enabled) return res.status(401).json(new Response(false, null, { message: msg.storeUnauthorized }));

    try {
        const product = await Product.findOne({ _id: req.params.id, store: req.store._id, active: true, enabled: true })
            .populate(['store', 'category'])
            .catch(err => { throw err; });

        if (!product) return res.status(404).json(new Response(false, null, { message: msg.productNotFound }));

        const deleted = await Product.updateOne({ _id: req.params.id, store: req.store._id, active: true, enabled: true }, { active: false })
            .catch(err => { throw err; });

        if (!deleted.nModified) return res.status(400).json(new Response(false, null, { message: msg.productAlreadyDisabled }));

        product.active = false;

        return res.json(new Response(true, product, null));
    } catch (err) {
        return res.status(400).json(new Response(false, null, new Err(err)));
    }
});

module.exports = app;