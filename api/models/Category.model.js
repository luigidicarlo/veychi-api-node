const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        minlength: 3
    },
    parent: {
        type: Schema.Types.ObjectId,
        ref: 'Category'
    },
    imageUrl: {
        type: String,
        default: null
    }
});

categorySchema.plugin(uniqueValidator, {
    message: '{PATH} is expected to be unique.'
});

module.exports = mongoose.model('Category', categorySchema);