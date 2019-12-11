const Store = require('../models/Store.model');

const storeExists = (req, res, next) => {
    const id = req.user.id;

    Store.findById(id, (err, store) => {
        if (err) return res.status(500).json(err);

        if (!store) req.store = null;

        req.store = store;
        next();
    });
};

module.exports = {
    storeExists
};