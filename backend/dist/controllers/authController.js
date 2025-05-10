"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleLogin = exports.verifyEmail = exports.register = exports.login = void 0;
const authService_1 = require("../services/authService");
const userService_1 = require("../services/userService");
const authService_2 = require("../services/authService");
const authService_3 = require("../services/authService");
const jwt_decode_1 = __importDefault(require("jwt-decode"));
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const user = (0, userService_1.findUserByEmail)(email);
    if (!user || !user.password || !(yield (0, authService_3.comparePassword)(password, user.password))) {
        return res.status(400).json({ message: "Email hoặc mật khẩu không đúng!" });
    }
    const authToken = (0, authService_1.generateToken)({ email: user.email });
    res.json({ message: "Đăng nhập thành công!", user: { username: user.username, email: user.email }, token: authToken });
});
exports.login = login;
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, password, confirmPassword } = req.body;
    if (!email || !password || !confirmPassword) {
        return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin." });
    }
    if (password !== confirmPassword) {
        return res.status(400).json({ message: "Mật khẩu xác nhận không khớp." });
    }
    if ((0, userService_1.findUserByEmail)(email)) {
        return res.status(400).json({ message: "Email đã tồn tại!" });
    }
    const hashedPassword = yield (0, authService_3.hashPassword)(password);
    (0, userService_1.addUser)({ username, email, password: hashedPassword });
    yield (0, authService_2.sendVerificationEmail)(email);
    res.json({ message: "Đăng ký thành công! Vui lòng kiểm tra email.", user: { username, email } });
});
exports.register = register;
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, verificationCode } = req.body;
    if (!(0, authService_2.validateVerificationCode)(email, verificationCode)) {
        return res.status(400).json({ message: "Mã xác thực không đúng!" });
    }
    const authToken = (0, authService_1.generateToken)({ email });
    res.json({ message: "Xác thực thành công!", token: authToken });
});
exports.verifyEmail = verifyEmail;
const googleLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.body;
    const decoded = (0, jwt_decode_1.default)(token);
    let user = (0, userService_1.findUserByEmail)(decoded.email);
    if (!user) {
        user = { email: decoded.email, username: decoded.name };
        (0, userService_1.addUser)(user);
    }
    const authToken = (0, authService_1.generateToken)({ email: user.email });
    res.json({ message: "Đăng nhập bằng Google thành công!", user, token: authToken });
});
exports.googleLogin = googleLogin;
