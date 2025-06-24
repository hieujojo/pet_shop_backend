"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const productController_1 = require("../../controllers/home/productController");
const getProductsHandler = async (req, res, next) => {
    try {
        const customReq = req;
        await (0, productController_1.getProducts)(customReq, res);
    }
    catch (error) {
        next(error);
    }
};
const searchProductsHandlerWrapper = async (req, res, next) => {
    try {
        const customReq = req;
        await (0, productController_1.searchProductsHandler)(customReq, res);
    }
    catch (error) {
        next(error);
    }
};
const getProductByIdHandlerWrapper = async (req, res, next) => {
    try {
        const customReq = req;
        await (0, productController_1.getProductByIdHandler)(customReq, res);
    }
    catch (error) {
        next(error);
    }
};
// Thêm wrapper cho createProductHandler
const createProductHandlerWrapper = async (req, res, next) => {
    try {
        const customReq = req;
        await (0, productController_1.createProductHandler)(customReq, res);
    }
    catch (error) {
        next(error);
    }
};
const router = express_1.default.Router();
router.get('/', getProductsHandler);
router.get('/search', searchProductsHandlerWrapper);
router.get('/:id', getProductByIdHandlerWrapper);
router.post('/', createProductHandlerWrapper); // Thêm route POST
exports.default = router;
