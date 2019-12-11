const roles = require('../utils/roles');

const isAdmin = (req, res, next) => {
    if (req.user.role !== roles.admin) {
        return res.status(401).json('Unauthorized');
    }

    next();
};

module.exports = {
    isAdmin,
};