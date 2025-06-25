"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUser = exports.getUserInfo = exports.resetPassword = exports.forgotPassword = exports.sendVerificationCode = exports.verifyEmail = exports.login = exports.register = void 0;
const authService_1 = require("../../services/authService");
const authModel_1 = require("../../models/auth/authModel");
const authUtils_1 = require("../../utils/authUtils");
const db_1 = require("../../config/db");
const register = async (req, res) => {
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
        if (await (0, authModel_1.findUserByEmail)(email)) {
            res.status(400).json({ message: 'Email đã tồn tại!' });
            return;
        }
        const hashedPassword = await (0, authUtils_1.hashPassword)(password);
        await (0, authService_1.registerUser)(name, email, hashedPassword, avatar, address, phone);
        await (0, authService_1.sendUserVerificationEmail)(email);
        res.status(201).json({ message: 'Đăng ký thành công! Vui lòng kiểm tra email.', user: { name, email } });
    }
    catch (error) {
        console.error('Lỗi đăng ký:', error);
        res.status(500).json({ message: 'Lỗi server.' });
    }
};
exports.register = register;
const login = async (req, res) => {
    var _a, _b;
    try {
        const { email, password } = req.body;
        console.log('Bắt đầu đăng nhập:', { email });
        if (!email || !password) {
            res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu.' });
            return;
        }
        const user = await (0, authModel_1.findUserByEmail)(email);
        if (!user || !user.password || !(await (0, authUtils_1.comparePassword)(password, user.password))) {
            res.status(401).json({ message: 'Email hoặc mật khẩu không đúng!' });
            return;
        }
        req.session.user = { id: ((_a = user._id) === null || _a === void 0 ? void 0 : _a.toString()) || '', name: user.name, email: user.email };
        res.status(200).json({
            message: 'Đăng nhập thành công!',
            user: { id: (_b = user._id) === null || _b === void 0 ? void 0 : _b.toString(), name: user.name, email: user.email },
        });
    }
    catch (error) {
        console.error('Lỗi đăng nhập:', error);
        res.status(500).json({ message: 'Lỗi server.' });
    }
};
exports.login = login;
const verifyEmail = async (req, res) => {
    try {
        const { email, verificationCode } = req.body;
        console.log('Bắt đầu xác thực email:', { email });
        if (!email || !verificationCode) {
            res.status(400).json({ message: 'Thiếu thông tin.' });
            return;
        }
        const isValid = await (0, authService_1.validateUserVerificationCode)(email, verificationCode);
        if (!isValid) {
            res.status(400).json({ message: 'Mã xác thực không đúng!' });
            return;
        }
        res.status(200).json({ message: 'Xác thực thành công!' });
    }
    catch (error) {
        console.error('Lỗi xác thực email:', error);
        res.status(500).json({ message: 'Lỗi server.' });
    }
};
exports.verifyEmail = verifyEmail;
const sendVerificationCode = async (req, res) => {
    try {
        const { email } = req.body;
        console.log('Bắt đầu gửi mã xác thực:', { email });
        if (!email) {
            res.status(400).json({ message: 'Email không hợp lệ.' });
            return;
        }
        if (await (0, authModel_1.findUserByEmail)(email)) {
            res.status(400).json({ message: 'Email đã tồn tại!' });
            return;
        }
        await (0, authService_1.sendUserVerificationEmail)(email);
        res.status(200).json({ message: 'Mã xác thực đã được gửi!' });
    }
    catch (error) {
        console.error('Lỗi gửi mã xác thực:', error);
        res.status(500).json({ message: 'Lỗi server.' });
    }
};
exports.sendVerificationCode = sendVerificationCode;
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        console.log('Bắt đầu quên mật khẩu:', { email });
        if (!email) {
            res.status(400).json({ message: 'Email không hợp lệ.' });
            return;
        }
        const user = await (0, authModel_1.findUserByEmail)(email);
        if (!user) {
            res.status(404).json({ message: 'Email không tồn tại!' });
            return;
        }
        await (0, authService_1.sendUserVerificationEmail)(email);
        res.status(200).json({ message: 'Mã xác thực đã được gửi! Vui lòng kiểm tra email.' });
    }
    catch (error) {
        console.error('Lỗi gửi mã xác thực cho quên mật khẩu:', error);
        res.status(500).json({ message: 'Lỗi server.' });
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
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
        const isValid = await (0, authService_1.validateUserVerificationCode)(email, verificationCode);
        if (!isValid) {
            res.status(400).json({ message: 'Mã xác thực không đúng!' });
            return;
        }
        const user = await (0, authModel_1.findUserByEmail)(email);
        if (!user) {
            res.status(404).json({ message: 'Người dùng không tồn tại!' });
            return;
        }
        const hashedPassword = await (0, authUtils_1.hashPassword)(newPassword);
        const db = await (0, db_1.getDb)();
        await db.collection('users').updateOne({ email }, { $set: { password: hashedPassword } });
        res.status(200).json({ message: 'Đặt lại mật khẩu thành công!' });
    }
    catch (error) {
        console.error('Lỗi đặt lại mật khẩu:', error);
        res.status(500).json({ message: 'Lỗi server.' });
    }
};
exports.resetPassword = resetPassword;
const getUserInfo = async (req, res) => {
    var _a, _b;
    try {
        const email = (_a = req.session.user) === null || _a === void 0 ? void 0 : _a.email;
        if (!email) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        const user = await (0, authModel_1.findUserByEmail)(email);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.status(200).json({
            id: (_b = user._id) === null || _b === void 0 ? void 0 : _b.toString(),
            name: user.name,
            email: user.email,
            address: user.address,
            phone: user.phone,
        });
    }
    catch (error) {
        console.error('Error fetching user info:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getUserInfo = getUserInfo;
// Thêm hàm updateUser để cập nhật thông tin người dùng
const updateUser = async (req, res) => {
    var _a, _b;
    try {
        const { name, address, phone } = req.body;
        const email = (_a = req.session.user) === null || _a === void 0 ? void 0 : _a.email;
        console.log('Bắt đầu cập nhật thông tin người dùng:', { email, name, address, phone });
        if (!email) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        if (!name || !address || !phone) {
            res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin.' });
            return;
        }
        const user = await (0, authModel_1.findUserByEmail)(email);
        if (!user) {
            res.status(404).json({ message: 'Người dùng không tồn tại!' });
            return;
        }
        const updates = { name, address, phone };
        await (0, authModel_1.updateUserByEmail)(email, updates);
        const updatedUser = await (0, authModel_1.findUserByEmail)(email);
        if (!updatedUser) {
            res.status(404).json({ message: 'Không tìm thấy người dùng sau khi cập nhật.' });
            return;
        }
        if (req.session.user) {
            req.session.user = Object.assign(Object.assign({}, req.session.user), { name, email });
        }
        res.status(200).json({
            message: 'Cập nhật thông tin thành công!',
            user: {
                id: (_b = updatedUser._id) === null || _b === void 0 ? void 0 : _b.toString(),
                name: updatedUser.name,
                email: updatedUser.email,
                address: updatedUser.address,
                phone: updatedUser.phone,
            },
        });
    }
    catch (error) {
        console.error('Lỗi cập nhật thông tin người dùng:', error);
        res.status(500).json({ message: 'Lỗi server.' });
    }
};
exports.updateUser = updateUser;
