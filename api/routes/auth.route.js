const express = require('express');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Response = require('../models/Response.model');
const { model: User } = require('../models/User.model');
const {body, validationResult} = require('express-validator');

const app = express();

app.post('/login', [
    body('username')
        .notEmpty(),
    body('password')
        .notEmpty()
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    const loginInfo = _.pick(req.body, ['username', 'password']);

    User.findOne(
        {$or: [
            { email: loginInfo.username},
            { username: loginInfo.username}
        ]},
        (err, user) => {
            if (err) return res.status(500).json(new Response(false, null, err));

            if (!user) return res.status(404).json(new Response(false, null, { message: 'Invalid login details.' }));

            if (!bcrypt.compareSync(loginInfo.password, user.password)) {
                return res.status(401).json(new Response(false, null, { message: 'Invalid login details.' }));
            }

            const token = jwt.sign(
                { id: user._id },
                process.env.JWT_KEY,
                { expiresIn: process.env.JWT_EXP }
            );

            return res.json(new Response(true, token, null));
        }
    );
});

app.post('/password/token', [
    body('username')
        .if(body('username').notEmpty())
        .trim()
        .isEmail(),
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    const body = _.pick(req.body, ['username']);

    User.findOne({
        $or: [
            {email: body.username},
            {username: body.username}
        ]},
        (err, user) => {
            if (err) return res.status(500).json(new Response(false, null, err));

            if (!user) return res.status(404).json(new Response(false, null, { message: 'User not found.' }));

            const token = crypto.randomBytes(16).toString('hex');

            User.findByIdAndUpdate(
                user._id,
                {
                    recoverToken: token,
                    recoverTokenExp: Date.now() + (3600 * 24 * 1000)
                },
                { new: true },
                (err, updated) => {
                    if (err) return res.status(500).json(new Response(false, null, err));

                    return res.json(new Response(true, { token, user: updated }, null));
                }
            );
        }
    );
});

app.post('/password/recovery-change', [
    body('password')
        .notEmpty()
        .trim(),
    body('token')
        .notEmpty()
        .trim()
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    const body = _.pick(req.body, ['password', 'token']);

    User.findOne({ recoverToken: body.token }, (err, user) => {
        if (err) res.status(500).json(new Response(false, null, err));

        if (!user) res.status(404).json(new Response(false, null, { message: 'Cannot recover password. Invalid token.' }));

        if (Date.now() > user.recoverTokenExp) return res.status(401).json(new Response(false, null, { message: 'Cannot recover password. Invalid token.' }));

        User.findByIdAndUpdate(
            user._id,
            {
                password: bcrypt.hashSync(body.password, bcrypt.genSaltSync()),
                recoverToken: null,
                recoverTokenExp: null
            },
            { new: true },
            (err, updated) => {
                if (err) return res.status(500).json(new Response(false, null, err));

                return res.json(new Response(true, updated, null));
            }
        )
    });
});

module.exports = app;