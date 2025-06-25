"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reviewController_1 = require("../../controllers/review/reviewController");
const router = express_1.default.Router();
router.get('/', reviewController_1.getReviews);
router.post('/', reviewController_1.postReview);
exports.default = router;
