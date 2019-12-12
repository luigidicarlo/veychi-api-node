const express = require('express');
const Response = require('../models/Response.model');
const { model: Product } = require('../models/Product.model');
const conn = require('../config/database.config');
const { validateToken } = require('../middlewares/jwt-auth.middleware');

const app = express();

app.get('/tags', (req, res) => {
    Product.find({ active: true }, (err, products) => {
        let tags = [];

        if (err) return res.status(500).json(new Response(false, null, err));

        if (!products) return res.status(404).json(new Response(false, null, { message: 'No products found.' }));

        products.forEach(product => {
            product.tags.forEach(tag => {
                tags.push(tag);
            });
        });

        tags = tags.filter((tag, index) => tags.indexOf(tag) === index);

        return res.json(new Response(true, tags, null));
    });
});

module.exports = app;