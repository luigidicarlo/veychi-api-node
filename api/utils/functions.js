const validator = require('validator');

const validateCartElement = (element, res) => {
    if (Number(element.product_id) <= 0) {
        return res.status(400).json('Cannot process data. Invalid product ID given.');
    }

    if (Number(element.user_id) <= 0) {
        return res.status(400).json('Cannot process data. Invalid user ID given.');
    }

    if (Number(element.quantity) <= 0) {
        return res.status(400).json('Cannot process data. Invalid quantity given.');
    }
};

module.exports = {
    validateCartElement,
};