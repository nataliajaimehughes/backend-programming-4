const mongoose = require('mongoose')
const passportLocalMongoose = require('passport-local-mongoose')
const { Schema } = require('mongoose')

const userSchema = new Schema({
    admin: {
        type: Boolean,
        default: false
    },
    facebookId: String
});

userSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model('User', userSchema)