const express = require('express');
const _ = require('lodash');
const Response = require('../models/Response.model');
const Err = require('../models/Error.model');
const { model: Category, fillable, updatable } = require('../models/Category.model');
const { model: Product } = require('../models/Product.model');
const { check, validationResult } = require('express-validator');
const { validateToken } = require('../middlewares/jwt-auth.middleware');
const { isAdmin } = require('../middlewares/auth.middleware');
const { isNotNull } = require('../utils/validations');
const constants = require('../utils/constants');
const msg = require('../utils/messages');

const app = express();

app.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find({ active: true }).populate('parent')
            .catch(err => { throw err; });
    
        if (!categories.length) return res.json(new Response(false, null, { message: msg.categoriesNotFound }));
    
        return res.json(new Response(true, categories, null));
    } catch (err) {
        return res.json(new Response(false, null, new Err(err)));
    }
});

app.get('/categories/:id', [
    check('id').trim().notEmpty().isMongoId()
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.json(new Response(false, null, errors.array()));

    try {
        const subcategories = await Category.find({ parent: req.params.id, active: true }).populate('parent')
            .catch(err => { throw err; });

        if (!subcategories.length) return res.json(new Response(false, null, { message: msg.categoriesNotFound }));

        return res.json(new Response(true, subcategories, null));
    } catch(err) {
        return res.json(new Response(false, null, new Err(err)));
    }
});

app.get('/categories/:id/products', [
    check('id').trim().notEmpty().isMongoId()
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.json(new Response(false, null, errors.array()));

    try {
        const products = await Product.find({ category: req.params.id, active: true, enabled: true })
            .catch(err => { throw err; });

        if (!products.length) return res.json(new Response(false, null, { message: msg.productsNotFound }));

        return res.json(new Response(true, products, null));
    } catch (err) {
        return res.json(new Response(false, null, new Err(err)));
    }
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
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.json(new Response(false, null, errors.array()));

    try {
        const body = _.pick(req.body, fillable);
        
        const result = await Category.findOne({ name: body.name, active: true })
            .catch(err => { throw err; });

        if (result) return res.json(new Response(false, null, { message: msg.categoryExists }));

        const newCategory = new Category(body);

        const inserted = await newCategory.save()
            .catch(err => { throw err; });

        return res.json(new Response(true, inserted, null));
    } catch (err) {
        return res.json(new Response(false, null, new Err(err)));
    }
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
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.json(new Response(false, null, errors.array()));

    try {
        const body = _.pick(req.body, updatable);
        body.updatedAt = new Date(Date.now());

        const result = await Category.find({ name: body.name, active: true })
            .catch(err => { throw err; });

        if (result.length > 1) return res.json(new Response(false, null, { message: msg.categoryExists }));

        const updated = await Category.updateOne({ _id: req.params.id, active: true }, body, { runValidators: true })
            .catch(err => { throw err; });

        if (!updated.nModified) return res.json(new Response(false, null, { message: msg.categoryNotFound }));

        const category = await Category.findOne({ _id: req.params.id, active: true })
            .catch(err => { throw err; });

        return res.json(new Response(true, category, null));
    } catch (err) {
        return res.json(new Response(false, null, new Err(err)));
    }
});

app.delete('/categories/:id', [
    validateToken,
    isAdmin,
    check('id').notEmpty().trim().isMongoId()
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.json(new Response(false, null, errors.array()));

    try {
        const category = await Category.findOne({ _id: req.params.id, active: true })
            .catch(err => { throw err; });

        if (!category) return res.json(new Response(false, null, { message: msg.categoryNotFound }));

        const deleted = await Category.updateOne({ _id: req.params.id, active: true }, { active: false })
            .catch(err => { throw err; });

        await Category.update({ parent: req.params.id, active: true }, { active: false })
            .catch(err => { throw err });

        if (!deleted.nModified) return res.json(new Response(false, null, { message: msg.categoryAlreadyDisabled }));

        category.active = false;

        return res.json(new Response(true, category, null));
    } catch (err) {
        return res.json(new Response(false, null, new Err(err)));
    }
});

module.exports = app;