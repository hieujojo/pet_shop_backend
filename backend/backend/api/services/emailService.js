"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVerificationCode = generateVerificationCode;
exports.validateVerificationCode = validateVerificationCode;
exports.sendVerificationEmail = sendVerificationEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Map để lưu trữ mã xác thực tạm thời (có thể thay thế bằng database)
const verificationCodes = new Map();
// Hàm tạo mã xác thực
function generateVerificationCode(email) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes.set(email, code);
    console.log(`Mã xác thực tạo ra cho ${email}: ${code}`);
    return code;
}
// Hàm xác thực mã xác thực
function validateVerificationCode(email, code) {
    const storedCode = verificationCodes.get(email);
    if (storedCode === code) {
        verificationCodes.delete(email); // Xóa mã sau khi xác thực thành công
        return true;
    }
    return false;
}
// Hàm gửi email chứa mã xác thực
async function sendVerificationEmail(email) {
    try {
        const code = generateVerificationCode(email);
        // Cấu hình transporter để gửi email
        const transporter = nodemailer_1.default.createTransport({
            service: 'gmail', // Sử dụng dịch vụ Gmail
            auth: {
                user: process.env.EMAIL_USER, // Email của bạn
                pass: process.env.EMAIL_PASS, // Mật khẩu ứng dụng (App Password) hoặc mật khẩu email
            },
        });
        // Kiểm tra kết nối đến dịch vụ email
        await transporter.verify();
        // Cấu hình email
        const mailOptions = {
            from: process.env.EMAIL_USER, // Email người gửi
            to: email, // Email người nhận
            subject: 'Mã xác thực đăng nhập', // Tiêu đề email
            text: `Mã xác thực của bạn là: ${code}`, // Nội dung email
        };
        // Gửi email
        await transporter.sendMail(mailOptions);
        console.log(`Email gửi thành công đến: ${email}`);
    }
    catch (error) {
        console.error('Lỗi gửi email:', error);
        throw new Error('Không thể gửi email.');
    }
}
