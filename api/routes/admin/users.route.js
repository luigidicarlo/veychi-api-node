const express = require('express');
const { check, validationResult } = require('express-validator');
const Response = require('../../models/Response.model');
const Err = require('../../models/Error.model');
const { validateToken } = require('../../middlewares/jwt-auth.middleware');
const { isAdmin } = require('../../middlewares/auth.middleware');
const { model: User } = require('../../models/User.model');
const msg = require('../../utils/messages');

const app = express();

app.get('/admin/users', [
    validateToken,
    isAdmin
], async (req, res) => {
    try {
        const users = await User.find();

        if (!users.length) throw new Error(msg.usersNotFound);

        return res.json(new Response(true, users, null));
    } catch (err) {
        return res.status(400).json(new Response(false, null, new Err(err)));
    }
});

app.put('/admin/users/:id', [
    validateToken,
    isAdmin,
    check('id').notEmpty().trim().isMongoId()
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    try {
        const updated = await User.updateOne({ _id: req.params.id, active: false }, { active: true });

        if (!updated.nModified) return res.status(400).json(new Response(false, null, msg.userNotFound));

        const user = await User.findOne({ _id: req.params.id, active: true });

        return res.json(new Response(true, user, null));
    } catch (err) {
        return res.status(400).json(new Response(false, null, new Err(err)));
    }
});

app.delete('/admin/users/:id', [
    validateToken,
    isAdmin,
    check('id').notEmpty().trim().isMongoId()
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json(new Response(false, null, errors.array()));

    try {
        const updated = User.updateOne({ _id: req.params.id, active: true }, { active: false });

        if (!updated.nModified) return res.status(400).json(new Response(false, null, { message: userAlreadyDisabled }));

        const user = User.findOne({ _id: req.params.id, active: false });

        return res.json(new Response(true, user, null));
    } catch (err) {
        return res.status(400).json(new Response(false, null, new Err(err)));
    }
});

module.exports = app;