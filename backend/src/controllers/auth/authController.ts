import { Request, Response } from 'express';
import { ParsedQs } from 'qs';
import { ParamsDictionary } from 'express-serve-static-core';
import {
  registerUser,
  sendUserVerificationEmail,
  validateUserVerificationCode,
} from '../../services/authService';
import { findUserByEmail, updateUserByEmail } from '../../models/auth/authModel';
import { hashPassword, comparePassword } from '../../utils/authUtils';
import { getDb } from '../../config/db';
import { IUser } from '../../types'; // Thêm import IUser
import { Session, SessionData } from 'express-session'; // Thêm import từ express-session

// Định nghĩa kiểu SessionUser để khớp với khai báo trong authRoutes.ts
interface SessionUser {
  id: string | undefined;
  name: string;
  email: string;
}

// Định nghĩa AuthenticatedRequest với kiểu Session đầy đủ
interface AuthenticatedRequest extends Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>> {
  session: Session & Partial<SessionData> & {
    user?: SessionUser;
    destroy: (callback: (err: any) => void) => void;
  };
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, confirmPassword, avatar, address, phone } = req.body;
    console.log('Bắt đầu đăng ký:', { name, email, avatar, address, phone });
    if (!name || !email || !password || !confirmPassword || !avatar || !address || !phone) {
      res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin.' });
      return;
    }
    if (password !== confirmPassword) {
      res.status(400).json({ message: 'Mật khẩu xác nhận không khớp.' });
      return;
    }
    if (await findUserByEmail(email)) {
      res.status(400).json({ message: 'Email đã tồn tại!' });
      return;
    }
    const hashedPassword = await hashPassword(password);
    await registerUser(name, email, hashedPassword, avatar, address, phone);
    await sendUserVerificationEmail(email);
    res.status(201).json({ message: 'Đăng ký thành công! Vui lòng kiểm tra email.', user: { name, email } });
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    res.status(500).json({ message: 'Lỗi server.' });
  }
};

export const login = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    console.log('Bắt đầu đăng nhập:', { email });
    if (!email || !password) {
      res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu.' });
      return;
    }
    const user = await findUserByEmail(email);
    if (!user || !user.password || !(await comparePassword(password, user.password))) {
      res.status(401).json({ message: 'Email hoặc mật khẩu không đúng!' });
      return;
    }
    req.session.user = { id: user._id?.toString() || '', name: user.name, email: user.email };
    res.status(200).json({
      message: 'Đăng nhập thành công!',
      user: { id: user._id?.toString(), name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ message: 'Lỗi server.' });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, verificationCode } = req.body;
    console.log('Bắt đầu xác thực email:', { email });
    if (!email || !verificationCode) {
      res.status(400).json({ message: 'Thiếu thông tin.' });
      return;
    }
    const isValid = await validateUserVerificationCode(email, verificationCode);
    if (!isValid) {
      res.status(400).json({ message: 'Mã xác thực không đúng!' });
      return;
    }
    res.status(200).json({ message: 'Xác thực thành công!' });
  } catch (error) {
    console.error('Lỗi xác thực email:', error);
    res.status(500).json({ message: 'Lỗi server.' });
  }
};

export const sendVerificationCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    console.log('Bắt đầu gửi mã xác thực:', { email });
    if (!email) {
      res.status(400).json({ message: 'Email không hợp lệ.' });
      return;
    }
    if (await findUserByEmail(email)) {
      res.status(400).json({ message: 'Email đã tồn tại!' });
      return;
    }
    await sendUserVerificationEmail(email);
    res.status(200).json({ message: 'Mã xác thực đã được gửi!' });
  } catch (error) {
    console.error('Lỗi gửi mã xác thực:', error);
    res.status(500).json({ message: 'Lỗi server.' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    console.log('Bắt đầu quên mật khẩu:', { email });
    if (!email) {
      res.status(400).json({ message: 'Email không hợp lệ.' });
      return;
    }
    const user = await findUserByEmail(email);
    if (!user) {
      res.status(404).json({ message: 'Email không tồn tại!' });
      return;
    }
    await sendUserVerificationEmail(email);
    res.status(200).json({ message: 'Mã xác thực đã được gửi! Vui lòng kiểm tra email.' });
  } catch (error) {
    console.error('Lỗi gửi mã xác thực cho quên mật khẩu:', error);
    res.status(500).json({ message: 'Lỗi server.' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, verificationCode, newPassword, confirmNewPassword } = req.body;
    console.log('Bắt đầu đặt lại mật khẩu:', { email });
    if (!email || !verificationCode || !newPassword || !confirmNewPassword) {
      res.status(400).json({ message: 'Thiếu thông tin.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      res.status(400).json({ message: 'Mật khẩu xác nhận không khớp.' });
      return;
    }
    const isValid = await validateUserVerificationCode(email, verificationCode);
    if (!isValid) {
      res.status(400).json({ message: 'Mã xác thực không đúng!' });
      return;
    }
    const user = await findUserByEmail(email);
    if (!user) {
      res.status(404).json({ message: 'Người dùng không tồn tại!' });
      return;
    }
    const hashedPassword = await hashPassword(newPassword);
    const db = await getDb();
    await db.collection('users').updateOne(
      { email },
      { $set: { password: hashedPassword } }
    );
    res.status(200).json({ message: 'Đặt lại mật khẩu thành công!' });
  } catch (error) {
    console.error('Lỗi đặt lại mật khẩu:', error);
    res.status(500).json({ message: 'Lỗi server.' });
  }
};

export const getUserInfo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const email = req.session.user?.email;
    if (!email) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    const user = await findUserByEmail(email);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json({
      id: user._id?.toString(),
      name: user.name,
      email: user.email,
      address: user.address,
      phone: user.phone,
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Thêm hàm updateUser để cập nhật thông tin người dùng
export const updateUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, address, phone } = req.body;
    const email = req.session.user?.email;
    console.log('Bắt đầu cập nhật thông tin người dùng:', { email, name, address, phone });

    if (!email) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    if (!name || !address || !phone) {
      res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin.' });
      return;
    }

    const user = await findUserByEmail(email);
    if (!user) {
      res.status(404).json({ message: 'Người dùng không tồn tại!' });
      return;
    }

    const updates: Partial<IUser> = { name, address, phone };
    await updateUserByEmail(email, updates);

    const updatedUser = await findUserByEmail(email);
    if (!updatedUser) {
      res.status(404).json({ message: 'Không tìm thấy người dùng sau khi cập nhật.' });
      return;
    }

    if (req.session.user) {
      req.session.user = { ...req.session.user, name, email };
    }
    res.status(200).json({
      message: 'Cập nhật thông tin thành công!',
      user: {
        id: updatedUser._id?.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        address: updatedUser.address,
        phone: updatedUser.phone,
      },
    });
  } catch (error) {
    console.error('Lỗi cập nhật thông tin người dùng:', error);
    res.status(500).json({ message: 'Lỗi server.' });
  }
};