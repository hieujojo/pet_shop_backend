"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const brandController_1 = require("../../controllers/home/brandController");
const getBrandsHandler = async (req, res, next) => {
    try {
        const customReq = req;
        await (0, brandController_1.getBrands)(customReq, res);
    }
    catch (error) {
        next(error);
    }
};
const router = express_1.default.Router();
router.get('/', getBrandsHandler);
exports.default = router;
