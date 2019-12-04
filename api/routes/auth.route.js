const express = require('express');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const conn = require('../config/database.config');
const {body, validationResult} = require('express-validator');

const app = express();

app.post('/login', (req, res) => {
    const loginInfo = _.pick(req.body, ['username', 'password']);

    conn('users')
        .where({ username: loginInfo.username })
        .orWhere({ email: loginInfo.username })
        .select('*')
        .then((users) => {
            const user = users[0];

            if (!user || user === null) {
                return res.status(401).json('Invalid access credentials');
            }
            
            if (!bcrypt.compareSync(loginInfo.password, user.password)) {
                return res.status(401).json('Invalid access credentials');
            }

            const token = jwt.sign({
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            }, process.env.JWT_SECRET, { expiresIn: '3 days' });

            return res.status(200).json(token);
        })
        .catch(() => {
            return res.status(403).json({
                message: 'Provide login details'
            });
        });
});

app.post('/password-recovery/token', [
    body('email')
        .if(body('email').not().isEmpty())
        .trim()
        .isEmail(),
    body('username')
        .if(body('username').not().isEmpty())
        .not()
        .isEmpty()
        .trim()
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json(errors.array());
    }

    const body = _.pick(req.body, ['email', 'username']);

    conn('users')
        .where('email', body.email)
        .orWhere('username', body.username)
        .select('*')
        .then(rows => {
            if (rows.length <= 0) {
                return res.status(404).json('User not found.');
            }

            const user = rows[0];

            const token = crypto.randomBytes(16).toString('hex');

            const data = {
                email: user.email,
                token
            };

            return conn('password_recovery')
                .insert(data)
        })
        .then(inserted => {
            return conn('password_recovery')
                .where('email', body.email)
                .select('*');
        })
        .then(rows => {
            return res.status(201).json(rows[0]);
        })
        .catch(error => {
            return res.status(500).json(error);
        });
});

app.post('/password-recovery/change', [
    body('password')
        .not().isEmpty()
        .trim(),
    body('token')
        .not().isEmpty()
        .trim()
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json(errors.array());
    }

    const body = _.pick(req.body, ['password', 'token']);

    conn('password_recovery')
        .where('token', body.token)
        .join('users', 'password_recovery.email', 'users.email')
        .select('id')
        .then(rows => {
            if (rows <= 0) {
                return res.status(404).json('User not found. Password recovery not possible.');
            }

            const user = rows[0];
            const newPass = bcrypt.hashSync(body.password, 10);

            return conn('users')
                .where('id', user.id)
                .update({password: newPass});
        })
        .then(updated => {
            const status = updated > 0 ? 200 : 400;
            return res.status(status).json(200);
        })
        .catch(error => {
            return res.status(500).json(error);
        });
});

module.exports = app;