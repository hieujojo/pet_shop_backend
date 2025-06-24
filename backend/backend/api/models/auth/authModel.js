"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserByEmail = exports.addUser = exports.findUserByEmail = void 0;
const db_1 = require("../../config/db"); // Điều chỉnh đường dẫn nếu cần
const findUserByEmail = async (email) => {
    try {
        const db = await (0, db_1.getDb)();
        const usersCollection = db.collection('users');
        const user = await usersCollection.findOne({ email });
        return user;
    }
    catch (error) {
        console.error('Lỗi tìm user bằng email:', error);
        throw error;
    }
};
exports.findUserByEmail = findUserByEmail;
const addUser = async (user) => {
    try {
        const db = await (0, db_1.getDb)();
        const usersCollection = db.collection('users');
        // Kiểm tra các trường bắt buộc
        const requiredFields = ['user_code', 'avatar', 'name', 'address', 'phone', 'email'];
        for (const field of requiredFields) {
            if (!user[field]) {
                throw new Error(`Trường bắt buộc ${field} không được để trống`);
            }
        }
        // Tạo newUser với các trường bắt buộc
        const newUser = {
            user_code: user.user_code,
            avatar: user.avatar,
            name: user.name,
            address: user.address,
            phone: user.phone,
            email: user.email,
            password: user.password,
            createdAt: new Date(),
        };
        // Xóa _id nếu là undefined
        if (newUser._id === undefined) {
            delete newUser._id;
        }
        const result = await usersCollection.insertOne(newUser);
        return Object.assign(Object.assign({}, newUser), { _id: result.insertedId });
    }
    catch (error) {
        console.error('Lỗi thêm user:', error);
        throw error;
    }
};
exports.addUser = addUser;
// Thêm hàm updateUserByEmail để cập nhật thông tin người dùng
const updateUserByEmail = async (email, updates) => {
    try {
        const db = await (0, db_1.getDb)();
        const usersCollection = db.collection('users');
        const result = await usersCollection.updateOne({ email }, { $set: updates });
        if (result.matchedCount === 0) {
            throw new Error('Không tìm thấy người dùng để cập nhật.');
        }
    }
    catch (error) {
        console.error('Lỗi cập nhật user:', error);
        throw error;
    }
};
exports.updateUserByEmail = updateUserByEmail;
