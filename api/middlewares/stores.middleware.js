const Response = require('../models/Response.model');
const { model: Store } = require('../models/Store.model');

const storeExists = (req, res, next) => {
    Store.findOne({ user: req.user.id, active: true }, (err, store) => {
        if (err) return res.status(400).json(new Response(false, null, err));

        if (!store) req.store = null;

        req.store = store;
        next();
    });
};

module.exports = {
    storeExists
};