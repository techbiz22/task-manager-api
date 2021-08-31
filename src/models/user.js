const mongoose = require('mongoose')
const validator = require('validator');
const bycrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('The email is invalid')
            }
        }
    },

    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('age must be above 0.')
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error(`password must not be ${value.join()}`)
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

userSchema.methods.toJSON = function () {
    const userObject = this.toObject()
    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

userSchema.methods.generateAuthToken = async function () {

    const token = jwt.sign({ _id: this._id.toString() }, process.env.JWT_SECRET)
    this.tokens = this.tokens.concat({ token })
    await this.save()

    return token
}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })
    if (!user) {

        throw new Error('Login failed.')
    }
    const isMatched = await bycrypt.compare(password, user.password)
    if (!isMatched) {
        throw new Error('Login failed.')
    }
    return user
}

userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bycrypt.hash(this.password, 8)
    }

    next()
})

// Delete user tasks when user is removed
userSchema.pre('remove', async function (next) {
    const user = this
    await Task.deleteMany({ owner: user._id })
    next()
})



const User = mongoose.model('User', userSchema)



module.exports = User