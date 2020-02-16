const express = require('express');
const crypto = require('crypto');
const { validateToken } = require('../middlewares/jwt-auth.middleware');

const app = express();

// Routes to be implemented
app.get('/', (req, res) => {
    return res.json('RESTful API for Veychi Ltd.');
});

// Debugging
app.get('/debug', validateToken, (req, res) => {
    return res.json(req.token);
});

// Key generator
app.get('/key', (req, res) => {
    const key = crypto.randomBytes(16).toString('hex');
    return res.json(key);
})

// Register routes
app.use(require('./auth.route'));
app.use(require('./users.route'));
app.use(require('./stores.route'));
app.use(require('./products.route'));
app.use(require('./categories.route'));
app.use(require('./tags.route'));
app.use(require('./coupons.route'));
app.use(require('./orders.route'));
app.use(require('./media.route'));
app.use(require('./admin/stores.route'));
app.use(require('./admin/users.route'));
app.use(require('./admin/orders.route'));

module.exports = app;