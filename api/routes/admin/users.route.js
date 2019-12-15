const express = require('express');
const { check, validationResult} = require('express-validator');
const Response = require('../../models/Response.model');
const { validateToken } = require('../../middlewares/jwt-auth.middleware');
const { isAdmin } = require('../../middlewares/auth.middleware');
const { model: User } = require('../../models/User.model');
const msg = require('../../utils/messages');

const app = express();

app.get('/admin/users/:enabled', [
    validateToken,
    isAdmin,
    check('enabled')
        .notEmpty().trim().isBoolean()
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    User.find({ active: req.params.enabled }, (err, users) => {
        if (err) return res.status(400).json(new Response(false, null, err));

        if (!users.length) return res.status(400).json(new Response(false, null, { message: msg.usersNotFound }));

        return res.json(new Response(true, users, null));
    });
});

app.put('/admin/users/:id', [
    validateToken,
    isAdmin,
    check('id')
        .notEmpty().trim().isMongoId()
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    User.updateOne(
        { _id: req.params.id, active: false },
        { active: true },
        (err, updated) => {
            if (err) return res.status(400).json(new Response(false, null, err));

            if (!updated.nModified) return res.status(400).json(new Response(false, null, { message: msg.userNotFound }));

            User.findOne({ _id: req.params.id, active: true }, (err, deletedUser) => {
                if (err) return res.status(400).json(new Response(false, null, err));

                return res.json(new Response(true, deletedUser, null));
            });
        }
    );
});

app.delete('/admin/users/:id', [
    validateToken,
    isAdmin,
    check('id')
        .notEmpty().trim().isMongoId()
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    User.updateOne(
        { _id: req.params.id, active: true },
        { active: false },
        (err, updated) => {
            if (err) return res.status(400).json(new Response(false, null, err));

            if (!updated.nModified) return res.status(400).json(new Response(false, null, { message: userAlreadyDisabled }));

            User.findOne({ _id: req.params.id, active: false }, (err, deletedUser) => {
                if (err) return res.status(400).json(new Response(false, null, err));

                return res.json(new Response(true, deletedUser, null));
            });
        }
    );
});

module.exports = app;