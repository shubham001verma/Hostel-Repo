const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const dotenv = require("dotenv")
dotenv.config()
const cors=require("cors")
app.use(cors())
app.use(bodyParser.json());
const userRoute = require("./routes/userRoute")
const staffRoute = require("./routes/staffRoute")
const adminRoute = require("./routes/adminRoute")

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose.connect(process.env.URI).
    then(() => {
        console.log("connected successfully")
        app.listen(process.env.PORT || 8000, (err) => {
            if (err) console.log(err);
            console.log("running successfully at", process.env.PORT)
        })
    })
    .catch((error) => {
        console.log("error", error)
    });
app.use('/student',userRoute)
app.use('/staff',staffRoute)
app.use('/admin',adminRoute)

app.use("/uploads",express.static("uploads"));
