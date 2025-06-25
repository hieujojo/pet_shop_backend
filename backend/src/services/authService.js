"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendUserVerificationEmail = exports.validateUserVerificationCode = exports.registerUser = void 0;
const authModel_1 = require("../models/auth/authModel");
const db_1 = require("../config/db");
const email_1 = require("../utils/email");
const generateUserCode = async () => {
    const db = await (0, db_1.getDb)();
    const usersCollection = db.collection('users');
    const lastUser = await usersCollection.findOne({}, { sort: { user_code: -1 } });
    if (!lastUser || !lastUser.user_code)
        return '#UPS001';
    const lastCode = parseInt(lastUser.user_code.replace('#UPS', ''));
    const newCode = lastCode + 1;
    return `#UPS${newCode.toString().padStart(3, '0')}`;
};
const registerUser = async (name, email, password, // Password đã được hash
avatar, address, phone) => {
    const user_code = await generateUserCode();
    await (0, authModel_1.addUser)({ user_code, avatar, name, address, phone, email, password });
};
exports.registerUser = registerUser;
const validateUserVerificationCode = async (email, code) => {
    return await (0, email_1.validateVerificationCode)(email, code);
};
exports.validateUserVerificationCode = validateUserVerificationCode;
const sendUserVerificationEmail = async (email) => {
    await (0, email_1.sendVerificationEmail)(email);
};
exports.sendUserVerificationEmail = sendUserVerificationEmail;
