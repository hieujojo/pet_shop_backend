"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/routes/authRoutes.ts
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const router = (0, express_1.Router)();
router.post('/login', authController_1.login);
router.post('/register', authController_1.register);
router.post('/verify-email', authController_1.verifyEmail);
router.post('/google-login', authController_1.googleLogin);
exports.default = router;
