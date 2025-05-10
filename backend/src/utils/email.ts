import nodemailer from 'nodemailer';
import { Db } from 'mongodb';
import dotenv from 'dotenv';
import { getDb } from '../config/db';

dotenv.config();

// Định nghĩa interface cho verification code
interface VerificationCode {
  email: string;
  code: string;
  createdAt: Date;
}

// Tạo TTL index cho collection
async function ensureTTLIndex(db: Db): Promise<void> {
  try {
    // Tạo hoặc cập nhật TTL index (MongoDB sẽ tự tạo collection nếu chưa tồn tại)
    await db.collection('verificationCodes').createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 600, background: true } // Tự xóa sau 10 phút (600 giây)
    );
    console.log('TTL index ensured for verificationCodes collection');
  } catch (error) {
    console.error('Error ensuring TTL index:', error);
  }
}

export const generateVerificationCode = async (email: string): Promise<string> => {
  const db = await getDb();
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

export const validateVerificationCode = async (email: string, code: string): Promise<boolean> => {
  const db = await getDb();
  const record = await db.collection('verificationCodes').findOne({ email, code });
  if (record) {
    await db.collection('verificationCodes').deleteOne({ _id: record._id });
    return true;
  }
  return false;
};

export const sendVerificationEmail = async (email: string): Promise<void> => {
  try {
    const code = await generateVerificationCode(email);
    const transporter = nodemailer.createTransport({
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
  } catch (error) {
    console.error('Lỗi gửi email:', error);
    throw new Error('Không thể gửi email xác thực.');
  }
};