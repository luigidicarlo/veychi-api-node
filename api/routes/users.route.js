const express = require('express');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { model: User, fillable, updatable } = require('../models/User.model');
const { validateToken } = require('../middlewares/jwt-auth.middleware');
const roles = require('../utils/roles');
const regex = require('../utils/regex');

require('../config/app.config');

const app = express();

app.get('/users', validateToken, (req, res) => {
    User.findById(req.user.id, (err, user) => {
        if (err) return res.status(400).json(err);
        
        return res.json(_.omit(user, ['password']));
    });
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

    if (!errors.isEmpty()) return res.status(400).json(errors.array());

    const body = _.pick(req.body, fillable);
    body.password = bcrypt.hashSync(body.password, bcrypt.genSaltSync());
    body.role = roles.client;
    body.createdAt = new Date(Date.now());
    body.updatedAt = new Date(Date.now());

    const user = new User(body);

    user.save((err, user) => {
        if (err) return res.status(400).json(err);
        return res.status(201).json(user);
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

    if (!errors.isEmpty()) return res.status(400).json(errors.array());

    const body = _.pick(req.body, updatable);
    body.updatedAt = new Date(Date.now());

    User.findByIdAndUpdate(req.user.id, body, {new: true}, (err, updated) => {
        if (err) return res.status(500).json(err);
        return res.json(updated);
    });
});

app.put('/users/password', [
    validateToken,
    body('password')
        .notEmpty().trim().isLength({ min: 8 })
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(errors.array());

    const newPass = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync());

    User.findByIdAndUpdate(
        req.user.id,
        { password: newPass },
        { new: true },
        (err, updated) => {
            if (err) return res.status(500).json(err);
            
            return res.json(updated);
        }
    );
});

app.delete('/users', validateToken, (req, res) => {
    User.findByIdAndDelete(
        req.user.id,
        (err, deleted) => {
            if (err) return res.status(500).json(err);
            
            return res.json(deleted);
        }
    );
});

module.exports = app;