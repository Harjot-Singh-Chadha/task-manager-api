const mongoose = require("mongoose");

mongoose.connect(process.env.MONGOOSE_URL, { useNewUrlParser: true })
    .then(() => console.log('connected'))
    .catch(e => console.log(e));;