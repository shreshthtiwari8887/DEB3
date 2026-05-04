const mongoose = require("mongoose");

module.exports = async () => {
    const connectionParams = {};
    try {
        await mongoose.connect(process.env.DB, connectionParams);
        console.log("Connected to database successfully");
    } catch (error) {
        console.log("Could not connect database!");
        console.log(error);
    }
};