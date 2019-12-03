const express = require('express');
const conn = require('../config/database.config');
const _ = require('lodash');
const { validateToken } = require('../middlewares/jwt-auth.middleware');
const { storeExists } = require('../middlewares/stores.middleware');
const { body, validationResult } = require('express-validator');

const app = express();

app.get('/products', (req, res) => {
    conn('products')
        .select('*')
        .then(rows => {
            if (rows.length > 0) {
                return res.json(rows);
            } else {
                return res.status(404).json('No products found.')
            }
        })
});

app.get('/products/:id', (req, res) => {
    conn('products')
        .where('id', req.params.id)
        .select('*')
        .then(rows => {
            if (rows.length > 0) {
                return res.json(rows[0]);
            } else {
                return res.status(404).json('No products found.')
            }
        });
});

app.post('/products', [
    validateToken,
    storeExists,
    body('name')
        .not()
        .isEmpty()
        .matches('^[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ\' -]+$'),
    body('price')
        .not()
        .isEmpty()
        .isFloat({ min: 0 }),
    body('discount')
        .if(body('discount').exists())
        .isFloat({ min: 0, max: 100 }),
    body('category_id')
        .if(body('category_id').exists())
        .isInt({ min: 1 })
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json(errors.array());
    }

    const body = _.pick(req.body, ['name', 'description', 'short_description', 'price', 'discount', 'category_id']);
    body.created_at = new Date(Date.now());
    body.updated_at = new Date(Date.now());

    conn('stores')
        .where('user_id', req.user.id)
        .select('*')
        .then(rows => {
            if (rows.length <= 0) {
                return res.status(401).json('Unauthorized');
            }

            const storeId = rows[0].id;
            body.store_id = storeId;

            return conn('products').insert(body);
        })
        .then(inserted => {
            return conn('products').where('id', inserted).select('*');
        })
        .then(rows => {
            return res.status(201).json(rows[0]);
        })
        .catch(error => {
            return res.status(500).json(error);
        });
});

app.put('/products/:id', [
    validateToken,
    storeExists,
    body('name')
        .if(body('name').not().isEmpty())
        .matches('^[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ\' -]+$'),
    body('price')
        .if(body('price').not().isEmpty())
        .isFloat({ min: 0 }),
    body('discount')
        .if(body('discount').not().isEmpty())
        .isFloat({ min: 0, max: 100 }),
    body('category_id')
        .if(body('category_id').not().isEmpty())
        .isInt({ min: 1 })
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json(errors.array());
    }

    conn('products')
        .where('store_id', req.store.id)
        .select('*')
        .then(rows => {
            if (rows.length <= 0) {
                return res.status(404).json('Product not found.')
            }

            const body = _.pick(req.body, ['name', 'description', 'short_description', 'price', 'discount', 'category_id']);
            body.updated_at = new Date(Date.now());
            
            return conn('products')
                .where('id', req.params.id)
                .update(body);
        })
        .then(updated => {
            return conn('products')
                .where('id', req.params.id)
                .select('*');
        })
        .then(rows => {
            return res.json(rows[0]);
        })
        .catch(error => {
            return res.status(500).json(error);
        });
});

app.delete('/products/:id', [
    validateToken,
    storeExists
], (req, res) => {
    conn('products')
        .where('store_id', req.store.id)
        .select('*')
        .then(rows => {
            if (rows.length <= 0) {
                return res.status(404).json('Product not found.');
            }

            return conn('products')
                .where('id', req.params.id)
                .delete();
        })
        .then(deleted => {
            return res.json(deleted);
        })
        .catch(error => {
            return res.status(500).json(error);
        });
});

module.exports = app;