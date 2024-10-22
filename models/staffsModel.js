const mongoose = require("mongoose")
//create schema
const staffSchema = new mongoose.Schema({

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
    staffmobileno: {
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
  
    post: {
        type: String
    },
    resume: {
        type: String,
    },
    aadharno: {
        type: String,
    },
    uploadimage: {
        type: String,
    },
    uploadaadhar: {
        type: [String],
    },
   

}, { timestamps: true })
//create model
const Staff = mongoose.model("Staffs", staffSchema)
module.exports = Staff;