"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionMiddleware = void 0;
const express_session_1 = __importDefault(require("express-session"));
const connect_mongo_1 = __importDefault(require("connect-mongo"));
const sessionMiddleware = (app) => {
    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret) {
        throw new Error('SESSION_SECRET không được định nghĩa trong biến môi trường');
    }
    app.use((0, express_session_1.default)({
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        store: connect_mongo_1.default.create({
            mongoUrl: process.env.MONGO_URI,
            collectionName: 'sessions',
        }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24, // 1 ngày
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        },
    }));
};
exports.sessionMiddleware = sessionMiddleware;
