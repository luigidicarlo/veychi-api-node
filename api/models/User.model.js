const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const regex = require('../utils/regex');
const Schema = mongoose.Schema;

const roles = ['CLIENT_ROLE', 'ADMIN_ROLE'];
const fillable = [
    'username', 'fname', 'lname',
    'password', 'email', 'imageUrl'
];
const updatable = [
    'fname', 'lname', 'email', 'imageUrl'
]

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        uniqueCaseInsensitive: true,
        minlength: 8,
        maxlength: 32,
        match: regex.usernames
    },
    fname: {
        type: String,
        required: true,
        match: regex.names
    },
    lname: {
        type: String,
        required: true,
        match: regex.names
    },
    email: {
        type: String,
        required: true,
        match: regex.emails
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    recoverToken: {
        type: String,
        default: null
    },
    role: {
        type: String,
        enum: roles,
        default: roles[0]
    },
    imageUrl: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: new Date(Date.now())
    },
    updatedAt: {
        type: Date,
        default: null
    },
    recoverTokenExp: {
        type: Date,
        default: null
    }
});

userSchema.plugin(uniqueValidator, {
    message: '{PATH} is expected to be unique.'
});

module.exports = mongoose.model('User', userSchema);
module.exports = {
    fillable, updatable
};