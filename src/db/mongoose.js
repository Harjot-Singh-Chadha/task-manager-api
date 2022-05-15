const mongoose = require("mongoose");

mongoose.connect(process.env.MONGOOSE_URL, { useNewUrlParser: true }, () => {
    console.log("MongoDB connected: 27017")
});