const mongoose = require('mongoose');
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
    products: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        }
    ],
    coupons: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Coupon',
            default: null
        }
    ],
    subtotal: {
        type: Number,
        min: constants.minDiscount,
        max: constants.maxPrice * constants.maxPrice,
        default: 0
    },
    total: {
        type: Number,
        min: constants.minDiscount,
        max: constants.maxPrice * constants.maxPrice,
        default: 0
    },
    user: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
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
    },
    enabled: {
        type: Boolean,
        default: true
    }
});

module.exports = {
    schema: orderSchema,
    model: mongoose.model('Order', orderSchema),
    fillable,
    updatable
};