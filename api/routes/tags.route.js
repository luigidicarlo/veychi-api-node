const express = require('express');
const _ = require('lodash');
const conn = require('../config/database.config');
const { validateToken } = require('../middlewares/jwt-auth.middleware');

const app = express();

app.get('/tags', (req, res) => {
    conn('tags')
        .select('*')
        .then(rows => {
            return res.json(rows);
        })
        .catch(error => {
            return res.status(500).json(error);
        })
});

app.post('/tags', validateToken, (req, res) => {
    const body = _.pick(req.body, ['name']);
    body.created_at = new Date(Date.now());
    body.updated_at = new Date(Date.now());

    conn('tags')
        .insert(body)
        .then(inserted => {
            return conn('tags')
                .where('id', inserted)
                .select('*');
        })
        .then(rows => {
            return res.status(201).json(rows[0]);
        })
        .catch(error => {
            return res.status(500).json(error);
        })
});

module.exports = app;