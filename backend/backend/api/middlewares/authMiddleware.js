"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authModel_1 = require("../models/auth/authModel");
const authenticateTokenAsync = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ message: 'Token không hợp lệ hoặc không tồn tại.' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your_secret_key');
        const user = await (0, authModel_1.findUserByEmail)(decoded.email);
        if (!user) {
            res.status(401).json({ message: 'Người dùng không tồn tại.' });
            return;
        }
        if (!user._id) {
            res.status(500).json({ message: 'Không tìm thấy ID người dùng.' });
            return;
        }
        req.user = { userId: user._id.toString(), email: user.email };
        next();
    }
    catch (error) {
        console.error('Lỗi xác thực token:', error);
        res.status(403).json({ message: 'Token không hợp lệ.' });
    }
};
const authenticateToken = (req, res, next) => {
    authenticateTokenAsync(req, res, next).catch(next);
};
exports.authenticateToken = authenticateToken;
