"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const articleController_1 = require("../../controllers/home/articleController");
const getArticlesHandler = async (req, res, next) => {
    const customReq = req;
    try {
        await (0, articleController_1.getArticles)(customReq, res);
        console.log('Finished handling GET /api/articles');
    }
    catch (error) {
        console.error('Error in getArticlesHandler:', error);
        next(error);
    }
};
const createArticleRouteHandler = async (req, res, next) => {
    const customReq = req;
    try {
        await (0, articleController_1.createArticleHandler)(customReq, res);
        console.log('Finished handling POST /api/articles');
    }
    catch (error) {
        console.error('Error in createArticleRouteHandler:', error);
        next(error);
    }
};
const router = express_1.default.Router();
router.get('/', getArticlesHandler);
router.post('/', createArticleRouteHandler);
exports.default = router;
