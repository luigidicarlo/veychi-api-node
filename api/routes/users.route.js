const express = require('express');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const { model: User, fillable, updatable } = require('../models/User.model');
const Response = require('../models/Response.model');
const Err = require('../models/Error.model');
const { validateToken } = require('../middlewares/jwt-auth.middleware');
const roles = require('../utils/roles');
const regex = require('../utils/regex');
const msg = require('../utils/messages');

require('../config/app.config');

const app = express();

app.get('/users', validateToken, (req, res) => {
    if (!req.user) return res.status(404).json(new Response(false, null, { message: msg.userNotFound }));

    if (!req.user.active) return res.status(401).json(new Response(false, null, { message: msg.userNotFound }));

    return res.json(new Response(true, req.user, null));
});

app.post('/users', [
    check('username')
        .notEmpty().trim().matches(regex.usernames),
    check('fname')
        .notEmpty().trim().matches(regex.names),
    check('lname')
        .notEmpty().trim().matches(regex.names),
    check('password')
        .notEmpty().trim().isLength({ min: 8, max: 32 }),
    check('email')
        .notEmpty().trim().isEmail(),
    check('imageUrl')
        .if(check('imageUrl').notEmpty())
        .trim().isURL()
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    const body = _.pick(req.body, fillable);
    body.password = bcrypt.hashSync(body.password, bcrypt.genSaltSync());
    body.role = roles.client;

    const user = new User(body);

    User.findOne({ $or: [
        { username: user.username },
        { email: user.email }
    ] }, (err, result) => {
        if (err) return res.status(400).json(new Response(false, null, err));

        if (result) return res.status(400).json(new Response(false, null, { message: msg.userExists }));

        user.save((err, user) => {
            if (err) return res.status(400).json(new Response(false, null, err));
    
            return res.status(201).json(new Response(true, user, null));
        });
    });
});

app.put('/users', [
    validateToken,
    check('fname')
        .if(check('fname').notEmpty())
        .trim().matches(regex.names),
    check('lname')
        .if(check('lname').notEmpty())
        .trim().matches(regex.names),
    check('email')
        .if(check('email').notEmpty())
        .trim().isEmail(),
    check('imageUrl')
        .if(check('imageUrl').notEmpty())
        .trim().isURL()
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    const body = _.pick(req.body, updatable);
    body.updatedAt = new Date(Date.now());

    User.findOne({ email: body.email }, (err, result) => {
        if (err) return res.status(400).json(new Response(false, null, err));

        if (result) return res.status(400).json(new Response(false, null, { message: msg.emailTaken }));

        User.updateOne(
            { _id: req.user.id, active: true },
            body,
            {new: true, runValidators: true},
            (err, updated) => {
                if (err) return res.status(400).json(new Response(false, null, err));
    
                if (updated.nModified <= 0) return res.status(400).json(new Response(false, null, { message: msg.userNotFound }));

                User.findOne({ _id: req.user.id, active: true }, (err, user) => {
                    if (err) return res.status(400).json(new Response(false, null, err));

                    return res.json(new Response(true, user, null));
                });
            }
        );
    });
});

app.put('/users/password', [
    validateToken,
    check('password')
        .notEmpty().trim().isLength({ min: 8, max: 32 })
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    const newPass = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync());

    User.updateOne(
        { _id: req.user.id, active: true },
        { password: newPass },
        { runValidators: true },
        (err, updated) => {
            if (err) return res.status(400).json(new Response(false, null, err));

            if (updated.nModified <= 0) return res.status(400).json(new Response(false, null, { message: msg.userNotFound }));

            User.findOne({ _id: req.user.id, active: true }, (err, user) => {
                if (err) return res.status(400).json(new Response(false, null, err));

                return res.json(new Response(true, user, null));
            });
        }
    );
});

app.delete('/users', validateToken, (req, res) => {
    User.updateOne(
        { _id: req.user.id, active: true },
        { active: false },
        {new: true},
        (err, deleted) => {
            if (err) return res.status(400).json(new Response(false, null, err));

            if (deleted.nModified <= 0) return res.status(400).json(new Response(false, null, { message: msg.userAlreadyDisabled }));

            User.findOne({ _id: req.user.id, active: false }, (err, user) => {
                if (err) return res.status(400).json(new Response(false, null, err));

                return res.json(new Response(true, user, null));
            });
        }
    );
});

module.exports = app;