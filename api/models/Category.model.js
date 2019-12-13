const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const constants = require('../utils/constants');

const Schema = mongoose.Schema;

const fillable = ['name', 'parent', 'imageUrl'];
const updatable = ['name', 'imageUrl'];

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        minlength: constants.namesMinLength,
        maxlength: constants.namesMaxLength
    },
    parent: {
        type: Schema.Types.ObjectId,
        ref: 'Category'
    },
    imageUrl: {
        type: String,
        default: null
    },
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: new Date(Date.now())
    },
    updatedAt: {
        type: Date,
        default: null
    }
});

categorySchema.plugin(uniqueValidator, {
    message: '{PATH} is expected to be unique.'
});

module.exports = {
    schema: categorySchema,
    model: mongoose.model('Category', categorySchema),
    fillable,
    updatable
};