const express = require('express');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const {check, validationResult} = require('express-validator');
const Response = require('../models/Response.model');
const { model: User } = require('../models/User.model');
const { validateToken } = require('../middlewares/jwt-auth.middleware');
const constants = require('../utils/constants');
const msg = require('../utils/messages');

const app = express();

app.post('/login', [
    check('username')
        .notEmpty().trim().isLength({ min: constants.usernameMinLength, max: constants.usernameMaxLength }),
    check('password')
        .notEmpty().trim().isLength({ min: constants.usernameMinLength, max: constants.usernameMaxLength })
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.json(new Response(false, null, errors.array()));

    const loginInfo = _.pick(req.body, ['username', 'password']);

    User.findOne(
        {
            $or: [
                { email: loginInfo.username},
                { username: loginInfo.username}
            ],
            active: true
        },
        (err, user) => {
            if (err) return res.json(new Response(false, null, err));

            if (!user) return res.json(new Response(false, null, { message: msg.invalidLogin }));

            if (!bcrypt.compareSync(loginInfo.password, user.password)) {
                return res.json(new Response(false, null, { message: msg.invalidLogin }));
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
    check('username')
        .if(check('username').notEmpty())
        .trim().isLength({ min: constants.usernameMinLength, max: constants.usernameMaxLength })
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.json(new Response(false, null, errors.array()));

    const body = _.pick(req.body, ['username']);

    User.findOne(
        {
            $or: [
                {email: body.username},
                {username: body.username}
            ], 
            active: true
        },
        (err, user) => {
            if (err) return res.json(new Response(false, null, err));

            if (!user) return res.json(new Response(false, null, { message: msg.userNotFound }));

            const token = crypto.randomBytes(16).toString('hex');

            User.updateOne(
                { _id: user._id, active: true },
                {
                    recoverToken: token,
                    recoverTokenExp: Date.now() + constants.recoverTokenExp
                },
                { runValidators: true },
                (err, updated) => {
                    if (err) return res.json(new Response(false, null, err));

                    if (updated.nModified <= 0) return res.json(new Response(false, null, { message: msg.userNotFound }));

                    return res.json(new Response(true, token, null));
                }
            );
        }
    );
});

app.post('/password/recovery-change', [
    check('password')
        .notEmpty().trim().isLength({ min: constants.usernameMinLength, max: constants.usernameMaxLength }),
    check('token')
        .notEmpty().trim()
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.json(new Response(false, null, errors.array()));

    const body = _.pick(req.body, ['password', 'token']);

    User.findOne({ recoverToken: body.token, active: true }, (err, user) => {
        if (err) return res.json(new Response(false, null, err));

        if (!user) return res.json(new Response(false, null, { message: msg.invalidRecoverToken }));

        if (Date.now() > user.recoverTokenExp) return res.json(new Response(false, null, { message: msg.invalidRecoverToken }));

        User.updateOne(
            { _id: user._id, active: true },
            {
                password: bcrypt.hashSync(body.password, bcrypt.genSaltSync()),
                recoverToken: null,
                recoverTokenExp: null
            },
            { runValidators: true },
            (err, updated) => {
                if (err) return res.json(new Response(false, null, err));

                if (updated.nModified <= 0) return res.json(new Response(false, null, { message: msg.invalidRecoverToken }));

                User.findOne({ _id: user._id, active: true }, (err, updatedUser) => {
                    if (err) return res.json(new Response(false, null, err));

                    return res.json(new Response(true, updatedUser, null));
                });
            }
        )
    });
});

module.exports = app;