import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { findUserByEmail } from '../models/auth/authModel';
import { Db } from 'mongodb';

export interface CustomRequest extends Request {
  db: Db;
  user?: { userId: string; email: string };
}

const authenticateTokenAsync = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Token không hợp lệ hoặc không tồn tại.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key') as { email: string };
    const user = await findUserByEmail(decoded.email);

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
  } catch (error) {
    console.error('Lỗi xác thực token:', error);
    res.status(403).json({ message: 'Token không hợp lệ.' });
  }
};

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  authenticateTokenAsync(req as CustomRequest, res, next).catch(next);
};