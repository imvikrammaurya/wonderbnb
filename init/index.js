const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wonderlust";
main().then(() => {
    console.log("Connect to mongodb");
}).catch(err =>{
    console.log(err);
})
async function main() {
    await mongoose.connect(MONGO_URL);
};

const initDB = async () =>{
    Listing.deleteMany({});
    await Listing.insertMany(initData.data); 
    console.log("data was initialised");
}

initDB();