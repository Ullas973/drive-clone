const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const userModel = require("../models/user.model");
const bcrypt = require("bcrypt"); // for hashing passwords
const jwt = require("jsonwebtoken"); // importing jsonwebtoken package to create and verify tokens
const multer = require("multer");
const supabase = require("../config/supabase"); // for file uploads

// ======================
// Middleware: Auth Check
// ======================
function authenticate(req, res, next) {
  const token = req.cookies.token; // get JWT token from cookie
  if (!token) return res.redirect("/user/login"); // If no token, redirect to login

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // verify token
    req.user = decoded; // attach user info to request
    next(); // continue to next middleware/route
  } catch (err) {
    return res.redirect("/user/login"); // invalid token → redirect to login
  }
}

// ======================
// Registration Routes
// ======================
router.get("/register", (req, res) => {
  res.render("register"); // Rendering and showing the form to the user
});

router.post(
  "/register",
  body("email").trim().isEmail().isLength({ min: 13 }),
  body("password").trim().isLength({ min: 5 }),
  body("username").trim().isLength({ min: 3 }),
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
        message: "Invalid data",
      });
    }

    const { username, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10); // hashing the password before storing it in database

    const newUser = await userModel.create({       // creating new user and storing in database we are basically sending the data to database in json format
        username,
      email,
      password: hashedPassword,
    });

    res.redirect("/user/login"); // after user registers successfully we will redirect them to login page
  }
);

// ======================
// Login Routes
// ======================
router.get("/login", (req, res) => {
  res.render("login"); // Rendering and showing the form to the user
});

router.post(
  "/login",
  body("username").trim().isLength({ min: 3 }),
  body("password").trim().isLength({ min: 5 }),
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
        message: "Invalid data",
      });
    }

    const { username, password } = req.body;

    const user = await userModel.findOne({
      username: username, // finding user by username
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid username or password", // if user not found
      });
    }

    const ismatch = await bcrypt.compare(password, user.password); // comparing the entered password with the hashed password stored in database

    if (!ismatch) {
      return res.status(400).json({
        message: "Invalid username or password", // if password does not match
      });
    }

    const token = jwt.sign(
      // if username and password is correct then we will create a token for the user
      {
        userId: user._id, // storing user id in the token
        username: user.username,
        email: user.email,
      },
      process.env.JWT_SECRET // secret key to sign the token
    );

    res.cookie("token", token); // storing the token in a cookie

    res.redirect("/"); // after successful login redirecting to home page
  }
);

// ======================
// Logout Route
// ======================
router.get("/logout", (req, res) => {
  res.clearCookie("token"); // remove JWT cookie
  res.redirect("/user/login"); // redirect to login page
});

// ======================
// Home Route
// ======================
router.get("/home", authenticate, (req, res) => {
  // Render home.ejs and pass username for welcome message
  res.render("home", { username: req.user.username });
});

// ======================
// File Upload Routes
// ======================
// Multer setup for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload a single file
router.post(
  "/upload",
  authenticate,
  upload.single("file"),
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).send("No file uploaded");

      const filePath = `${req.user.userId}/${Date.now()}_${file.originalname}`;

      const { error } = await supabase.storage
        .from("men-drive")
        .upload(filePath, file.buffer, {
          upsert: true,
          contentType: file.mimetype,
        });

      if (error) throw error;

      res.redirect("/home");
    } catch (err) {
      console.error("Upload error:", err.message);
      res.status(500).send("File upload failed");
    }
  }
);

module.exports = router;
