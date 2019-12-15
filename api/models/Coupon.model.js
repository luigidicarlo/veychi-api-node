const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const constants = require('../utils/constants');
const regex = require('../utils/regex');

const Schema = mongoose.Schema;

const fillable = [
    'name', 'expiration', 'value',
    'percentage'
];

const updatable = [
    'name', 'expiration', 'value',
    'percentage'
];

const couponSchema = new Schema({
    name: {
        type: String,
        required: true,
        minlength: constants.namesMinLength,
        maxlength: constants.namesMaxLength,
        match: regex.couponNames
    },
    expiration: {
        type: Date,
        required: true
    },
    value: {
        type: Number,
        required: true,
        min: constants.minDiscount,
        max: constants.maxPrice
    },
    percentage: {
        type: Boolean,
        default: true
    },
    store: {
        type: Schema.Types.ObjectId,
        ref: 'Store'
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

couponSchema.plugin(uniqueValidator, {
    message: '{PATH} is expected to be unique.'
});

module.exports = {
    schema: couponSchema,
    model: mongoose.model('Coupon', couponSchema),
    fillable,
    updatable
};