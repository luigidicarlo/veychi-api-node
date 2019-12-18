const mongoose = require('mongoose');
const Response = require('./Response.model');
const { model: Product } = require('./Product.model');
const { model: Coupon } = require('./Coupon.model');
const regex = require('../utils/regex');
const Schema = mongoose.Schema;
const constants = require('../utils/constants');

const fillable = [
    'name', 'description', 'imageUrl', 
    'rut', 'activity'
];
const updatable = [
    'name', 'description', 'imageUrl',
    'activity', 'rut'
];

const storeSchema = new Schema({
    name: {
        type: String,
        required: true,
        minlength: constants.namesMinLength,
        maxlength: constants.namesMaxLength
    },
    description: {
        type: String,
        default: null,
        minlength: constants.descMinLength,
        maxlength: constants.descMaxLength
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    imageUrl: {
        type: String,
        default: null
    },
    rut: {
        type: String,
        required: true,
        match: regex.rut
    },
    activity: {
        type: String,
        required: true,
        minlength: constants.namesMinLength,
        maxlength: constants.namesMaxLength
    },
    enabled: {
        type: Boolean,
        default: false
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

storeSchema.post('update', function(doc) {
    if (!doc.enabled) {
        Product.updateMany(
            { store: doc._id },
            { active: false },
            (err, updatedProducts) => {
                if (err) throw new Error(err);
    
                Coupon.updateMany(
                    { store: doc._id },
                    { active: false },
                    (err, updatedCoupons) => {
                        if (err) throw new Error(err);
                    }
                );
            }
        );
    }
});

module.exports = {
    schema: storeSchema,
    model: mongoose.model('Store', storeSchema),
    fillable,
    updatable
};