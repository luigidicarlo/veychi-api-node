const mongoose = require('mongoose');
const constants = require('../utils/constants');

const Schema = mongoose.Schema;

const fillable = ['name', 'parent', 'imageUrl'];
const updatable = ['name', 'imageUrl', 'parent'];

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        minlength: constants.namesMinLength,
        maxlength: constants.namesMaxLength
    },
    parent: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        default: null
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

module.exports = {
    schema: categorySchema,
    model: mongoose.model('Category', categorySchema),
    fillable,
    updatable
};