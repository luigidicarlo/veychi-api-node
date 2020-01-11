const { model: Coupon } = require('../models/Coupon.model');

const getTotal = (products = []) => {
    if (!products.length) return 0;

    let subtotal = 0;

    products.forEach(product => {
        subtotal += product.price * (1 - (product.discount / 100));
    });

    return subtotal;
};

const getSubtotal = (products = []) => {
    if (!products.length) return 0;

    let subtotal = 0;

    products.forEach(product => {
        subtotal += product.price;
    });

    return subtotal;
};

const applyCoupons = (coupons = [], products = []) => {
    let total = 0;

    if (!coupons.length) return {
        products,
        total: getTotal(products)
    };

    coupons.forEach(coupon => {
        products.forEach(product => {
            if (String(coupon.store) === String(product.store)) {
                if (coupon.percentage) {
                    product.price = product.price * (1 - (product.discount / 100) - (coupon.value / 100))
                } else {
                    const diff = (product.price * (1 - (product.discount / 100))) - coupon.value;
                    product.price = diff <= 0 ? 0 : diff;
                }
            }
            total += product.price;
        });
    });

    return {
        products,
        total
    };
};

module.exports = {
    getTotal,
    getSubtotal,
    applyCoupons
};