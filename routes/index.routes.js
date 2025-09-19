const express = require("express");
const authMiddleware = require("../middlewares/authe");
const router = express.Router();
const upload = require("../config/multer.config");
const supabase = require("../config/supabase");
const fileModel = require("../models/files.models");

// ✅ Route to render home page
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userFiles = await fileModel.find({ user: req.user.userId });

    res.render("home", {
      files: userFiles,
      username: req.user.username, // pass username for welcome message
    });
  } catch (err) {
    console.error("Error fetching files:", err);
    res.status(500).json({ error: "Error fetching files" });
  }
});

// ✅ Route to handle file upload
router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      const { data, error } = await supabase.storage
        .from("men-drive")
        .upload(
          `uploads/${Date.now()}-${req.file.originalname}`,
          req.file.buffer,
          { contentType: req.file.mimetype }
        );

      if (error) throw error;

      await fileModel.create({
        path: data.path,
        originalname: req.file.originalname,
        user: req.user.userId,
      });

      res.redirect("/"); // redirect to home after upload
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ Route to download file
router.get("/download/:path", authMiddleware, async (req, res) => {
  try {
    const loggedInUserId = req.user.userId;
    const path = decodeURIComponent(req.params.path);

    const file = await fileModel.findOne({
      user: loggedInUserId,
      path: path,
    });

    if (!file) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { data, error } = await supabase.storage
      .from("men-drive")
      .createSignedUrl(file.path, 60); // 60 sec valid link

    if (error) throw error;

    res.redirect(data.signedUrl);
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Route to delete file
router.get("/delete/:id", authMiddleware, async (req, res) => {
  try {
    const fileId = req.params.id;
    const file = await fileModel.findById(fileId);

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    const { error } = await supabase.storage
      .from("men-drive")
      .remove([file.path]);

    if (error) throw error;

    await fileModel.findByIdAndDelete(fileId);

    res.redirect("/"); // go back to home
  } catch (err) {
    console.error("Error deleting file:", err);
    res.status(500).json({ message: "Error deleting file" });
  }
});

module.exports = router;
