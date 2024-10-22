const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/userModel");
const Fee= require("../models/feeModel");
const moment = require("moment");
const multer = require("multer");
const fs = require('fs/promises'); // Use fs/promises for better async/await support
const path = require('path');
const router = express.Router();

// img storage path
const imgconfig = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, "uploads/");
    },
    filename: (req, file, callback) => {
        callback(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: imgconfig,
});

// Get occupied beds by room
router.get('/occupiedBeds', async (req, res) => {
    const { room } = req.query;
    try {
        const students = await User.find({ roomnumber: room });
        const occupiedBeds = students.map(student => student.bednumber);
        res.json(occupiedBeds);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve occupied beds' });
    }
});

// Example endpoint in Express
router.get('/studentsInRoom/:roomId', async (req, res) => {
    const { roomId } = req.params;
    try {
        const students = await User.find({ roomnumber: roomId }); // Adjust the model as necessary
        res.json(students);
    } catch (error) {
        res.status(500).send("Server Error");
    }
});
router.get("/getstudentfee", async (req, res) => {
    try {
        const fees = await Fee.find();
        const feeDataWithExpiry = fees.map((fee) => {
            const currentDate = new Date();
            const expirationDate = new Date(fee.expirationDate);
            const timeDifference = expirationDate.getTime() - currentDate.getTime();
            const remainingDays = Math.ceil(timeDifference / (1000 * 3600 * 24)); // Calculate remaining days

            let alertMessage = '';
            if (remainingDays <= 3 && fee.paymentStatus !== 'Paid') {
                alertMessage = `Room fee expired in ${remainingDays} day(s)`;
            }

            return {
                ...fee.toObject(),
                remainingDays,
                alertMessage
            };
        });
        res.json(feeDataWithExpiry);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve fees' });
    }
});
router.get("/getstudentfees/:studentId", async (req, res) => {
    try {
        const fees = await Fee.findOne({ studentId: req.params.studentId });
        if (!fees) {
            return res.status(404).json({ message: 'No fees found for this student' });
        }

        // Check for fee expiration
        const currentDate = new Date();
        if (fees.expirationDate < currentDate && fees.paymentStatus !== 'Paid') {
            fees.paymentStatus = 'Expired';
            await fees.save();  // Update the fee status
        }

        res.json(fees);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve fees' });
    }
});
router.post("/addstudent", upload.fields([
    { name: 'image1', maxCount: 1 },  // First input field for the first image
    { name: 'image2', maxCount: 2 }   // Second input field for the second image
]), async (req, res) => {
    const roomnumber = req.body.roomnumber;
    const bednumber = req.body.bednumber;

    try {
        // Check if the room is full (maximum 4 students allowed)
        const studentCount = await User.countDocuments({ roomnumber: roomnumber });
        if (studentCount >= 4) {
            return res.status(400).json({ error: 'This room is already filled with the maximum number of students.' });
        }

        // Check if the bed is already occupied
        const isBedOccupied = await User.findOne({ roomnumber: roomnumber, bednumber: bednumber });
        if (isBedOccupied) {
            return res.status(400).json({ error: 'This bed is already occupied.' });
        }

        // Create new student
        const userAdded = new User({
            name: req.body.name,
            dateofbirth: req.body.dateofbirth,
            email: req.body.email,
            age: req.body.age,
            studentmobileno: req.body.studentmobileno,
            city: req.body.city,
            district: req.body.district,
            parmanentaddress: req.body.parmanentaddress,
            fathername: req.body.fathername,
            mothername: req.body.mothername,
            parentsmobileno: req.body.parentsmobileno,
            aadharno: req.body.aadharno,
            uploadimage: req.files['image1'] ? req.files['image1'][0].path : null,
            uploadaadhar: req.files['image2'] ? req.files['image2'].map(file => file.path) : [],
            roomnumber: roomnumber,
            bednumber: bednumber,
            floornumber: req.body.floornumber,
            registrationDate:req.body.registrationDate,
        });

        // Save student
        const savedUser = await userAdded.save();

        // Fee Settlement Logic
        const totalFee = req.body.totalFee;
        const paidAmount = req.body.paidAmount;
        const dueAmount = totalFee - paidAmount;

        // Set expiration date (1 month from now)
        const expirationDate = new Date();
        expirationDate.setMonth(expirationDate.getMonth() + 1);

        const fee = new Fee({
            studentId: savedUser._id,
            totalFee: totalFee,
            paidAmount: paidAmount,
            dueAmount: dueAmount,
            paymentStatus: paidAmount >= totalFee ? 'Paid' : 'Unpaid',
            paymentDate: paidAmount >= totalFee ? new Date() : null,  // Add payment date if fully paid
            expirationDate: expirationDate
        });

        await fee.save();  // Save fee details

        res.json({ message: 'Student and Fee details added successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to create student and fee details' });
    }
});

