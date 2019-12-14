const mongoose = require('mongoose');
const constants = require('../utils/constants');

const Schema = mongoose.Schema;

const fillable = [
    'name', 'description', 'shortDescription',
    'price', 'discount', 'images', 
    'tags', 'store', 'category'
];

const updatable = [
    'name', 'description', 'shortDescription',
    'price', 'discount', 'images',
    'tags', 'category'
];

const productSchema = new Schema({
    name: {
        type: String,
        required: true,
        minlength: 3
    },
    description: {
        type: String,
        default: null,
        minlength: constants.descMinLength,
        maxlength: constants.descMaxLength
    },
    shortDescription: {
        type: String,
        default: null,
        minlength: constants.shortDescMinLength,
        maxlength: constants.shortDescMaxLength
    },
    price: {
        type: Number,
        required: true,
        min: constants.minPrice,
        max: constants.maxPrice
    },
    discount: {
        type: Number,
        default: 0,
        min: constants.minDiscount,
        max: constants.maxDiscount
    },
    images: {
        type: [String],
        default: null
    },
    tags: {
        type: [String],
        default: null
    },
    store: {
        type: Schema.Types.ObjectId,
        ref: 'Store'
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category'
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

module.exports = {
    schema: productSchema,
    model: mongoose.model('Product', productSchema),
    fillable,
    updatable
};