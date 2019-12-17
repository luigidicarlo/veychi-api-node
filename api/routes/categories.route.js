const express = require('express');
const _ = require('lodash');
const Response = require('../models/Response.model');
const { model: Category, fillable, updatable } = require('../models/Category.model');
const { model: Product } = require('../models/Product.model');
const { check, validationResult } = require('express-validator');
const { validateToken } = require('../middlewares/jwt-auth.middleware');
const { isAdmin } = require('../middlewares/auth.middleware');
const { isNotNull } = require('../utils/validations');
const constants = require('../utils/constants');
const msg = require('../utils/messages');

const app = express();

app.get('/categories', (req, res) => {
    Category.find({ active: true }, (err, categories) => {
        if (err) return res.status(400).json(new Response(false, null, err));

        if (!categories.length) return res.status(404).json(new Response(false, null, { message: msg.categoriesNotFound }));

        return res.json(new Response(true, categories, null));
    });
});

app.get('/categories/:id', [
    check('id')
        .trim().notEmpty().isMongoId()
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    Category.find({ parent: req.params.id, active: true }, (err, subcategories) => {
        if (err) return res.status(400).json(new Response(false, null, err));

        if (!subcategories.length) return res.status(404).json(new Response(false, null, { message: msg.categoriesNotFound }));

        return res.json(new Response(true, subcategories, null));
    });
});

app.get('/categories/:id/products', [
    check('id')
        .trim().notEmpty().isMongoId()
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    Product.find({ category: req.params.id, active: true }, (err, products) => {
        if (err) return res.status(400).json(new Response(false, null, err));

        if (!products.length) return res.status(404).json(new Response(false, null, { message: msg.categoriesNotFound }));

        return res.json(new Response(true, products, null));
    });
});

app.post('/categories', [
    validateToken,
    isAdmin,
    check('name')
        .notEmpty().trim().isLength({ min: constants.namesMinLength, max: constants.namesMaxLength }),
    check('parent')
        .if(check('parent').notEmpty().custom(isNotNull))
        .trim().isMongoId(),
    check('imageUrl')
        .if(check('imageUrl').notEmpty())
        .trim().isURL()
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    const body = _.pick(req.body, fillable);

    Category.findOne({ name: body.name, active: true }, (err, result) => {
        if (err) return res.status(400).json(new Response(false, null, err));

        if (result) return res.status(400).json(new Response(false, null, { message: msg.categoryExists }));

        const newCategory = new Category(body);
    
        newCategory.save((err, inserted) => {
            if (err) return res.status(400).json(new Response(false, null, err));
    
            return res.status(201).json(new Response(true, inserted, null));
        });
    });
});

app.put('/categories/:id', [
    validateToken,
    isAdmin,
    check('name')
        .if(check('name').notEmpty())
        .trim().isLength({ min: constants.namesMinLength, max: constants.namesMaxLength }),
    check('parent')
        .if(check('parent').notEmpty())
        .trim().isMongoId(),
    check('imageUrl')
        .if(check('imageUrl').notEmpty())
        .trim().isURL()
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    const body = _.pick(req.body, updatable);
    body.updatedAt = new Date(Date.now());

    Category.findOne({ name: body.name }, (err, result) => {
        if (err) return res.status(400).json(new Response(false, null, err));

        if (result) return res.status(400).json(new Response(false, null, { message: msg.categoryExists }));

        Category.updateOne(
            { _id: req.params.id, active: true },
            body,
            { runValidators: true },
            (err, updated) => {
                if (err) return res.status(400).json(new Response(false, null, err));
    
                if (updated.nModified <= 0) return res.status(400).json(new Response(false, null, { message: msg.categoryNotFound }));
    
                Category.findOne({ _id: req.params.id, active: true }, (err, modifiedCategory) => {
                    if (err) return res.status(400).json(new Response(false, null, err));

                    return res.json(new Response(true, modifiedCategory, null));
                });
            }
        );
    });
});

app.delete('/categories/:id', [
    check('id')
        .notEmpty().trim().isMongoId()
], (req, res) => {
    Category.updateOne(
        { _id: req.params.id, active: true },
        { active: false },
        (err, deleted) => {
            if (err) return res.status(400).json(new Response(false, null, err));

            if (deleted.nModified <= 0) return res.status(400).json(new Response(false, null, { message: msg.categoryAlreadyDisabled }));

            Category.findOne({ _id: req.params.id, active: false }, (err, category) => {
                if (err) return res.status(400).json(new Response(false, null, err));

                return res.json(new Response(true, category, null));
            });
        }
    );
});

module.exports = app;