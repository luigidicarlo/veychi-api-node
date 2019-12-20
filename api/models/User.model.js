const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const regex = require('../utils/regex');
const constants = require('../utils/constants');

const { model: Store } = require('./Store.model');

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
        minlength: constants.usernameMinLength,
        maxlength: constants.usernameMaxLength,
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
        minlength: constants.usernameMinLength
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
    const user = this.toObject();
    delete user.password;
    return user;
};

userSchema.methods.onDisabled = async function(id) {
    try {
        const store = await Store.findOne({ user: id, active: true })
            .catch(err => { throw err; });
        
        await Store.onDisabled(store._id)
            .catch(err => { throw err; });

        Promise.resolve(true);
    } catch (err) {
        throw err;
    }
};

userSchema.methods.onEnabled = async function(id) {
    try {
        const store = await Store.findOne({ user: id, active: false })
            .catch(err => { throw err; });

        await Store.onEnabled(store._id)
            .catch(err => { throw err; });

        Promise.resolve(true);
    } catch (err) {
        throw err;
    }
};

module.exports = {
    schema: userSchema,
    model: mongoose.model('User', userSchema),
    fillable,
    updatable
};