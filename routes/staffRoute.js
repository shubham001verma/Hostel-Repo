const express = require("express");
const mongoose = require("mongoose");
const Staff = require("../models/staffsModel")
const moment = require("moment")
const multer = require("multer");
const fs = require('fs/promises'); // Using promises for async/await
const path = require('path')
const router = express.Router();

// img storage path
const imgconfig = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, "uploads/")
    },
    filename: (req, file, callback) => {
        callback(null, Date.now() + path.extname(file.originalname))
    }
})


const upload = multer({
    storage: imgconfig,

});


router.post("/addstaff", upload.fields([
    { name: 'image1', maxCount: 1 },  // First input field for the first image
    { name: 'image2', maxCount: 2 },
    { name: 'image3', maxCount: 1 }   // Second input field for the second image
]), async (req, res) => {

    try {



        const userAdded = new Staff({
            name: req.body.name,
            dateofbirth: req.body.dateofbirth,
            email: req.body.email,
            age: req.body.age,
            staffmobileno: req.body.staffmobileno,
            city: req.body.city,
            district: req.body.district,
            parmanentaddress: req.body.parmanentaddress,
            post: req.body.post,
            resume: req.files['image3'] ? req.files['image3'][0].path : null,
            aadharno: req.body.aadharno,
            uploadimage: req.files['image1'] ? req.files['image1'][0].path : null,
            uploadaadhar:  req.files['image2'] ? req.files['image2'].map(file => file.path) : [],



        })

        await userAdded.save()

        res.json({ message: 'user crited' });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Failed to create user' });
    }
});


router.get("/getallstaff", async (req, res) => {
    try {
        const staff = await Staff.find(); // Retrieve all staff members
        res.status(200).json({
            success: true,
            data: staff
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});
// get single user
router.get("/getsinglestaff/:id", async (req, res) => {


    try {
        const user = await Staff.findById(req.params.id);
        res.json(user)
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve user' });
    }

});






router.delete("/deletestaff/:id", async (req, res) => {
    try {
        const user = await Staff.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

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
                    console.error(`Error deleting the Aadhar file (${aadhar}):`, err);
                }
            }
        } else if (user.uploadaadhar) {
            // If it's a single Aadhar image, delete it
            const aadharPath = path.join(__dirname, "../", user.uploadaadhar);
            try {
                await fs.unlink(aadharPath);
                console.log('Aadhar file deleted successfully');
            } catch (err) {
                console.error('Error deleting the Aadhar file:', err);
            }
        }

        // Delete the resume (image3)
        if (user.resume) {
            const resumePath = path.join(__dirname, "../", user.resume);
            try {
                await fs.unlink(resumePath);
                console.log('Resume file deleted successfully');
            } catch (err) {
                console.error('Error deleting the resume file:', err);
            }
        }

        // Delete the user from the database
        await Staff.findByIdAndDelete(req.params.id);
        res.json({ message: 'User and associated images deleted successfully' });
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({ error: 'Failed to delete user' });
    }
});






//put/patch/update user
router.put("/updatestaff/:id", upload.fields([
    { name: 'image1', maxCount: 1 },  // First input field for the first image
    { name: 'image2', maxCount: 2 },
    { name: 'image3', maxCount: 1 }   // Input for resume image
]), async (req, res) => {
    try {
        // Find the existing staff document to preserve unchanged image paths
        const existingUser = await Staff.findById(req.params.id);
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Handle updated data or retain existing image paths
        const updatedData = {
            name: req.body.name,
            dateofbirth: req.body.dateofbirth,
            email: req.body.email,
            age: req.body.age,
            staffmobileno: req.body.staffmobileno,
            city: req.body.city,
            district: req.body.district,
            parmanentaddress: req.body.parmanentaddress,
            post: req.body.post,
            aadharno: req.body.aadharno,
            roomnumber: req.body.roomnumber,  // Any other fields
            bednumber: req.body.bednumber,
            floornumber: req.body.floornumber
        };

        // Check if new image1 (uploadimage) is uploaded, otherwise keep the existing one
        updatedData.uploadimage = req.files['image1']
            ? req.files['image1'][0].path
            : existingUser.uploadimage;

        // Check if new image2 (uploadaadhar) is uploaded, otherwise keep the existing images
        updatedData.uploadaadhar = req.files['image2']
            ? req.files['image2'].map(file => file.path)
            : existingUser.uploadaadhar;

        // Check if new image3 (resume) is uploaded, otherwise keep the existing resume
        updatedData.resume = req.files['image3']
            ? req.files['image3'][0].path
            : existingUser.resume;

        // Update the user with the new data or retain old images if no new files were uploaded
        const updatedUser = await Staff.findByIdAndUpdate(req.params.id, updatedData, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: 'Failed to update user' });
        }

        res.json(updatedUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});




module.exports = router;