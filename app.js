const express = require("express");
const userRouter = require("./routes/user.routes");
const app = express();
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const indexRouter = require("./routes/index.routes");

// Load environment variables from .env file
dotenv.config();

// Connect to database
const connectToDB = require("./config/db");
connectToDB(); //callin function to connect to database

// Set EJS as the templating engine
app.set("view engine", "ejs");

// Middleware to parse cookies
app.use(cookieParser());

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.use("/user", userRouter); // all user related routes like register, login, logout etc.
app.use("/", indexRouter); // main route for index pages

// Start server
app.listen(3000, () => {
  console.log("Server is runnning in port : 3000");
});
