"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const menuController_1 = __importDefault(require("../controllers/menuController"));
// Tạo handler để xử lý lỗi
const getMenuItemsHandler = async (req, res, next) => {
    try {
        const customReq = req;
        await menuController_1.default.getMenuItems(customReq, res);
    }
    catch (error) {
        next(error);
    }
};
const router = (0, express_1.Router)();
router.get('/', getMenuItemsHandler);
exports.default = router;
