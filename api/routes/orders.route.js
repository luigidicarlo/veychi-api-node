const express = require('express');
const _ = require('lodash');
const Response = require('../models/Response.model');
const Err = require('../models/Error.model');
const { check, validationResult } = require('express-validator');
const { model: Order, fillable, updatable } = require('../models/Order.model');
const { validateToken } = require('../middlewares/jwt-auth.middleware');
const { isAdmin } = require('../middlewares/auth.middleware');
const { getSubtotal, applyCoupons } = require('../utils/functions');
const statuses = require('../utils/order-statuses');
const msg = require('../utils/messages');

const app = express();

app.get('/orders', [validateToken], async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user, active: true, enabled: true })
            .populate(['user', 'products', 'coupons'])
            .catch(err => { throw err; });

        if (!orders.length) return res.status(404).json(new Response(false, null, { message: msg.ordersNotFound }));

        return res.json(new Response(true, orders, null));
    } catch (err) {
        return res.status(400).json(new Response(false, null, new Err(err)));
    }
});

app.post('/orders', [
    validateToken,
    check('products').notEmpty().isArray(),
    check('products.*._id').notEmpty().trim().isMongoId(),
    check('coupons').isArray(),
    check('coupons.*._id').notEmpty().trim().isMongoId()
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    try {
        const body = _.pick(req.body, fillable);

        if (!body.products.length) return res.status(400).json(new Response(false, null, { message: msg.ordersEmpty }));

        const subtotal = getSubtotal(body.products);
        const total = applyCoupons(body.products, body.coupons, subtotal);

        body.subtotal = subtotal;
        body.total = total;
        body.user = req.user;

        const order = new Order(body);

        const newOrder = await order.save()
            .catch(err => { throw err; });

        return res.status(201).json(new Response(true, newOrder, null));
    } catch (err) {
        return res.status(400).json(new Response(false, null, new Err(err)));
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

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    try {
        const body = _.pick(req.body, updatable);

        const updated = await Order.updateOne({ _id: req.params.id, user: req.user.id, active: true, enabled: true }, body, { runValidators: true })
            .catch(err => { throw err; });

        if (!updated.nModified) return res.status(400).json(new Response(false, null, { message: msg.ordersUpdateFailed }));

        const order = await Order.findOne({ _id: req.params.id, user: req.user.id, active: true, enabled: true })
            .populate(['user', 'products', 'coupons'])
            .catch(err => { throw err; });

        return res.json(new Response(true, order, null));
    } catch (err) {
        return res.status(400).json(new Response(false, null, new Err(err)));
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

        if (!order) return res.status(404).json(new Response(false, null, { message: msg.orderNotFound }));

        let modifiedStatus = { active: false };

        if (order.status !== statuses.complete) modifiedStatus = { active: false, status: statuses.failed };

        const deleted = await Order.updateOne({ _id: req.params.id, user: req.user.id, active: true, enabled: true }, modifiedStatus, { runValidators: true })
            .catch(err => { throw err; });

        if (!deleted.nModified) return res.status(400).json(new Response(false, null, { message: msg.orderAlreadyDisabled }));

        order.active = false;

        return res.json(new Response(true, order, null));
    } catch (err) {
        return res.status(400).json(new Response(false, null, new Err(err)));
    }
});

module.exports = app;