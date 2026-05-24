const express = require("express");

const router = express.Router();

const { body } = require("express-validator");

const {
  register,
  login,
  profile,
} = require("../controllers/authController");

const authMiddleware = require("../middlewares/authMiddleware");

const registerValidation = [
  body("name")
    .notEmpty()
    .withMessage("Name is required"),

  body("email")
    .isEmail()
    .withMessage("Invalid email"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

router.post(
  "/register",
  registerValidation,
  register
);

router.post("/login", login);

router.get(
  "/profile",
  authMiddleware,
  profile
);

module.exports = router;