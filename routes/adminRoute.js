const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // For password hashing
const jwt = require("jsonwebtoken"); // For JWT token generation
const multer = require("multer");
const fs = require("fs/promises"); // For file handling (image deletion)
const path = require("path");
const Admin = require("../models/adminModel");
const router = express.Router();

// Image storage configuration
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

// Register admin with hashed password
router.post("/register", upload.single("uploadimage"), async (req, res) => {
    const { name, email, password ,dateofbirth,mobilenumber} = req.body;

    try {
        // Check if admin already exists with the same email
        const existingAdmin = await Admin.findOne({ email: email });
        if (existingAdmin) {
            return res.status(400).json({ error: "Admin with this email already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create new admin
        const newAdmin = new Admin({
            name: name,
            email: email,
            password: hashedPassword,
            dateofbirth: dateofbirth,
            mobilenumber: mobilenumber,
            
            uploadimage: req.file ? req.file.path : null
        });

        const savedAdmin = await newAdmin.save();
        res.json({ message: "Admin registered successfully", savedAdmin });
    } catch (error) {
        res.status(500).json({ error: "Admin registration failed" });
    }
});

// Login route with email verification
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the admin exists by email
        const admin = await Admin.findOne({ email: email });
        if (!admin) {
            return res.status(404).json({ error: "Admin with this email not found" });
        }

        // Compare the provided password with the hashed password
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // If password matches, generate a JWT token
        const token = jwt.sign(
            { adminId: admin._id, email: admin.email },
            process.env.JWT_SECRET || "your_jwt_secret", // Use a secure secret in production
            { expiresIn: "1h" } // Token expires in 1 hour
        );

        // Return token and admin data
        res.json({
            message: "Login successful",
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Login failed" });
    }
});

// Get all admins
router.get("/getadmins", async (req, res) => {
    try {
        const admins = await Admin.find();
        res.json(admins);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve admins" });
    }
});

// Get single admin
router.get("/getadmin/:id", async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id);
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }
        res.json(admin);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve admin" });
    }
});

// Update admin
router.put("/updateadmin/:id", upload.single("uploadimage"), async (req, res) => {
    const { name, email,dateofbirth,mobilenumber} = req.body;

    try {
        // Find the admin to update
        const admin = await Admin.findById(req.params.id);
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        // Hash the new password if provided
        

        // Update the admin's data
        const updatedAdmin = await Admin.findByIdAndUpdate(
            req.params.id,
            {
                name: name,
                email: email,
                dateofbirth: dateofbirth,
                mobilenumber: mobilenumber,
                uploadimage: req.file ? req.file.path : admin.uploadimage
            },
            { new: true }
        );

        res.json(updatedAdmin);
    } catch (error) {
        res.status(500).json({ error: "Failed to update admin" });
    }
});

// Delete admin
router.delete("/deleteadmin/:id", async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id);
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        // Delete the admin's image if it exists
        if (admin.uploadimage) {
            const imagePath = path.join(__dirname, "../", admin.uploadimage);
            try {
                await fs.unlink(imagePath);
                console.log('Image file deleted successfully');
            } catch (err) {
                console.error('Error deleting the image file:', err);
            }
        }

        // Delete the admin from the database
        await Admin.findByIdAndDelete(req.params.id);
        res.json({ message: "Admin and associated image deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete admin" });
    }
});
// Logout route
router.post("/logout", (req, res) => {
    // Inform the client to clear the token
    res.json({ message: "Logout successful. Please clear the token from the client." });
});

module.exports = router;
