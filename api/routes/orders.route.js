const express = require('express');
const _ = require('lodash');
const Response = require('../models/Response.model');
const { check, validationResult } = require('express-validator');
const { model: Order, fillable, updatable } = require('../models/Order.model');
const { validateToken } = require('../middlewares/jwt-auth.middleware');
const { isAdmin } = require('../middlewares/auth.middleware');
const { getSubtotal, applyCoupons } = require('../utils/functions');
const statuses = require('../utils/order-statuses');
const msg = require('../utils/messages');

const app = express();

app.get('/orders', [validateToken], (req, res) => {
    Order.find({ user: req.user }, (err, orders) => {
        if (err) return res.status(400).json(new Response(false, null, err));

        if (!orders.length) return res.status(404).json(new Response(false, null, { message: msg.ordersNotFound }));

        return res.json(new Response(true, orders, null));
    });
});

app.post('/orders', [
    validateToken,
    check('products')
        .notEmpty().isArray(),
    check('products.*._id')
        .notEmpty().trim().isMongoId(),
    check('coupons')
        .isArray(),
    check('coupons.*._id')
        .notEmpty().trim().isMongoId()
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    const body = _.pick(req.body, fillable);

    if (!body.products.length) return res.status(400).json(new Response(false, null, { message: msg.ordersEmpty }));

    const subtotal = getSubtotal(body.products);
    let total = applyCoupons(body.products, body.coupons, subtotal);

    body.subtotal = subtotal;
    body.total = total;
    body.user = req.user;

    const order = new Order(body);

    order.save((err, newOrder) => {
        if (err) return res.status(400).json(new Response(false, null, err));

        return res.status(201).json(new Response(true, newOrder, null));
    });
});

app.put('/orders/:id', [
    validateToken,
    isAdmin,
    check('id')
        .notEmpty().trim().isMongoId(),
    check('status')
        .notEmpty().trim().isUppercase().isIn([statuses.processing, statuses.pending, statuses.failed, statuses.complete])
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    const body = _.pick(req.body, updatable);

    Order.updateOne(
        { _id: req.params.id, user: req.user, active: true },
        body,
        (err, updated) => {
            if (err) return res.status(400).json(new Response(false, null, err));

            if (updated.nModified <= 0) return res.status(400).json(new Response(false, null, { message: msg.ordersUpdateFailed }));

            Order.findOne({ _id: req.params.id, user: req.user, active: true }, (err, order) => {
                if (err) return res.status(400).json(new Response(false, null, err));

                return res.json(new Response(true, order, null));
            });
        }
    );
});

app.delete('/orders/:id', [
    validateToken,
    check('id')
        .notEmpty().trim().isMongoId()
], (req, res) => {
    Order.findOne({ _id: req.params.id, active: true, user: req.user }, (err, order) => {
        if (err) return res.status(400).json(new Response(false, null, err));

        if (!order) return res.status(404).json(new Response(false, null, { message: msg.orderNotFound }));

        const modifiedStatus = { active: false };

        if (order.status !== statuses.complete) modifiedStatus = { active: false, status: statuses.failed };

        Order.updateOne(
            { _id: req.params.id, user: req.user, active: true },
            modifiedStatus,
            (err, deleted) => {
                if (err) return res.status(400).json(new Response(false, null, err));

                if (deleted.nModified <= 0) return res.status(400).json(new Response(false, null, { message: msg.orderAlreadyDisabled }));

                Order.findOne({ _id: req.params.id, user: req.user, active: true }, (err, order) => {
                    if (err) return res.status(400).json(new Response(false, null, err));

                    return res.json(new Response(true, order, null));
                });
            }
        );
    });
});

module.exports = app;