const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const couponSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        minlength: 4
    },
    expiration: {
        type: Date,
        required: true
    },
    value: {
        type: Number,
        required: true,
        min: 0.01,
        max: 999999999999.99
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
    }
});

couponSchema.plugin(uniqueValidator, {
    message: '{PATH} is expected to be unique.'
});

module.exports = mongoose.model('Coupon', couponSchema);