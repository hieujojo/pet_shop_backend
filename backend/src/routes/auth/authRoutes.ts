import express from 'express';
import { register, login, verifyEmail, sendVerificationCode, forgotPassword, resetPassword, getUserInfo, updateUser } from '../../controllers/auth/authController';

declare module 'express-session' {
  interface SessionData {
    user?: { id: string | undefined; name: string; email: string }; // Thay đổi id thành string | undefined
  }
}

const router = express.Router();

router.get('/user', getUserInfo);
router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/send-verification-code', sendVerificationCode);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.post('/logout', (req: express.Request, res: express.Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Lỗi khi đăng xuất:', err);
      return res.status(500).json({ message: 'Lỗi khi đăng xuất' });
    }
    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Đăng xuất thành công' });
  });
});

router.get('/session', (req: express.Request, res: express.Response) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

// Thêm route để cập nhật thông tin người dùng
router.put('/update-profile', updateUser);

export default router;