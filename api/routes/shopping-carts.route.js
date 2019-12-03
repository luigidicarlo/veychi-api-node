const express = require('express');
const _ = require('lodash');
const {body, validationResult} = require('express-validator');
const { validateCartElement } = require('../utils/functions');
const conn = require('../config/database.config');
const { validateToken } = require('../middlewares/jwt-auth.middleware');

const app = express();

app.get('/carts', validateToken, (req, res) => {
    conn('shopping_carts')
        .where('shopping_carts.user_id', req.user.id)
        .innerJoin('products', 'shopping_carts.product_id', 'products.id')
        .select('shopping_carts.id as cart_id', 'shopping_carts.quantity', 'products.*')
        .then(rows => {
            if (rows.length <= 0) {
                return res.status(404).json('No products found.');
            }

            return res.json(rows);
        })
        .catch(error => {
            return res.status(500).json(error);
        });
        
});

app.post('/carts', validateToken, (req, res) => {
    const body = req.body;

    if (body.length <= 0) {
        return res.status(400).json('Bad request. No data provided');
    }

    const data = [];

    body.forEach(cartElem => {
        const cart = _.pick(cartElem, ['product_id', 'user_id', 'quantity']);
        cart.created_at = new Date(Date.now());
        cart.updated_at = new Date(Date.now());
        validateCartElement(cart, res);
        data.push(cart);
    });

    conn('shopping_carts')
        .insert(data)
        .then(inserted => {
            return res.status(201).json(inserted);
        })
        .catch(error => {
            return res.status(500).json(error);
        })
});

app.put('/carts/:id', [
    validateToken,
    body('quantity')
        .not()
        .isEmpty()
        .isInt({min: 1})
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json(errors.array());
    }

    const data = _.pick(req.body, ['quantity']);

    conn('shopping_carts')
        .where('id', req.params.id)
        .update(data)
        .then(updated => {
            return res.json(updated);
        })
        .catch(error => {
            return res.status(500).json(error);
        });
});

app.delete('/carts/:id', validateToken, (req, res) => {
    const cartId = req.params.id;

    conn('shopping_carts')
        .where({ user_id: req.user.id, id: cartId })
        .delete()
        .then(deleted => {
            return res.json(deleted);
        })
        .catch(error => {
            return res.status(500).json(error);
        });
});

module.exports = app;