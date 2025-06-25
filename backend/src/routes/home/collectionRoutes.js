"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const collectionController_1 = require("../../controllers/home/collectionController");
const getCollectionsHandler = async (req, res, next) => {
    try {
        const customReq = req;
        await (0, collectionController_1.getCollections)(customReq, res);
    }
    catch (error) {
        next(error);
    }
};
const router = express_1.default.Router();
router.get('/', getCollectionsHandler);
exports.default = router;
