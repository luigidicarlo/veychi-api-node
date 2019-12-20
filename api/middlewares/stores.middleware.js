const Response = require('../models/Response.model');
const Err = require('../models/Error.model');
const { model: Store } = require('../models/Store.model');

const storeExists = async (req, res, next) => {
    try {
        const store = await Store.findOne({ user: req.user.id, active: true });

        if (!store) req.store = null;

        req.store = store;

        next();
    } catch (err) {
        return res.status(400).json(new Response(false, null, new Err(err)));
    }
};

module.exports = {
    storeExists
};