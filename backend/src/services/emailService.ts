import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Map để lưu trữ mã xác thực tạm thời (có thể thay thế bằng database)
const verificationCodes = new Map<string, string>();

// Hàm tạo mã xác thực
export function generateVerificationCode(email: string): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes.set(email, code);
  console.log(`Mã xác thực tạo ra cho ${email}: ${code}`);
  return code;
}

// Hàm xác thực mã xác thực
export function validateVerificationCode(email: string, code: string): boolean {
  const storedCode = verificationCodes.get(email);
  if (storedCode === code) {
    verificationCodes.delete(email); // Xóa mã sau khi xác thực thành công
    return true;
  }
  return false;
}

// Hàm gửi email chứa mã xác thực
export async function sendVerificationEmail(email: string): Promise<void> {
  try {
    const code = generateVerificationCode(email);

    // Cấu hình transporter để gửi email
    const transporter = nodemailer.createTransport({
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
  } catch (error) {
    console.error('Lỗi gửi email:', error);
    throw new Error('Không thể gửi email.');
  }
}