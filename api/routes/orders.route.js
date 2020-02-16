const express = require('express');
const _ = require('lodash');
const Response = require('../models/Response.model');
const Err = require('../models/Error.model');
const { check, validationResult } = require('express-validator');
const { model: Order, fillable, updatable } = require('../models/Order.model');
const { model: Product } = require('../models/Product.model');
const { model: Coupon } = require('../models/Coupon.model');
const { validateToken } = require('../middlewares/jwt-auth.middleware');
const { isAdmin } = require('../middlewares/auth.middleware');
const { getTotal, getSubtotal, applyCoupons } = require('../utils/functions');
const statuses = require('../utils/order-statuses');
const msg = require('../utils/messages');

const app = express();

app.get('/orders', [validateToken], async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user, active: true, enabled: true })
            .populate(['user', 'products', 'coupons'])
            .catch(err => { throw err; });

        if (!orders.length) return res.json(new Response(false, null, { message: msg.ordersNotFound }));

        return res.json(new Response(true, orders, null));
    } catch (err) {
        return res.json(new Response(false, null, new Err(err)));
    }
});

app.post('/orders', [
    validateToken,
    check('products').notEmpty().isArray(),
    check('products.*').notEmpty().trim().isMongoId(),
    check('coupons').isArray(),
    check('coupons.*').notEmpty().trim().isMongoId()
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.json(new Response(false, null, errors.array()));

    try {
        const body = _.pick(req.body, fillable);
        let total = 0;
        let subtotal = 0;
        let respObj = {};

        if (!body.products.length) return res.json(new Response(false, null, { message: msg.ordersEmpty }));

        const productsPromises = body.products.map(product => {
            return Product.findOne({ _id: product, active: true, enabled: true });
        });

        const products = await Promise.all(productsPromises)
            .catch(err => { throw err; });

        subtotal = getSubtotal(products);

        if (!body.coupons.length) {
            total = getTotal(products);
        } else {
            const couponsPromises = body.coupons.map(coupon => {
                return Coupon.findOne({ _id: coupon, active: true, enabled: true });
            });

            const coupons = await Promise.all(couponsPromises)
                .catch(err => { throw err; });

            respObj = applyCoupons(coupons, products);
            total = respObj.total;
        }

        body.user = req.user;
        body.subtotal = subtotal;
        body.total = total;

        const newOrder = new Order(body);

        const inserted = await newOrder.save()
            .catch(err => { throw err; });

        const order = await Order.findById(inserted._id)
            .populate(['products', 'coupons', 'user'])
            .catch(err => { throw err; });

        return res.json(new Response(true, order, null));
    } catch (err) {
        return res.json(new Response(false, null, new Err(err)));
    }
});

app.put('/orders/:id', [
    validateToken,
    isAdmin,
    check('id').notEmpty().trim().isMongoId(),
    check('status')
        .notEmpty().trim().isUppercase().isIn([statuses.processing, statuses.pending, statuses.failed, statuses.complete])
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.json(new Response(false, null, errors.array()));

    try {
        const body = _.pick(req.body, updatable);

        const updated = await Order.updateOne({ _id: req.params.id, user: req.user.id, active: true, enabled: true }, body, { runValidators: true })
            .catch(err => { throw err; });

        if (!updated.nModified) return res.json(new Response(false, null, { message: msg.ordersUpdateFailed }));

        const order = await Order.findOne({ _id: req.params.id, user: req.user.id, active: true, enabled: true })
            .populate(['user', 'products', 'coupons'])
            .catch(err => { throw err; });

        return res.json(new Response(true, order, null));
    } catch (err) {
        return res.json(new Response(false, null, new Err(err)));
    }
});

app.delete('/orders/:id', [
    validateToken,
    check('id').notEmpty().trim().isMongoId()
], async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, active: true, user: req.user.id, enabled: true })
            .populate(['user', 'products', 'coupons'])
            .catch(err => { throw err; });

        if (!order) return res.json(new Response(false, null, { message: msg.orderNotFound }));

        let modifiedStatus = { active: false };

        if (order.status !== statuses.complete) modifiedStatus = { active: false, status: statuses.failed };

        const deleted = await Order.updateOne({ _id: req.params.id, user: req.user.id, active: true, enabled: true }, modifiedStatus, { runValidators: true })
            .catch(err => { throw err; });

        if (!deleted.nModified) return res.json(new Response(false, null, { message: msg.orderAlreadyDisabled }));

        order.active = false;

        return res.json(new Response(true, order, null));
    } catch (err) {
        return res.json(new Response(false, null, new Err(err)));
    }
});

module.exports = app;