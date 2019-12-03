const conn = require('../config/database.config');

const storeExists = (req, res, next) => {
    const id = req.user.id;

    conn('stores')
        .where('user_id', id)
        .select('*')
        .then(rows => {
            if (rows.length > 0) {
                const store = rows[0];
                req.store = store;
            } else {
                req.store = null;
            }
            next();
        });
};

module.exports = {
    storeExists,
};