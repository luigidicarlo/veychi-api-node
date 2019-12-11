const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const regex = require('../utils/regex');
const Schema = mongoose.Schema;

const fillable = [
    'name', 'description', 'imageUrl', 
    'rut', 'activity'
];
const updatable = [
    'description', 'imageUrl', 'rut',
    'activity'
];

const storeSchema = new Schema({
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
        unique: true,
        match: regex.rut
    },
    activity: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: new Date(Date.now())
    }
});

storeSchema.plugin(uniqueValidator, {
    message: '{PATH} is expected to be unique.'
});

module.exports = mongoose.model('Store', storeSchema);
module.exports = {
    fillable, updatable
};