const { roles } = require('../config/constants');

const isAdmin = (req, res, next) => {
    if (req.user.role !== roles.admin) {
        return res.status(401).json('Unauthorized');
    }

    next();
};

module.exports = {
    isAdmin,
};