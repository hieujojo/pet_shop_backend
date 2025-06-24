"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.logResponse = exports.checkAndSetDb = exports.logRequestTime = void 0;
const db_1 = require("../config/db");
// Middleware để log thời gian xử lý request
const logRequestTime = (req, res, next) => {
    const customReq = req;
    console.log(`Starting logRequestTime for ${customReq.method} ${customReq.url}`);
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${customReq.method} ${customReq.url} took ${duration}ms`);
    });
    next();
};
exports.logRequestTime = logRequestTime;
// Middleware để kiểm tra và gán req.db
const checkAndSetDb = async (req, res, next) => {
    const customReq = req;
    try {
        console.log(`Setting db for ${customReq.method} ${customReq.url}`);
        const dbInstance = await (0, db_1.getDb)();
        customReq.db = dbInstance;
        console.log(`Db set for ${customReq.method} ${customReq.url}, Namespace:`, dbInstance.namespace);
        next();
    }
    catch (error) {
        console.error('Database not ready for request:', customReq.method, customReq.url, error);
        res.status(503).json({ error: 'Service unavailable: Database not ready' });
    }
};
exports.checkAndSetDb = checkAndSetDb;
// Middleware để log response trước khi gửi
const logResponse = (req, res, next) => {
    const customReq = req;
    console.log(`Processing response for ${customReq.method} ${customReq.url}`);
    const originalJson = res.json;
    res.json = function (data) {
        try {
            console.log(`Sending response for ${customReq.method} ${customReq.url}:`, data);
            return originalJson.call(this, data);
        }
        catch (error) {
            console.error(`Error sending response for ${customReq.method} ${customReq.url}:`, error);
            res.status(500).json({ error: 'Failed to send response' });
            return this;
        }
    };
    next();
};
exports.logResponse = logResponse;
// Middleware xử lý lỗi
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal Server Error: ' + err.message });
};
exports.errorHandler = errorHandler;
