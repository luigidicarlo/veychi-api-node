const jwt = require('jsonwebtoken');
require('../config/app.config');

const validateToken = (req, res, next) => {
    const token = req.header(process.env.AUTH_HEADER);
    
    jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                error: err,
                message: 'Unauthorized'
            });
        }

        req.user = decoded;
        next();
    });
};

module.exports = {
    validateToken
};