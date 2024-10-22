const mongoose = require("mongoose");

// Create schema
const adminSchema = new mongoose.Schema({
    name: {
        type: String,
    },
   
    email: {
        type: String,
    },
    password: {
        type: String,
    },
    dateofbirth: {
        type: String,
    },
    mobilenumber: {
        type: String,
    },

    uploadimage: {
        type: String,
    },
  
}, { timestamps: true });

// Create model
const Admin = mongoose.model("admin", adminSchema);
module.exports = Admin;