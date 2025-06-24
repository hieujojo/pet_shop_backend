"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationEmail = exports.validateVerificationCode = exports.generateVerificationCode = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("../config/db");
dotenv_1.default.config();
// Tạo TTL index cho collection
async function ensureTTLIndex(db) {
    try {
        // Tạo hoặc cập nhật TTL index (MongoDB sẽ tự tạo collection nếu chưa tồn tại)
        await db.collection('verificationCodes').createIndex({ createdAt: 1 }, { expireAfterSeconds: 600, background: true } // Tự xóa sau 10 phút (600 giây)
        );
        console.log('TTL index ensured for verificationCodes collection');
    }
    catch (error) {
        console.error('Error ensuring TTL index:', error);
    }
}
const generateVerificationCode = async (email) => {
    const db = await (0, db_1.getDb)();
    // Đảm bảo TTL index được tạo trước khi insert
    await ensureTTLIndex(db);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await db.collection('verificationCodes').insertOne({
        email,
        code,
        createdAt: new Date(),
    });
    console.log(`Mã xác thực cho ${email}: ${code}`);
    return code;
};
exports.generateVerificationCode = generateVerificationCode;
const validateVerificationCode = async (email, code) => {
    const db = await (0, db_1.getDb)();
    const record = await db.collection('verificationCodes').findOne({ email, code });
    if (record) {
        await db.collection('verificationCodes').deleteOne({ _id: record._id });
        return true;
    }
    return false;
};
exports.validateVerificationCode = validateVerificationCode;
const sendVerificationEmail = async (email) => {
    try {
        const code = await (0, exports.generateVerificationCode)(email);
        const transporter = nodemailer_1.default.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Mã xác thực đăng nhập',
            text: `Mã xác thực của bạn là: ${code}`,
        });
        console.log(`Email gửi thành công đến: ${email}`);
    }
    catch (error) {
        console.error('Lỗi gửi email:', error);
        throw new Error('Không thể gửi email xác thực.');
    }
};
exports.sendVerificationEmail = sendVerificationEmail;
