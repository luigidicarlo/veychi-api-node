const express = require('express');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const conn = require('../config/database.config');

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

module.exports = app;