const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const regex = require('../utils/regex');

const Schema = mongoose.Schema;

const productSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        minlength: 3
    },
    description: {
        type: String,
        default: null
    },
    shortDescription: {
        type: String,
        default: null
    },
    price: {
        type: Number,
        required: true,
        min: 0.01,
        max: 999999999999.99
    },
    discount: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
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
    }
});

productSchema.plugin(uniqueValidator, {
    message: '{PATH} is expected to be unique.'
})

module.exports = mongoose.model('Product', productSchema);