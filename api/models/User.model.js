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
        minlength: 8,
        maxlength: 32,
        match: regex.usernames,
        lowercase: true,
        trim: true
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
    recoverTokenExp: {
        type: Date,
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
    active: {
        type: Boolean,
        default: true
    }
});

userSchema.plugin(uniqueValidator, {
    message: '{PATH} is expected to be unique.'
});

userSchema.methods.toJSON = function() {
    const user = this;
    const userObject = user.toObject();
    delete userObject.password;
    return userObject;
};

module.exports = {
    schema: userSchema,
    model: mongoose.model('User', userSchema),
    fillable,
    updatable
};