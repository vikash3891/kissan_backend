const express = require("express");

const router = express.Router();

const {
  register,
  login,
} = require("../controllers/authController");

const authMiddleware = require("../middlewares/authMiddleware");

router.post("/register", register);

router.post("/login", login);

router.get(
  "/profile",
  authMiddleware,
  (req, res) => {
    res.status(200).json({
      message: "Protected route accessed",
      user: req.user,
    });
  }
);

module.exports = router;