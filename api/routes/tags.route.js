const express = require('express');
const Response = require('../models/Response.model');
const Err = require('../models/Error.model');
const { model: Product } = require('../models/Product.model');
const msg = require('../utils/messages');

const app = express();

app.get('/tags', async (req, res) => {
    try {
        const products = await Product.find({ active: true })
            .catch(err => { throw err; });

        if (!products) return res.status(404).json(new Response(false, null, { message: msg.productsNotFound }));

        let tags = [];

        products.forEach(product => {
            product.tags.forEach(tag => {
                tags.push(tag);
            });
        });

        tags = tags.filter((tag, index) => tags.indexOf(tag) === index);

        return res.json(new Response(true, tags, null));
    } catch (err) {
        return res.status(400).json(new Response(false, null, new Err(err)));
    }
});

module.exports = app;