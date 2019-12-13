const getSubtotal = (products = []) => {
    let subtotal = 0;

    products.forEach(product => {
        subtotal += product.price * (1 - (product.discount / 100));
    });

    return subtotal;
};

const applyCoupons = (coupons = [], products = [], subtotal) => {
    if (coupons.length <= 0) return subtotal;

    coupons.forEach(coupon => {
        const now = new Date(Date.now());
        if (now <= coupon.expiration) {
            products.forEach(product => {
                if (product.store === coupon.store) {
                    if (coupon.percentage) {
                        product.price *= 1 - (coupon.value / 100);
                    } else {
                        const newPrice = product.price - coupon.value;
                        product.price = newPrice <= 0 ? 0 : newPrice;
                    }
                }
            });
        }
    });

    let total = getSubtotal(products);

    return total;
};

module.exports = {
    getSubtotal,
    applyCoupons
};