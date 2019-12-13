const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { schema: Product } = require('./Product.model');
const { schema: Coupon } = require('./Coupon.model');
const { schema: User } = require('./User.model');
const constants = require('../utils/constants');

const Schema = mongoose.Schema;

const statuses = [
    'PENDING', 'PROCESSING', 'COMPLETE', 'FAILED'
];

const fillable = [
    'products', 'coupons'
];

const updatable = ['status'];

const orderSchema = new Schema({
    products: {
        type: [Product],
        required: true
    },
    coupons: {
        type: [Coupon],
        default: null
    },
    subtotal: {
        type: Number,
        min: constants.minPrice,
        max: constants.maxPrice * constants.maxPrice
    },
    total: {
        type: Number,
        min: constants.minDiscount,
        max: constants.maxPrice * constants.maxPrice
    },
    user: {
        type: User,
        required: true
    },
    status: {
        type: String,
        default: statuses[0],
        enum: statuses
    },
    createdAt: {
        type: Date,
        default: new Date(Date.now())
    },
    updatedAt: {
        type: Date,
        default: null
    },
    active: {
        type: Boolean,
        default: true
    }
});

orderSchema.plugin(uniqueValidator, { message: '{PATH} is expected to be unique.' });

module.exports = {
    schema: orderSchema,
    model: mongoose.model('Order', orderSchema),
    fillable,
    updatable
};