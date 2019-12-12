const express = require('express');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { model: User, fillable, updatable } = require('../models/User.model');
const Response = require('../models/Response.model');
const { validateToken } = require('../middlewares/jwt-auth.middleware');
const roles = require('../utils/roles');
const regex = require('../utils/regex');

require('../config/app.config');

const app = express();

app.get('/users', validateToken, (req, res) => {
    if (!req.user) return res.status(404).json(new Response(false, null, { message: 'No user found.' }));

    if (!req.user.active) return res.status(401).json(new Response(false, null, { message: 'User account is disabled.' }));

    return res.json(new Response(true, req.user, null));
});

app.post('/users', [
    body('username')
        .notEmpty()
        .trim().matches(regex.usernames),
    body('fname')
        .notEmpty()
        .trim().matches(regex.names),
    body('lname')
        .notEmpty()
        .trim().matches(regex.names),
    body('password')
        .notEmpty().trim().isLength({ min: 8 }),
    body('email')
        .notEmpty()
        .trim().isEmail()
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    const body = _.pick(req.body, fillable);
    body.password = bcrypt.hashSync(body.password, bcrypt.genSaltSync());
    body.role = roles.client;

    const user = new User(body);

    user.save((err, user) => {
        if (err) return res.status(400).json(new Response(false, null, err));

        return res.status(201).json(new Response(true, user, null));
    });
});

app.put('/users', [
    validateToken,
    body('fname')
        .if(body('fname').notEmpty())
        .trim().matches(regex.names),
    body('lname')
        .if(body('lname').notEmpty())
        .trim().matches(regex.names),
    body('email')
        .if(body('email').notEmpty())
        .trim().isEmail()
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    const body = _.pick(req.body, updatable);
    body.updatedAt = new Date(Date.now());

    User.updateOne(
        { _id: req.user.id, active: true },
        body,
        {new: true, runValidators: true},
        (err, updated) => {
            if (err) return res.status(500).json(new Response(false, null, err));

            if (!updated) return res.status(400).json(new Response(false, null, { message: 'User not found or account disabled.' }));

            return res.json(new Response(true, updated, null));
        }
    );
});

app.put('/users/password', [
    validateToken,
    body('password')
        .notEmpty().trim().isLength({ min: 8, max: 32 })
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    const newPass = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync());

    User.updateOne(
        { _id: req.user.id, active: true },
        { password: newPass },
        { new: true },
        (err, updated) => {
            if (err) return res.status(500).json(new Response(false, null, err));

            if (!updated) return res.status(400).json(new Response(false, null, { message: 'User not found or account disabled.' }));
            
            return res.json(new Response(true, updated, null));
        }
    );
});

app.delete('/users', validateToken, (req, res) => {
    User.updateOne(
        { _id: req.user.id, active: true },
        { active: false },
        {new: true},
        (err, deleted) => {
            if (err) return res.status(500).json(new Response(false, null, err));

            if (!deleted) return res.status(400).json(new Response(false, null, { message: 'User not found or already disabled.' }));

            return res.json(new Response(true, deleted, null));
        }
    );
});

module.exports = app;