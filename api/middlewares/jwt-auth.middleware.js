const jwt = require('jsonwebtoken');
const Response = require('../models/Response.model');
const Err = require('../models/Error.model');
const {model: User} = require('../models/User.model');
const msg = require('../utils/messages');
require('../config/app.config');

const validateToken = (req, res, next) => {
    const token = req.header(process.env.AUTH_HEADER);
    
    jwt.verify(token, process.env.JWT_KEY, async (err, decoded) => {
        if (err) return res.status(401).json(new Response(false, null, err));

        try {
            const user = await User.findOne({ _id: decoded.id, active: true });

            if (!user) return res.status(404).json(new Response(false, null, { message: msg.userNotFound }));
    
            req.user = user;
    
            next();
        } catch (err) {
            return res.status(400).json(new Response(false, null, new Err(err)));
        }
    });
};

module.exports = {
    validateToken
};