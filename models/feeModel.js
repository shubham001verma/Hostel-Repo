const mongoose = require("mongoose");

const FeeSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  // Referencing the student (User) model
       
    },
    totalFee: {
        type: Number,
        
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    dueAmount: {
        type: Number,
        
    },
    paymentStatus: {
        type: String, 
        enum: ['Paid', 'Unpaid'], // e.g., 'Paid', 'Partial', 'Unpaid', 'Expired'
        default: 'Unpaid'
    },
    paymentDate: {
        type: Date
    },
    expirationDate: {
        type: Date  // Expiry one month from fee creation
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});
const Fee = mongoose.model('Fee', FeeSchema);

module.exports = Fee;