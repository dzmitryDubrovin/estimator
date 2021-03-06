/**
 * Created by dzmitry_dubrovin on 15-Nov-16.
 */
var crypto = require('crypto');
var async = require('async');
var util = require('util');

var mongoose = require('../lib/mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;


var schema = new Schema({

    name: String,
    avatarName: String,
    email: {
        type: String,
        unique: true,
        required: true
    },

    login: {
        type: String,
        unique: true,
        required: true
    },

    _role: {
        type:   ObjectId,
        ref: 'Role'
    },

    hashedPassword: {
        type: String,
        required: true,
        select: false
    },

    salt: {
        type: String,
        required: true,
        select: false
    },

    created: {
        type: Date,
        default: Date.now
    },

    language: {
        key:String,
        value: String
    }
});
schema.methods.encryptPassword = function(password) {
    if(!password) return false;
    return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
};

schema.virtual('password')
    .set(function(password) {
        this._plainPassword = password;
        this.salt = Math.random() + '';
        this.hashedPassword = this.encryptPassword(password);
    })
    .get(function() { return this._plainPassword; });


schema.methods.checkPassword = function(password) {
    return this.encryptPassword(password) === this.hashedPassword;
};

schema.statics.authorize = function(username, password, callback) {
    var User = this;

    async.waterfall([
        function(callback) {
            User.findOne({username: username}, callback);
        },
        function(user, callback) {
            if (user) {
                if (user.checkPassword(password)) {
                    callback(null, user);
                } else {
                    callback(new AuthError("Пароль неверен"));
                }
            } else {
                var user = new User({username: username, password: password});
                user.save(function(err) {
                    if (err) return callback(err);
                    callback(null, user);
                });
            }
        }
    ], callback);
};

exports.User = mongoose.model('User', schema);

function AuthError(message) {
    Error.apply(this, arguments);
    Error.captureStackTrace(this, AuthError);

    this.message = message;
}

util.inherits(AuthError, Error);

AuthError.prototype.name = 'AuthError';

exports.AuthError = AuthError;