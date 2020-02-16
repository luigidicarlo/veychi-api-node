const mongoose = require('mongoose');
const regex = require('../utils/regex');
const constants = require('../utils/constants');
const { model: Product } = require('./Product.model');
const { model: Coupon } = require('./Coupon.model');

const Schema = mongoose.Schema;

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

const onDisabled = async (id) => {
    try {
        await Product.updateMany({ store: id }, { enabled: false })
            .catch(err => { throw err; });
        await Coupon.updateMany({ store: id }, { enabled: false })
            .catch(err => { throw err; });
        return Promise.resolve(true);
    } catch (err) {
        throw err;
    }
};

const onEnabled = async (id) => {
    try {
        if (id) {
            await Product.updateMany({ store: id }, { enabled: true })
                .catch(err => { throw err; });
            await Coupon.updateMany({ store: id }, { enabled: true })
                .catch(err => { throw err; });
            return Promise.resolve(true);
        }
    } catch (err) {
        throw err;
    }
};

module.exports = {
    schema: storeSchema,
    model: mongoose.model('Store', storeSchema),
    fillable,
    updatable,
    onDisabled,
    onEnabled
};