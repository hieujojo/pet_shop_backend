"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../../controllers/auth/authController");
const router = express_1.default.Router();
router.get('/user', authController_1.getUserInfo);
router.post('/register', authController_1.register);
router.post('/login', authController_1.login);
router.post('/verify-email', authController_1.verifyEmail);
router.post('/send-verification-code', authController_1.sendVerificationCode);
router.post('/forgot-password', authController_1.forgotPassword);
router.post('/reset-password', authController_1.resetPassword);
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Lỗi khi đăng xuất:', err);
            return res.status(500).json({ message: 'Lỗi khi đăng xuất' });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Đăng xuất thành công' });
    });
});
router.get('/session', (req, res) => {
    if (req.session.user) {
        res.json({ user: req.session.user });
    }
    else {
        res.status(401).json({ message: 'Not authenticated' });
    }
});
// Thêm route để cập nhật thông tin người dùng
router.put('/update-profile', authController_1.updateUser);
exports.default = router;
