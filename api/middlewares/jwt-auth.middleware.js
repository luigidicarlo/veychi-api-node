const jwt = require('jsonwebtoken');
const {model: User} = require('../models/User.model');
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

        User.findById(decoded.id, (err, user) => {
            if (err) return res.status(500).json(err);

            if (!user) return res.status(404).json('User does not exist.');

            if (!user.active) return res.status(401).json('User account is inactive.');

            req.user = decoded;
            next();
        });
    });
};

module.exports = {
    validateToken
};