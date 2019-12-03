const knex = require('knex');

require('./app.config');

const conn = knex({
    client: 'mysql',
    connection: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
    },
    debug: false // process.env.NODE_ENV === 'dev'
});

module.exports = conn;