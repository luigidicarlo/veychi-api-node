const express = require('express');
const conn = require('../config/database.config');
const _ = require('lodash');
const Response = require('../models/Response.model');
const { model: Category, fillable, updatable } = require('../models/Category.model');
const { model: Product } = require('../models/Product.model');
const { check, validationResult } = require('express-validator');
const { validateToken } = require('../middlewares/jwt-auth.middleware');
const { isAdmin } = require('../middlewares/auth.middleware');
const constants = require('../utils/constants');

const app = express();

app.get('/categories', (req, res) => {
    Category.find({ active: true }, (err, categories) => {
        if (err) return res.status(500).json(new Response(false, null, err));

        if (!categories) return res.status(404).json(new Response(true, [], null));

        return res.json(new Response(true, categories, null));
    });
});

app.get('/categories/:id', [
    check('id')
        .trim().notEmpty().isMongoId()
], (req, res) => {
    Product.findMany({ category: req.params.id, active: true }, (err, products) => {
        if (err) return res.status(500).json(new Response(false, null, err));

        if (!products) return res.status(404).json(new Response(true, [], null));

        return res.json(new Response(true, products, null));
    });
});

app.post('/categories', [
    validateToken,
    isAdmin,
    check('name')
        .notEmpty().trim().isLength({ min: constants.namesMinLength, max: constants.namesMaxLength }),
    check('parent')
        .if(check('parent').notEmpty())
        .trim().isMongoId(),
    check('imageUrl')
        .if(check('imageUrl').notEmpty())
        .isURL()
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    const body = _.pick(req.body, fillable);

    const newCategory = new Category(body);
    
    newCategory.save((err, inserted) => {
        if (err) return res.status(500).json(new Response(false, null, err));

        return res.status(201).json(new Response(true, inserted, null));
    });
});

app.put('/categories/:id', [
    validateToken,
    isAdmin,
    check('name')
        .if(check('name').not().isEmpty())
        .trim(),
        check('parent_id')
        .if(check('parent_id').not().isEmpty())
        .isInt({ min: 1 }),
    check('image_id')
        .if(check('image_id').not().isEmpty())
        .isInt({ min: 1 })
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    const body = _.pick(req.body, updatable);
    body.updatedAt = new Date(Date.now());

    Category.findOne(
        { _id: req.params.id, active: true },
        (err, category) => {
            if (err) return res.status(500).json(new Response(false, null, err));

            if (!category) return res.status(404).json(new Response(false, null, { message: 'Category does not exist.' }));

            if (!category.active) return res.status(401).json(new Response(false, null, { message: 'Category is inactive.' }));

            Category.findByIdAndUpdate(
                req.params.id,
                body,
                { new: true, runValidators: true },
                (err, updated) => {
                    if (err) return res.status(500).json(new Response(false, null, err));
        
                    return res.json(new Response(true, updated, null));
                }
            );
        }
    );
});

app.delete('/categories/:id', (req, res) => {
    Category.findByIdAndUpdate(
        req.params.id,
        { active: false },
        { new: true },
        (err, deleted) => {
            if (err) return res.status(500).json(new Response(false, null, err));

            return res.json(new Response(true, deleted, null));
        }
    );
});

module.exports = app;