"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReviews = getReviews;
exports.postReview = postReview;
const reviewModel_1 = require("../../models/review/reviewModel");
const db_1 = require("../../config/db");
const mongodb_1 = require("mongodb");
// Lấy danh sách tất cả đánh giá
async function getReviews(req, res) {
    try {
        const reviews = await (0, reviewModel_1.getAllReviews)();
        res.json(reviews);
    }
    catch (err) {
        res.status(500).json({ error: 'Lỗi server' });
    }
}
// Gửi đánh giá mới
async function postReview(req, res) {
    try {
        const { productId, email, username, rating, comment } = req.body;
        // Kiểm tra dữ liệu
        if (!productId || !email || !username || !rating || rating < 1 || rating > 5) {
            res.status(400).json({ error: 'Dữ liệu không hợp lệ. Yêu cầu productId, email, username, và rating (1-5).' });
            return;
        }
        const review = await (0, reviewModel_1.createReview)({
            productId,
            email,
            username,
            rating: Number(rating),
            comment: comment || '',
        });
        // Cập nhật thống kê sản phẩm
        await (0, reviewModel_1.updateProductStats)(productId);
        // Thêm productTitle vào response
        const db = await (0, db_1.getDb)();
        const product = await db.collection('products').findOne({ _id: new mongodb_1.ObjectId(productId) });
        review.productTitle = (product === null || product === void 0 ? void 0 : product.title) || 'Unknown Product';
        res.json(review);
    }
    catch (err) {
        res.status(400).json({ error: 'Lỗi khi gửi đánh giá' });
    }
}
