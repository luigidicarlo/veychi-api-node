const roles = require('../utils/roles');
const Response = require('../models/Response.model');

const isAdmin = (req, res, next) => {
    if (req.user.role !== roles.admin) {
        return res.status(401).json(new Response(false, null, { message: 'Unauthorized.' }));
    }

    next();
};

module.exports = {
    isAdmin,
};