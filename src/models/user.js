const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Task = require("./task");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        require: true
    },
    email: {
        type: String,
        unique: true,
        require: true,
        validate(val) {
            if (!validator.isEmail(val)) throw new Error("Email is not valid")
        }
    },
    age: {
        type: Number,
        default: 0
    },
    password: {
        type: String,
        require: true,
        minlength: 7,
        validate(val) {
            if (val.toLowerCase().includes("password")) throw new Error("Password cannot contains password")
        }
    },
    tokens: [{
        token: {
            type: String,
            require: true,
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
});

userSchema.virtual("tasks", {
    ref: "Task",
    foreignField: "owner",
    localField: "_id"
})

userSchema.methods.toJSON = function () {
    const user = this;
    const userObj = user.toObject();

    delete userObj.password;
    delete userObj.tokens;
    delete userObj.avatar;

    return userObj
}

userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

    user.tokens.push({ token })
    await user.save();

    return token

};

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error("Unable to login")
    }

    const isValidUser = await bcrypt.compare(password, user.password);
    if (!isValidUser) {
        throw new Error("Unable to login")
    }
    return user
};

userSchema.pre("save", async function (next) {
    const user = this;

    if (user.isModified("password")) {
        user.password = await bcrypt.hash(user.password, 8)
    }
    next();
});

userSchema.pre("remove", async function (next) {
    const user = this;
    await Task.deleteMany({ owner: user._id })

    next();
});


const User = mongoose.model("User", userSchema);

module.exports = User;