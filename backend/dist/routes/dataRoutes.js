"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dataController_1 = require("../controllers/dataController"); // Bỏ addData vì không tồn tại
// Tạo handler để xử lý lỗi
const getDataHandler = async (req, res, next) => {
    try {
        const customReq = req; // Type assertion to CustomRequest
        await (0, dataController_1.getData)(customReq, res);
    }
    catch (error) {
        next(error);
    }
};
const router = express_1.default.Router();
router.get('/data', getDataHandler);
exports.default = router;
