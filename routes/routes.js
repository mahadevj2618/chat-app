const express = require("express");
const app = express();
const authController=require('../controller/authController')

app.use("/auth",authController)

module.exports=app