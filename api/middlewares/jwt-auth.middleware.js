const jwt = require('jsonwebtoken');
const Response = require('../models/Response.model');
const {model: User} = require('../models/User.model');
require('../config/app.config');

const validateToken = (req, res, next) => {
    const token = req.header(process.env.AUTH_HEADER);
    
    jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
        if (err) return res.status(401).json(new Response(false, null, err))

        User.findById(decoded.id, (err, user) => {
            if (err) return res.status(500).json(new Response(false, null, err));

            if (!user) return res.status(404).json(new Response(false, null, { message: 'User does not exist.' }));

            if (!user.active) return res.status(401).json(new Response(false, null, { message: 'User account is inactive.' }));

            req.user = user;
            next();
        });
    });
};

module.exports = {
    validateToken
};