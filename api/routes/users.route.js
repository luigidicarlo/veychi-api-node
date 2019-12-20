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
const constants = require('../utils/constants');

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
        .notEmpty().trim().isLength({ min: constants.usernameMinLength }),
    check('email')
        .notEmpty().trim().isEmail(),
    check('imageUrl')
        .if(check('imageUrl').notEmpty()).trim().isURL()
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    try {
        const body = _.pick(req.body, fillable);
        body.password = bcrypt.hashSync(body.password, bcrypt.genSaltSync());
        body.role = roles.client;

        const user = new User(body);

        const result = await User.findOne({ $or: [{username: user.username}, {email: user.email}], active: true })
            .catch(err => { throw err; });

        if (result) return res.status(400).json(new Response(false, null, { message: msg.userExists }));

        const savedUser = await user.save()
            .catch(err => { throw err; });

        return res.status(201).json(new Response(true, savedUser, null));
    } catch (err) {
        return res.status(400).json(new Response(false, null, new Err(err)));
    }
});

app.put('/users', [
    validateToken,
    check('fname')
        .if(check('fname').notEmpty()).trim().matches(regex.names),
    check('lname')
        .if(check('lname').notEmpty()).trim().matches(regex.names),
    check('email')
        .if(check('email').notEmpty()).trim().isEmail(),
    check('imageUrl')
        .if(check('imageUrl').notEmpty()).trim().isURL()
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    try {
        const body = _.pick(req.body, updatable);
        body.updatedAt = new Date(Date.now());

        const result = await User.findOne({ email: body.email })
            .catch(err => { throw err; });

        if (result) return res.status(400).json(new Response(false, null, { message: msg.emailTaken }));

        const updated = await User.updateOne({ _id: req.user.id, active: true }, body, { runValidators: true })
            .catch(err => { throw err; });

        if (!updated.nModified) return res.status(400).json(new Response(false, null, { message: msg.userNotFound }));

        const user = await User.findOne({ _id: req.user.id, active: true })
            .catch(err => { throw err; });

        return res.json(new Response(true, user, null));
    } catch (err) {
        return res.status(400).json(new Response(false, null, new Err(err)));
    }
});

app.put('/users/password', [
    validateToken,
    check('password')
        .notEmpty().trim().isLength({ min: constants.usernameMinLength })
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    try {
        const password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync());
        
        const updated = await User.updateOne({ _id: req.user.id, active: true }, { password })
            .catch(err => { throw err; });

        if (!updated.nModified) return res.status(400).json(new Response(false, null, { message: msg.userNotFound }));

        const user = await User.findOne({ _id: req.user.id, active: true })
            .catch(err => { throw err; });;

        return res.json(new Response(true, user, null));
    } catch (err) {
        return res.status(400).json(new Response(false, null, new Err(err)));
    }
});

app.delete('/users', validateToken, async (req, res) => {
    try {
        const disabled = await User.updateOne({ _id: req.user.id, active: true }, { active: false })
            .catch(err => { throw err; });

        if (!disabled.nModified) return res.status(400).json(new Response(false, null, { message: msg.userAlreadyDisabled }));

        await User.onDisabled(req.user.id)
            .catch(err => { throw err; });

        const user = User.findOne({ _id: req.user.id, active: false })
            .catch(err => { throw err; });

        return res.json(new Response(true, user, null));
    } catch (err) {
        return res.status(400).json(new Response(false, null, new Err(err)));
    }
});

module.exports = app;