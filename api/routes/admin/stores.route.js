const express = require('express');
const Response = require('../../models/Response.model');
const { model: Store } = require('../../models/Store.model');
const { validateToken } = require('../../middlewares/jwt-auth.middleware');
const { isAdmin } = require('../../middlewares/auth.middleware');

const app = express();

app.post('/admin/stores/:id/enable', [validateToken, isAdmin], (req, res) => {
    Store.updateOne(
        { _id: req.params.id, active: true, enabled: false },
        { enabled: true },
        (err, updated) => {
            if (err) return res.status(500).json(new Response(false, null, err));

            if (updated.nModified <= 0) return res.status(400).json(new Response(false, null, { message: 'Store already enabled or not found.' }));

            return res.json(updated);
        }
    );
});

app.post('/admin/stores/:id/disable', [validateToken, isAdmin], (req, res) => {
    Store.updateOne(
        { _id: req.params.id, active: true, enabled: true },
        { enabled: false },
        (err, updated) => {
            if (err) return res.status(500).json(new Response(false, null, err));

            if (updated.nModified <= 0) return res.status(400).json(new Response(false, null, { message: 'Store already disabled or not found.' }));

            return res.json(updated);
        }
    );
});

module.exports = app;