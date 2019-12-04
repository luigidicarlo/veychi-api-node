const express = require('express');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { validateToken } = require('../middlewares/jwt-auth.middleware');
const { roles } = require('../config/constants');
const conn = require('../config/database.config');

require('../config/app.config');

const app = express();

app.get('/users', validateToken, (req, res) => {
    return res.status(200).json();
});

app.post('/users', [
    body('username')
        .not()
        .isEmpty()
        .isAlphanumeric(process.env.LOCALE),
    body('names')
        .not()
        .isEmpty()
        .matches(process.env.NAME_PATTERN),
    body('last_names')
        .not()
        .isEmpty()
        .matches(process.env.NAME_PATTERN),
    body('email')
        .not()
        .isEmpty()
        .isEmail()
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json(errors.array());
    }

    const body = _.pick(req.body, ['username', 'names', 'last_names', 'password', 'email']);
    body.password = bcrypt.hashSync(body.password, 10);
    body.role = roles.client;
    body.created_at = new Date(Date.now());
    body.updated_at = new Date(Date.now());

    conn('users')
        .insert(body)
        .then((inserted) => {
            const newUser = _.pick(body, ['username', 'email', 'names', 'last_names', 'created_at', 'updated_at'])
            newUser.id = inserted[0];

            if (inserted.length > 0) {
                return res.status(201).json(newUser);
            } else {
                return res.status(422).json('Could not register new user.')
            }
    });
});

app.put('/users', [
    validateToken,
    body('username')
        .not()
        .isEmpty()
        .isAlphanumeric(process.env.LOCALE),
    body('names')
        .not()
        .isEmpty()
        .matches(process.env.NAME_PATTERN),
    body('last_names')
        .not()
        .isEmpty()
        .isAlpha(process.env.NAME_PATTERN),
    body('email')
        .isEmail()
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json(errors.array());
    }

    const body = _.pick(req.body, ['username', 'names', 'last_names', 'email']);
    body.updated_at = new Date(Date.now());
    
    conn('users')
        .where('id', req.user.id)
        .update(body)
        .then((updated) => {
            return res.status(200).json(updated);
        })
        .catch(error => {
            return res.status(422).json(error);
        });
});

app.put('/change-password', [
    validateToken,
    body('password')
        .not().isEmpty().trim()
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json(errors.array());
    }

    const newPass = bcrypt.hashSync(req.body.password, 10);

    conn('users')
        .where('id', req.user.id)
        .update({ password: newPass})
        .then(updated => {
            const code = update > 0 ? 200 : 400;
            return res.status(code).json(updated);
        });
});

app.delete('/users', validateToken, (req, res) => {
    conn('users')
        .where('id', req.user.id)
        .del()
        .then(deleted => {
            return res.status(200).json(deleted);
        })
        .catch(error => {
            return res.status(422).json(error);
        });
});

module.exports = app;