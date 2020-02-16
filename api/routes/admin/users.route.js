const express = require('express');
const { check, validationResult } = require('express-validator');
const Response = require('../../models/Response.model');
const Err = require('../../models/Error.model');
const { validateToken } = require('../../middlewares/jwt-auth.middleware');
const { isAdmin } = require('../../middlewares/auth.middleware');
const { model: User, onDisabled, onEnabled } = require('../../models/User.model');
const msg = require('../../utils/messages');

const app = express();

app.get('/admin/users', [
    validateToken,
    isAdmin
], async (req, res) => {
    try {
        const users = await User.find()
            .catch(err => { throw err; });

        if (!users.length) throw new Error(msg.usersNotFound);

        return res.json(new Response(true, users, null));
    } catch (err) {
        return res.json(new Response(false, null, new Err(err)));
    }
});

app.put('/admin/users/:id', [
    validateToken,
    isAdmin,
    check('id').notEmpty().trim().isMongoId()
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.json(new Response(false, null, errors.array()));

    try {
        const updated = await User.updateOne({ _id: req.params.id, active: false }, { active: true })
            .catch(err => { throw err; });

        if (!updated.nModified) return res.json(new Response(false, null, msg.userNotFound));

        await onEnabled(req.params.id)
            .catch(err => { throw err; });

        const user = await User.findOne({ _id: req.params.id, active: true })
            .catch(err => { throw err; });

        return res.json(new Response(true, user, null));
    } catch (err) {
        return res.json(new Response(false, null, new Err(err)));
    }
});

app.delete('/admin/users/:id', [
    validateToken,
    isAdmin,
    check('id').notEmpty().trim().isMongoId()
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.json(new Response(false, null, errors.array()));

    try {
        const updated = await User.updateOne({ _id: req.params.id, active: true }, { active: false })
            .catch(err => { throw err; });

        if (!updated.nModified) return res.json(new Response(false, null, { message: msg.userAlreadyDisabled }));

        await onDisabled(req.params.id)
            .catch(err => { throw err; });

        const user = await User.findOne({ _id: req.params.id, active: false })
            .catch(err => { throw err; });

        return res.json(new Response(true, user, null));
    } catch (err) {
        return res.json(new Response(false, null, new Err(err)));
    }
});

module.exports = app;