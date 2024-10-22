const mongoose = require("mongoose");

// Create schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    dateofbirth: {
        type: String,
    },
    email: {
        type: String,
    },
    age: {
        type: String,
    },
    studentmobileno: {
        type: String,
    },
    city: {
        type: String,
    },
    district: {
        type: String,
    },
    parmanentaddress: {
        type: String,
    },
    fathername: {
        type: String,
    },
    mothername: {
        type: String,
    },
    parentsmobileno: {
        type: String,
    },
    aadharno: {
        type: String,
        unique: true,
        
    },
    uploadimage: {
        type: String,
    },
    uploadaadhar: {
        type: [String],
    },
    roomnumber: {
        type: Number,
        min: 1,  // Minimum room number allowed
        max: 100, // Maximum room number allowed

    },
    bednumber: {
        type: Number,
        min: 1,  // Minimum bed number allowed
        max: 4,  // Maximum bed number allowed

    },
    floornumber: {
        type: String,

    },
    registrationDate: {
        type: String,
       
    }
}, { timestamps: true });

// Create model
const User = mongoose.model("Students", userSchema);
module.exports = User;