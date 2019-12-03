const express = require('express');
const conn = require('../config/database.config');
const _ = require('lodash');
const { body, validationResult } = require('express-validator');
const { validateToken } = require('../middlewares/jwt-auth.middleware');
const { isAdmin } = require('../middlewares/auth.middleware');

const app = express();

app.get('/categories', (req, res) => {
    conn('categories')
        .select('*')
        .then(rows => {
            if (rows.length <= 0) {
                return res.status(404).json('No categories were found.');
            }

            return res.json(rows);
        })
        .catch(error => {
            return res.status(500).json(error);
        });
});

app.get('/categories/:id', (req, res) => {
    const categoryId = req.params.id;

    conn('products')
        .where('category_id', categoryId)
        .select('*')
        .then(rows => {
            if (rows.length <= 0) {
                return res.status(404).json('No products were found.');
            }

            return res.json(rows);
        })
        .catch(error => {
            return res.status(500).json(error);
        });
});

app.post('/categories', [
    validateToken,
    isAdmin,
    body('name')
        .not()
        .isEmpty()
        .trim(),
    body('parent_id')
        .if(body('parent_id').not().isEmpty())
        .isInt({ min: 1 }),
    body('image_id')
        .if(body('image_id').not().isEmpty())
        .isInt({ min: 1 })
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json(errors.array());
    }

    const body = _.pick(req.body, ['name', 'parent_id', 'image_id']);
    body.created_at = new Date(Date.now());
    body.updated_at = new Date(Date.now());

    conn('categories')
        .insert(body)
        .then(inserted => {
            return conn('categories')
                .where('id', inserted)
                .select('*');
        })
        .then(rows => {
            return res.status(201).json(rows[0]);
        })
        .catch(error => {
            return res.status(500).json(error);
        });
});

app.put('/categories/:id', [
    validateToken,
    isAdmin,
    body('name')
        .if(body('name').not().isEmpty())
        .trim(),
        body('parent_id')
        .if(body('parent_id').not().isEmpty())
        .isInt({ min: 1 }),
    body('image_id')
        .if(body('image_id').not().isEmpty())
        .isInt({ min: 1 })
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json(errors.array())
    }

    const categoryId = req.params.id;
    const body = _.pick(req.body, ['name', 'parent_id', 'image_id']);
    body.updated_at = new Date(Date.now());

    conn('categories')
        .where('id', categoryId)
        .update(body)
        .then(updated => {
            const status = updated > 0 ? 200 : 422;
            const response = updated > 0 ? body : updated;
            return res.status(status).json(response);
        })
        .catch(error => {
            return res.status(500).json(error);
        });
});

app.delete('/categories/:id', (req, res) => {
    const categoryId = req.params.id;

    conn('categories')
        .where('id', categoryId)
        .delete()
        .then(deleted => {
            const status = deleted > 0 ? 200 : 422;
            return res.status(status).json(deleted);
        })
        .catch(error => {
            return res.status(500).json(error);
        });
});

module.exports = app;