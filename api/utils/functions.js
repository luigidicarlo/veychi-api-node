const { model: Product } = require('../models/Product.model');
const { model: Coupon } = require('../models/Coupon.model');

const getSubtotal = async (products = []) => {
    let subtotal = 0;
};

const applyCoupons = async (coupons = [], products = [], subtotal) => {
    if (!coupons.length) return subtotal;

    coupons.forEach(async coupon => {
        try {
            const coup = await Coupon.findById(coupon)
                .catch(err => { throw err; });

            const now = new Date(Date.now());

            if (now <= coup.expiration) {
                if (coup.percentage) {
                    subtotal *= 1 - (coup.value / 100);
                } else {
                    const diff = subtotal - coup.value;
                    subtotal = diff <= 0 ? 0 : diff;
                }
            }
        } catch (err) {
            throw err;
        }
    });

    let total = getSubtotal(products);

    return total;
};

module.exports = {
    getSubtotal,
    applyCoupons
};