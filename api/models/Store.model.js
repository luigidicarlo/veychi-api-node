const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const regex = require('../utils/regex');
const Schema = mongoose.Schema;
const {model: User} = require('./User.model');

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
        default: new Date(Date.now())
    },
    active: {
        type: Boolean,
        default: true
    }
});

storeSchema.plugin(uniqueValidator, {
    message: '{PATH} is expected to be unique.'
});

module.exports = {
    model: mongoose.model('Store', storeSchema),
    fillable,
    updatable
};