// Get all users
router.get("/getstudent", async (req, res) => {
    try {
        const showAll = await User.find();
        res.json(showAll);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve users' });
    }
});

// Get single user
router.get("/getsinglestudent/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve user' });
    }
});




// Delete user
router.delete("/deletestudent/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        await Fee.findOneAndDelete({ studentId: req.params.id });
        // Delete the uploadimage (image1)
        if (user.uploadimage) {
            const imagePath = path.join(__dirname, "../", user.uploadimage);
            try {
                await fs.unlink(imagePath);
                console.log('Image file deleted successfully');
            } catch (err) {
                console.error('Error deleting the image file:', err);
            }
        }

        // Delete the uploadaadhar (image2) - Handle multiple images if it's an array
        if (Array.isArray(user.uploadaadhar)) {
            for (const aadhar of user.uploadaadhar) {
                const aadharPath = path.join(__dirname, "../", aadhar);
                try {
                    await fs.unlink(aadharPath);
                    console.log(`Aadhar file deleted successfully: ${aadhar}`);
                } catch (err) {
                    console.error('Error deleting the Aadhar file:', err);
                }
            }
        } else if (user.uploadaadhar) {
            // If it's not an array, delete the single Aadhar image
            const aadharPath = path.join(__dirname, "../", user.uploadaadhar);
            try {
                await fs.unlink(aadharPath);
                console.log('Aadhar file deleted successfully');
            } catch (err) {
                console.error('Error deleting the Aadhar file:', err);
            }
        }

        // Delete the user from the database
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User and associated images deleted successfully' });
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({ error: 'Failed to delete user' });
    }
});



//update
router.put("/updatestudent/:id", upload.fields([
    { name: 'image1', maxCount: 1 },  // First input field for the first image
    { name: 'image2', maxCount: 2 }   // Second input field for the second image
]), async (req, res) => {
    const roomnumber = req.body.roomnumber;
    const bednumber = req.body.bednumber;

    try {
        // Retrieve current student data to check for existing room and bed
        const existingStudent = await User.findById(req.params.id);
        if (!existingStudent) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the new room is full (maximum 4 students allowed)
        const studentCount = await User.countDocuments({ roomnumber: roomnumber });
        if (studentCount >= 4 && existingStudent.roomnumber !== roomnumber) {
            return res.status(400).json({ error: 'This room is already filled with the maximum number of students.' });
        }

        // Check if the bed is already occupied (only if changing beds)
        const isBedOccupied = await User.findOne({ roomnumber: roomnumber, bednumber: bednumber });
        if (isBedOccupied && isBedOccupied._id.toString() !== existingStudent._id.toString()) {
            return res.status(400).json({ error: 'This bed is already occupied.' });
        }

        // Prepare updated data
        const updatedData = {
            name: req.body.name,
            dateofbirth: req.body.dateofbirth,
            email: req.body.email,
            age: req.body.age,
            studentmobileno: req.body.studentmobileno,
            city: req.body.city,
            district: req.body.district,
            parmanentaddress: req.body.parmanentaddress,
            fathername: req.body.fathername,
            mothername: req.body.mothername,
            parentsmobileno: req.body.parentsmobileno,
            aadharno: req.body.aadharno,
            uploadimage: req.files['image1'] ? req.files['image1'][0].path : existingStudent.uploadimage,
            uploadaadhar: req.files['image2'] ? req.files['image2'].map(file => file.path) : existingStudent.uploadaadhar,
            roomnumber: roomnumber,
            bednumber: bednumber,
            floornumber: req.body.floornumber,
            registrationDate: req.body.registrationDate,
        };

        // Update student information
        const updatedUser = await User.findByIdAndUpdate(req.params.id, updatedData, { new: true });

        // Update fee details if provided
        const updatedFee = await Fee.findOneAndUpdate(
            { studentId: req.params.id },
            {
                totalFee: req.body.totalFee,
                paidAmount: req.body.paidAmount,
                dueAmount: req.body.totalFee - req.body.paidAmount,
                paymentStatus: req.body.paidAmount >= req.body.totalFee ? 'Paid' : 'Unpaid',
            },
            { new: true }
        );

        res.json({ updatedUser, updatedFee });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update student and fee details' });
    }
});


module.exports = router;
